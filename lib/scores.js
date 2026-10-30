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

export function fmtScore(v) {
  return v == null ? "—" : String(v);
}

export function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
