// Helper skor bersama: dipakai dashboard, detail scan, dan halaman lain.
// Sumber datanya SELALU dari backend (/api/v2/history, /api/v2/dashboard).
// Tidak ada skor contoh / skor karangan di sini: kalau tidak ada
// analysis, hasilnya null dan halaman menampilkan "—" / empty state.

export const SCORE_KEYS = [
  ["acne_score", "Jerawat"],
  ["dry_skin_score", "Kulit kering"],
  ["oily_skin_score", "Kulit berminyak"],
  ["dark_spots_score", "Dark spots"],
  ["wrinkles_score", "Kerutan"],
  ["overall_score", "Skor keseluruhan"],
];

export function pickAnalysis(scan) {
  if (!scan) return null;
  return scan.analysis || scan.analysis_result || scan.result || null;
}

// Rata-rata dari semua scan yang punya analysis (bukan dari scan
// yang masih processing / gagal, karena mereka tidak punya skor).
export function averageScores(scans) {
  const list = (scans || []).map(pickAnalysis).filter(Boolean);
  if (list.length === 0) return null;
  const out = {};
  for (const [key] of SCORE_KEYS) {
    const vals = list.map((a) => a[key]).filter((v) => v != null && !Number.isNaN(Number(v)));
    out[key] = vals.length ? Math.round((vals.reduce((s, v) => s + Number(v), 0) / vals.length) * 10) / 10 : null;
  }
  out.count = list.length;
  return out;
}

// Scan terbaru yang sudah punya analysis (urutan backend: terbaru dulu).
export function latestAnalyzedScan(scans) {
  return (scans || []).find((s) => pickAnalysis(s)) || null;
}

// Scan terbaru apa pun statusnya (backend sudah mengurutkan terbaru dulu).
// Dipakai halaman Diagnosis untuk "Scan Terakhir": scan yang gagal pun
// tetap scan terakhir — sebelumnya halaman itu memakai
// latestAnalyzedScan, sehingga scan gagal tidak pernah menjadi "terakhir"
// dan Diagnosis terus menampilkan scan lama yang sudah selesai.
export function latestScan(scans) {
  return (scans || [])[0] || null;
}

// Scan teranalisis SEBELUMNYA dari `scan`: scan yang lebih lama yang
// punya analysis, dicari ke arah bawah daftar (backend mengurutkan
// terbaru dulu). Dipakai untuk membandingkan tiap scan dengan scan
// sebelumnya — bukan dengan scan terbaru, karena membandingkan sebuah
// scan dengan dirinya sendiri tidak ada artinya. Kalau `scan` tidak
// ketemu di daftar, atau tidak ada scan teranalisis yang lebih lama,
// hasilnya null.
export function previousAnalyzedScan(scans, scan) {
  const list = scans || [];
  if (!scan || scan.id == null) return null;
  const idx = list.findIndex((s) => s && s.id === scan.id);
  if (idx < 0) return null;
  for (let i = idx + 1; i < list.length; i++) {
    if (pickAnalysis(list[i])) return list[i];
  }
  return null;
}

// Selisih skor scan ini vs scan sebelumnya, per kunci skor.
// Untuk overall_score, naik = membaik (skor kesehatan naik); untuk
// 5 kondisi, naik = memburuk (tingkat masalahnya naik). `same` benar
// bila selisihnya 0 setelah dibulatkan ke 1 desimal. Kalau salah satu
// scan tidak punya analysis, hasilnya null.
export function compareScores(current, previous) {
  const cur = pickAnalysis(current);
  const prev = pickAnalysis(previous);
  if (!cur || !prev) return null;
  const out = {};
  for (const [key, label] of SCORE_KEYS) {
    const c = Number(cur[key]);
    const p = Number(prev[key]);
    if (!Number.isFinite(c) || !Number.isFinite(p)) {
      out[key] = null;
      continue;
    }
    const delta = Math.round((c - p) * 10) / 10;
    out[key] = {
      label,
      current: c,
      previous: p,
      delta,
      same: delta === 0,
      // overall naik = membaik; kondisi naik = memburuk.
      better: key === "overall_score" ? delta > 0 : delta < 0,
    };
  }
  return out;
}

export function fmtScore(v) {
  return v == null ? "—" : String(v);
}

// Parse an ISO timestamp. Backend stores UTC wall-clock (datetime.utcnow)
// and older responses carry no offset; a naive ISO string must be read as
// UTC, otherwise browsers treat it as local time and WIB users see times
// 7 hours behind reality (e.g. a scan at 11:13 WIB shown as 04:13).
function parseTimestamp(iso) {
  if (!iso) return null;
  const s = String(iso).trim();
  const hasOffset = /([+-]\d{2}:?\d{2}|Z)$/.test(s);
  const d = new Date(hasOffset || !s.includes("T") ? s : s + "Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDate(iso) {
  const d = parseTimestamp(iso);
  if (!d) return "—";
  try {
    return d.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// Tanggal ringkas untuk label kecil, mis. "5 Nov 2026".
export function fmtDateShort(iso) {
  const d = parseTimestamp(iso);
  if (!d) return "—";
  try {
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

// Jam saja, mis. "11.13" — dipakai jam pesan chat.
export function fmtTime(iso) {
  const d = parseTimestamp(iso);
  if (!d) return "—";
  try {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
