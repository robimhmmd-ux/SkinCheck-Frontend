"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Activity,
  Award,
  Package,
  BarChart3,
  CheckCircle2
} from "lucide-react";
import { getAdminTrends, pickObject } from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";
import WorkspaceLoadingScreen from "../../../components/WorkspaceLoadingScreen";
import AdminDenied from "../../../components/AdminDenied";

export default function AdminTrendsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    getAdminTrends()
      .then((d) => {
        if (alive) setData(pickObject(d));
      })
      .catch((e) => {
        if (!alive) return;
        if (e.status === 401 || e.status === 403) setDenied(true);
        else setError(e);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (denied) return <AdminDenied />;

  if (loading) {
    return <WorkspaceLoadingScreen caption="Mengalkulasi Distribusi Tren Dermatologi…" />;
  }

  if (error || !data) {
    return (
      <div className="admin-stage-container" style={{ textAlign: "center", padding: "48px 20px" }}>
        <div className="admin-glass-card" style={{ maxWidth: "480px", margin: "0 auto", padding: "36px" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginBottom: "8px" }}>
            Gagal Memuat Tren Scan
          </h2>
          <ErrorBox error={error} />
        </div>
      </div>
    );
  }

  const conditions = Array.isArray(data.conditions) ? data.conditions : [];
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
  const dominant = data.dominant || null;
  const analyzed = data.analyzed_scans || 0;

  return (
    <div className="admin-stage-container">
      {/* ── Page Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <h1>Tren Masalah Kulit Customer</h1>
          <p>
            Rata-rata 5 parameter VGG16 dari {analyzed} scan yang telah dianalisis • Rata-rata kesehatan kulit global: <strong>{data.avg_overall ?? "—"}/100</strong>
          </p>
        </div>
      </div>

      {analyzed === 0 ? (
        <div className="admin-glass-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginTop: 0 }}>
            Belum Ada Pemindaian yang Selesai Dianalisis
          </h3>
          <p className="muted" style={{ maxWidth: "480px", margin: "0 auto", fontSize: "13.5px" }}>
            Ketika customer menyelesaikan scan wajah dan inferensi selesai, statistik rata-rata dan rekomendasi formulasi akan ditampilkan di sini.
          </p>
        </div>
      ) : (
        <>
          {/* ── Distribusi Rata-rata Skor 5 Kondisi ── */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <BarChart3 size={16} color="var(--brand-navy)" />
                Distribusi Rata-rata Skor Kondisi Kulit (VGG16)
              </div>
              <span className="admin-card-badge">Skala 0 – 100</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {conditions.map((c, i) => {
                const isTop = dominant && c.key === dominant.key;

                return (
                  <div key={c.key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: isTop ? 700 : 600, color: "var(--brand-navy)", fontSize: "13.5px" }}>
                        {c.label}
                        {isTop && (
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              background: "rgba(217, 136, 42, 0.12)",
                              color: "var(--amber-700)",
                              fontWeight: 700
                            }}
                          >
                            Paling Menonjol
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: "12.5px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                        <strong style={{ color: "var(--brand-navy)" }}>{c.avg_score}</strong> / 100
                        {" • "}signifikan di <strong>{c.pct_significant}%</strong> scan
                      </span>
                    </div>

                    <div style={{ width: "100%", height: "8px", background: "rgba(15, 23, 42, 0.05)", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(0, Math.min(100, c.avg_score || 0))}%`,
                          borderRadius: "999px",
                          background: isTop ? "var(--brand-amber)" : "var(--brand-navy)",
                          transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Highlight Kondisi Dominan ── */}
          {dominant && (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.28)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255, 255, 255, 0.45)",
                borderRadius: "20px",
                padding: "20px 24px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.6)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <Award size={18} color="var(--brand-amber)" />
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", color: "#111422", margin: 0, fontWeight: 700 }}>
                  Kondisi Paling Menonjol: {dominant.label}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#1e293b", lineHeight: 1.6 }}>
                Rata-rata skor {dominant.label.toLowerCase()} mencapai <strong>{dominant.avg_score}/100</strong>, tertinggi di antara 5 parameter uji dan muncul signifikan (skor ≥ 40) pada <strong>{dominant.pct_significant}%</strong> dari seluruh scan. Formula yang menargetkan kondisi ini disarankan diprioritaskan.
              </p>
            </div>
          )}

          {/* ── Rekomendasi Produk Katalog Per Kondisi ── */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Package size={16} color="var(--brand-navy)" />
                Produk Katalog yang Cocok Per Kondisi
              </div>
              <span className="admin-card-badge">Bahan Aktif Terkurasi</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              {recommendations.map((rec) => (
                <div
                  key={rec.condition_key}
                  style={{
                    border: "1px solid rgba(15, 23, 42, 0.07)",
                    borderRadius: "12px",
                    padding: "14px",
                    background: "#ffffff"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px", borderBottom: "1px solid rgba(15, 23, 42, 0.05)", paddingBottom: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 700, color: "var(--brand-navy)" }}>
                      {rec.condition_label}
                    </h4>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      Rata-rata {rec.avg_score}
                    </span>
                  </div>

                  {rec.products.length === 0 ? (
                    <div style={{ padding: "8px 0" }}>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px" }}>
                        Belum ada produk aktif untuk kondisi ini.
                      </p>
                      <div style={{ display: "flex", gap: "8px", fontSize: "11.5px" }}>
                        <Link href="/admin/ai-copilot" style={{ color: "var(--brand-amber)", fontWeight: 600 }}>
                          Cek AI Copilot →
                        </Link>
                        <Link href="/admin/products" style={{ color: "var(--brand-navy)", fontWeight: 600 }}>
                          + Tambah Produk
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {rec.products.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: "#FAF9F5",
                            border: "1px solid rgba(15, 23, 42, 0.04)"
                          }}
                        >
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--brand-navy)", display: "block" }}>
                            {p.brand ? `${p.brand} ${p.name}` : p.name}
                          </span>
                          {Array.isArray(p.ingredients) && p.ingredients.length > 0 ? (
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                              {p.ingredients.slice(0, 3).map((ing, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    padding: "1px 5px",
                                    borderRadius: "3px",
                                    fontSize: "10px",
                                    background: "rgba(15, 23, 42, 0.05)",
                                    color: "var(--brand-navy)"
                                  }}
                                >
                                  {ing}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                              Kandungan aktif belum diisi
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
