"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History,
  Camera,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { getHistory, pickArray } from "../../lib/api";
import {
  pickAnalysis,
  fmtScore,
  fmtDate,
  fmtDateShort,
  latestScan,
  averageScores,
  previousAnalyzedScan,
  compareScores,
  SCORE_KEYS,
} from "../../lib/scores";
import { ErrorBox, Loading } from "../../components/Notice";

const STATUS_LABEL = { completed: "Selesai", processing: "Diproses", failed: "Gagal" };

// Baris metrik kecil (label + nilai + meter), memakai class global yang
// sama dengan halaman detail scan supaya tampilannya konsisten.
function MiniMetricRow({ label, value, colorClass = "amber" }) {
  const num = Number(value);
  const finite = value != null && Number.isFinite(num);
  const pct = finite ? Math.max(0, Math.min(100, num)) : 0;
  return (
    <div className="detail-metric-row">
      <div className="detail-metric-labels">
        <span className="metric-label-text">{label}</span>
        <strong className="metric-value-text">{finite ? `${num}%` : "—"}</strong>
      </div>
      <div className="detail-meter-track" aria-hidden="true">
        <div className={`detail-meter-fill fill-${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getHistory()
      .then((d) => {
        if (alive) setItems(pickArray(d));
      })
      .catch((e) => {
        if (alive) setError(e);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // ── Diagnosis Terkini (dulu halaman /output yang terpisah) ──
  // "Scan Terakhir" = scan terbaru apa pun statusnya; rata-rata tetap
  // hanya dari scan yang punya analysis.
  const latest = latestScan(items);
  const latestAnalysis = pickAnalysis(latest);
  const avg = averageScores(items);
  const totalScans = items.length;
  const analyzedCount = avg ? avg.count : 0;
  const successRate = totalScans && analyzedCount ? Math.round((analyzedCount / totalScans) * 100) : 0;
  const latestStatus = latest ? (STATUS_LABEL[latest.status] || latest.status || "—") : null;
  const prevOfLatest = latest ? previousAnalyzedScan(items, latest) : null;
  const cmpLatest = latest && prevOfLatest ? compareScores(latest, prevOfLatest) : null;
  const overallDelta = cmpLatest && cmpLatest.overall_score ? cmpLatest.overall_score.delta : null;
  // Kondisi dengan skor tertinggi di scan terakhir = fokus utama.
  let topFinding = null;
  if (latestAnalysis) {
    for (const [key, label] of SCORE_KEYS) {
      if (key === "overall_score") continue;
      const v = Number(latestAnalysis[key]);
      if (Number.isFinite(v) && (topFinding === null || v > topFinding.value)) topFinding = { label, value: v };
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <div className="badge badge-amber" style={{ marginBottom: "8px" }}>
          <History size={13} aria-hidden="true" />
          <span>REKAM MEDIS KULIT WAJAH</span>
        </div>
        {/* Judul + deskripsi navy (roboy 2026-11-12, desain.md §1.3):
            tadinya putih di atas base terang sehingga tidak terbaca. */}
        <h1 style={{ color: "var(--text-main)" }}>Riwayat &amp; Diagnosis</h1>
        <p style={{ color: "var(--text-main)", fontWeight: 600, fontSize: "15px", margin: "4px 0 0", lineHeight: 1.6 }}>
          Diagnosis terkini dari scan terbarumu di atas, diikuti arsip kronologis seluruh evaluasi kulit
          wajahmu. Setiap scan tersimpan dan dibandingkan dengan scan sebelumnya.
        </p>
      </div>

      <ErrorBox error={error} />

      {loading ? (
        <Loading label="Memuat riwayat arsip scan kulit…" />
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "64px 24px", color: "#111422" }}>
          <Camera size={36} color="var(--brand-amber)" style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: "22px", marginBottom: "8px", color: "#111422", fontWeight: 700 }}>Belum Ada Riwayat Pemeriksaan</h2>
          <p style={{ fontSize: "14.5px", maxWidth: "420px", margin: "0 auto 20px", color: "#334155", lineHeight: 1.6 }}>
            Lakukan scan pertama sekarang untuk mulai merekam kondisi kulit wajahmu.
          </p>
          <Link href="/scan" className="btn btn-amber">
            Mulai Scan Pertama
          </Link>
        </div>
      ) : (
        <>
          {/* ── Panel Diagnosis Terkini (gabungan dari /output) ── */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              <span className="badge badge-navy">
                <Sparkles size={13} aria-hidden="true" /> Diagnosis Terkini
              </span>
              {latest && (
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Scan terakhir: {fmtDate(latest.created_at || latest.created)}
                </span>
              )}
              {latestStatus && (
                <span className={`badge ${latestStatus === "Selesai" ? "badge-success" : latestStatus === "Gagal" ? "badge-danger" : "badge-warning"}`}>
                  {latestStatus}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "44px", fontWeight: 800, lineHeight: 1, fontFamily: "var(--font-serif)" }}>
                {latestAnalysis && latestAnalysis.overall_score != null ? fmtScore(latestAnalysis.overall_score) : "—"}
                <span style={{ fontSize: "20px" }}>%</span>
              </span>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                Skor Kesehatan Kulit Keseluruhan
              </span>
              {overallDelta != null && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: overallDelta > 0 ? "#15803d" : overallDelta < 0 ? "#b91c1c" : "var(--text-muted)",
                  }}
                >
                  {overallDelta > 0 ? `▲ +${overallDelta}` : overallDelta < 0 ? `▼ ${overallDelta}` : "— 0"} vs scan
                  sebelumnya {overallDelta > 0 ? "(membaik)" : overallDelta < 0 ? "(menurun)" : ""}
                </span>
              )}
            </div>

            {latest && !latestAnalysis && (
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: "8px 0 0" }}>
                Pemindaian {fmtDate(latest.created_at || latest.created)} belum berhasil dianalisis.
              </p>
            )}
            {topFinding && (
              <p style={{ fontSize: "13.5px", margin: "8px 0 0" }}>
                Fokus Utama: <strong>{topFinding.label} ({topFinding.value}%)</strong> menunjukkan persentase
                tertinggi yang membutuhkan perawatan tertarget.
              </p>
            )}

            {latestAnalysis && (
              <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "4px 32px" }}>
                {SCORE_KEYS.filter(([key]) => key !== "overall_score").map(([key, label]) => (
                  <MiniMetricRow key={key} label={label} value={latestAnalysis[key]} colorClass="amber" />
                ))}
              </div>
            )}

            {avg && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--sand-100)" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                  Rata-rata dari {avg.count} scan teranalisis
                </div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-muted)" }}>
                  {SCORE_KEYS.map(([key, label]) => (
                    <span key={key}>
                      {label}: <strong style={{ color: "var(--brand-navy)" }}>{avg[key] != null ? `${avg[key]}%` : "—"}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
              {totalScans} sesi tercatat · {analyzedCount} tuntas teranalisis · {successRate}% berhasil
              {latest && (
                <>
                  {" · "}
                  <Link href={`/history/${latest.id}`} style={{ fontWeight: 600 }}>
                    Inspeksi scan terakhir
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ── Arsip kronologis + perbandingan per scan ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map((s, i) => {
              const analysis = pickAnalysis(s);
              const score = analysis ? Number(analysis.overall_score) : null;
              // Nama scan = tanggal scan, bukan #ID.
              const dateLabel = fmtDate(s.created_at || s.created);
              const dateBadge = fmtDateShort(s.created_at || s.created);
              // Perbandingan dengan scan teranalisis sebelumnya (lebih lama).
              const prev = analysis ? previousAnalyzedScan(items, s) : null;
              const cmp = prev ? compareScores(s, prev) : null;

              return (
                <div
                  key={s.id || i}
                  className="glass-panel"
                  style={{
                    padding: "18px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "14px",
                        background: "var(--sand-100)",
                        color: "var(--brand-navy)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--font-serif)",
                        fontSize: "13px",
                        fontWeight: 700,
                        textAlign: "center",
                        lineHeight: 1.2,
                      }}
                    >
                      {dateBadge}
                    </div>
                    <div>
                      <Link
                        href={`/history/${s.id}`}
                        style={{ fontSize: "16px", fontWeight: 700, color: "var(--brand-navy)" }}
                      >
                        Pemeriksaan Wajah • {dateLabel}
                      </Link>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span>{dateLabel}</span>
                        <span>·</span>
                        <span>Status: {STATUS_LABEL[s.status] || s.status || "—"}</span>
                        {s.image_quality_score != null && (
                          <>
                            <span>·</span>
                            <span>Kualitas Foto: {s.image_quality_score}/100</span>
                          </>
                        )}
                      </div>
                      {/* Perbandingan vs scan sebelumnya */}
                      {analysis && (
                        <div style={{ fontSize: "12.5px", marginTop: "6px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {prev && cmp ? (
                            <>
                              <span style={{ color: "var(--text-muted)" }}>
                                vs {fmtDateShort(prev.created_at || prev.created)}:
                              </span>
                              {SCORE_KEYS.map(([key]) => {
                                const d = cmp[key];
                                if (!d) return null;
                                const sign = d.delta > 0 ? "+" : "";
                                const color = d.same
                                  ? "var(--text-muted)"
                                  : d.better
                                    ? "#15803d"
                                    : "#b91c1c";
                                return (
                                  <span key={key} style={{ color, fontWeight: 600 }}>
                                    {d.label} {sign}
                                    {d.delta}
                                  </span>
                                );
                              })}
                            </>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>
                              Scan teranalisis pertama — belum ada pembanding.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {score != null ? (
                      <span className="badge badge-amber" style={{ fontSize: "14px", fontWeight: 700, padding: "6px 14px" }}>
                        Skor {fmtScore(score)}%
                      </span>
                    ) : (
                      <span className="badge badge-navy">
                        {STATUS_LABEL[s.status] || s.status}
                      </span>
                    )}

                    <Link href={`/history/${s.id}`} className="btn btn-secondary btn-sm">
                      <span>Lihat Detail</span>
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
