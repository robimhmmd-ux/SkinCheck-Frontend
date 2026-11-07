// Pusat notifikasi in-app Laomera.
//
// TIDAK ada endpoint notifikasi di backend: daftar ini dibangun dari
// data yang memang sudah bisa diambil frontend (riwayat scan customer,
// audit scan admin). Isinya selalu kejadian nyata dari API, bukan
// notifikasi karangan. Status dibaca disimpan di localStorage per user;
// daftar dihitung ulang tiap pindah halaman, tiap panel dibuka, dan
// tiap halaman scan selesai (event laomera:notifications-refresh).
import { pickAnalysis, fmtScore, fmtDateShort } from "./scores";

const MAX_ITEMS = 10;

export const NOTIFICATIONS_REFRESH_EVENT = "laomera:notifications-refresh";

const CONDITION_KEYS = [
  ["acne_score", "Jerawat"],
  ["dry_skin_score", "Kulit kering"],
  ["oily_skin_score", "Kulit berminyak"],
  ["dark_spots_score", "Dark spots"],
  ["wrinkles_score", "Kerutan"],
];

function topCondition(analysis) {
  let best = null;
  for (const [key, label] of CONDITION_KEYS) {
    const v = Number(analysis?.[key]);
    if (Number.isFinite(v) && (!best || v > best.v)) best = { label, v };
  }
  return best;
}

// Backend menyimpan created_at sebagai UTC wall-clock tanpa offset;
// tanpa "Z" browser membacanya sebagai waktu lokal (WIB jadi mundur 7 jam).
function toDate(value) {
  if (!value) return null;
  const s = String(value);
  const d = new Date(/Z|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function timeAgo(value) {
  const d = toDate(value);
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 0) return "baru saja";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  if (h < 48) return "kemarin";
  return fmtDateShort(value);
}

export function buildNotificationsFromScans(scans, { admin = false } = {}) {
  const list = Array.isArray(scans) ? scans : [];
  return list.slice(0, MAX_ITEMS).map((scan) => {
    const analysis = pickAnalysis(scan);
    const id = `scan-${scan.id}`;
    const owner = scan.owner?.name || scan.user_name || scan.user?.name || null;
    const overall = analysis ? Number(analysis.overall_score) : null;
    const top = analysis ? topCondition(analysis) : null;
    const href = admin ? "/admin/scans" : `/history/${scan.id}`;
    const createdAt = scan.created_at || scan.created;

    if (scan.status === "completed" && analysis) {
      return {
        id,
        type: "scan-success",
        title: admin && owner ? `Scan selesai — ${owner}` : "Scan selesai",
        body: Number.isFinite(overall)
          ? `Skor keseluruhan ${fmtScore(overall)}%${top ? ` · ${top.label} ${fmtScore(top.v)}%` : ""}`
          : "Hasil analisis sudah tersedia.",
        href,
        createdAt,
      };
    }
    if (scan.status === "failed") {
      return {
        id,
        type: "scan-failed",
        title: admin && owner ? `Scan gagal — ${owner}` : "Scan gagal dianalisis",
        body: `Scan ${fmtDateShort(createdAt)} tidak berhasil dianalisis.`,
        href,
        createdAt,
      };
    }
    return {
      id,
      type: "scan-processing",
      title: admin && owner ? `Scan diproses — ${owner}` : "Scan sedang diproses",
      body: "Hasilnya akan muncul di Riwayat & Diagnosis.",
      href,
      createdAt,
    };
  });
}

function readKey(userId) {
  return userId ? `laomera_notif_read_${userId}` : "laomera_notif_read";
}

// Notifikasi verifikasi akun (permintaan dosen, 2026-11-07).
// Admin: akun baru yang mendaftar tapi belum verifikasi + akun yang baru
// saja menyelesaikan verifikasi (keduanya dari blok `verification`
// GET /api/v2/admin/dashboard). Customer: pengingat untuk menyelesaikan
// verifikasi akunnya sendiri (dari status sesi getMe).
export function buildNotificationsFromVerification(verification, { admin = false, user = null } = {}) {
  const v = verification || {};
  const out = [];
  if (admin) {
    for (const a of v.pending_accounts || []) {
      out.push({
        id: `verify-pending-${a.id}`,
        type: a.status === "awaiting_biodata" ? "verify-otp" : "verify-pending",
        title: `Akun baru mendaftar — ${a.name}`,
        body:
          a.status === "awaiting_biodata"
            ? "OTP WhatsApp terverifikasi, biodata belum lengkap."
            : "Mendaftar tapi belum memverifikasi akun.",
        href: "/admin/users",
        createdAt: a.created_at,
      });
    }
    for (const r of v.recently_verified || []) {
      out.push({
        id: `verify-done-${r.user_id}-${r.created_at}`,
        type: "verify-done",
        title: `${r.name} sudah terverifikasi`,
        body:
          r.activity === "Melengkapi biodata — verifikasi akun selesai"
            ? "Sudah verifikasi OTP WA dan menyelesaikan biodata."
            : "Sudah verifikasi kode OTP WA.",
        href: "/admin/users",
        createdAt: r.created_at,
      });
    }
    return out;
  }
  if (user && (user.status === "pending" || user.status === "awaiting_biodata")) {
    out.push({
      id: `verify-self-${user.id}`,
      type: "verify-pending",
      title: "Selesaikan verifikasi akun Anda",
      body:
        user.status === "awaiting_biodata"
          ? "OTP terverifikasi — tinggal lengkapi biodata."
          : "Verifikasi nomor WhatsApp dan lengkapi biodata untuk membuka semua fitur.",
      href: "/dashboard",
      createdAt: null,
    });
  }
  return out;
}

export function loadReadIds(userId) {
  try {
    const raw = localStorage.getItem(readKey(userId));
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveReadIds(userId, ids) {
  try {
    localStorage.setItem(readKey(userId), JSON.stringify([...ids]));
  } catch {
    // localStorage penuh / tidak tersedia: status dibaca tidak tersimpan.
  }
}
