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
import { pickAnalysis, fmtScore, fmtDate, fmtDateShort } from "../../lib/scores";
import { ErrorBox, Loading } from "../../components/Notice";

const STATUS_LABEL = { completed: "Selesai", processing: "Diproses", failed: "Gagal" };

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <div className="badge badge-amber" style={{ marginBottom: "8px" }}>
          <History size={13} aria-hidden="true" />
          <span>REKAM MEDIS KULIT WAJAH</span>
        </div>
        <h1>Riwayat Pemeriksaan Scan</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14.5px", margin: "4px 0 0" }}>
          Arsip kronologis seluruh evaluasi kulit wajahmu untuk memantau kemajuan perawatan.
        </p>
      </div>

      <ErrorBox error={error} />

      {loading ? (
        <Loading label="Memuat riwayat arsip scan kulit…" />
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
          <Camera size={36} color="var(--brand-amber)" style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Belum Ada Riwayat Pemeriksaan</h2>
          <p style={{ fontSize: "14px", maxWidth: "420px", margin: "0 auto 20px" }}>
            Lakukan scan pertama sekarang untuk mulai merekam kondisi kulit wajahmu.
          </p>
          <Link href="/scan" className="btn btn-amber">
            Mulai Scan Pertama
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((s, i) => {
            const analysis = pickAnalysis(s);
            const score = analysis ? Number(analysis.overall_score) : null;
            // Nama scan = tanggal scan, bukan #ID.
            const dateLabel = fmtDate(s.created_at || s.created);
            const dateBadge = fmtDateShort(s.created_at || s.created);

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
      )}
    </div>
  );
}
