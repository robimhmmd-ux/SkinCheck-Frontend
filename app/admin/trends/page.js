"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Activity,
  Flame,
  Droplets,
  Zap,
  Sun,
  Sparkles,
  Award,
  Package,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getAdminTrends, pickObject } from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";

const CONDITION_ICONS = {
  acne: Flame,
  dry_skin: Droplets,
  oily_skin: Zap,
  dark_spots: Sun,
  wrinkles: Sparkles
};

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
    return (
      <div className="admin-stage-container" style={{ textAlign: "center", padding: "64px 20px" }}>
        <BarChart3 className="animate-pulse" size={38} color="var(--brand-amber)" style={{ margin: "0 auto 16px" }} />
        <h3 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginBottom: "6px" }}>
          Mengalkulasi Distribusi Tren Dermatologi
        </h3>
        <p className="muted" style={{ fontSize: "14px" }}>
          Mengagregasi rata-rata nilai 5 model detektor VGG16 dari seluruh pemindaian pengguna...
        </p>
      </div>
    );
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
      {/* ── Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <div className="badge badge-amber" style={{ marginBottom: "6px" }}>
            <TrendingUp size={12} /> ANALITIK STATISTIK KULIT
          </div>
          <h1>Tren Masalah Kulit Seluruh Pengguna</h1>
          <p>
            Rata-rata komparatif dari 5 detektor VGG16 pada {analyzed} scan yang telah dianalisis (dari total {data.total_scans || 0} pemindaian).
          </p>
        </div>
      </div>

      {/* ── Top Summary KPI Strip ── */}
      <div className="admin-stat-strip">
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-purple">
            <Activity size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Scan Dianalisis</span>
            <span className="admin-stat-value">{analyzed}</span>
            <span className="admin-stat-meta">Basis data komparasi</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Rata-rata Skor Global</span>
            <span className="admin-stat-value">{data.avg_overall ?? "—"}/100</span>
            <span className="admin-stat-meta">Indeks kesehatan kulit</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-amber">
            <Award size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Kondisi Terbanyak</span>
            <span className="admin-stat-value" style={{ fontSize: "19px" }}>
              {dominant ? dominant.label : "Seimbang"}
            </span>
            <span className="admin-stat-meta">Rata-rata tertinggi</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-blue">
            <AlertCircle size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Frekuensi Signifikan</span>
            <span className="admin-stat-value">
              {dominant ? `${dominant.pct_significant}%` : "—"}
            </span>
            <span className="admin-stat-meta">Skor keparahan ≥ 40</span>
          </div>
        </div>
      </div>

      {analyzed === 0 ? (
        <div className="admin-glass-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginTop: 0 }}>
            Belum Ada Pemindaian yang Selesai Dianalisis
          </h3>
          <p className="muted" style={{ maxWidth: "480px", margin: "0 auto", fontSize: "14px" }}>
            Ketika pengguna menyelesaikan scan wajah dan inferensi model selesai diproses, metrik rata-rata serta rekomendasi formulasi akan dikalkulasi otomatis di sini.
          </p>
        </div>
      ) : (
        <>
          {/* ── Distribusi Rata-rata Skor 5 Kondisi ── */}
          <div className="admin-glass-card" style={{ marginBottom: "24px" }}>
            <div className="admin-card-head">
              <div className="admin-card-title">
                <BarChart3 size={18} color="var(--brand-navy)" />
                Distribusi Nilai Rata-rata 5 Kondisi Kulit (VGG16)
              </div>
              <span className="admin-card-badge">Skala 0 – 100</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {conditions.map((c, i) => {
                const isTop = dominant && c.key === dominant.key;
                const IconComponent = CONDITION_ICONS[c.key] || Activity;

                return (
                  <div key={c.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: isTop ? 700 : 600, color: "var(--brand-navy)", fontSize: "14px" }}>
                        <IconComponent size={16} color={isTop ? "var(--brand-amber)" : "var(--brand-navy)"} />
                        {c.label}
                        {isTop && (
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              background: "rgba(217, 136, 42, 0.15)",
                              color: "var(--amber-700)",
                              fontWeight: 700
                            }}
                          >
                            Paling Menonjol
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                        <strong style={{ color: "var(--brand-navy)", fontSize: "14px" }}>{c.avg_score}</strong> / 100
                        {" • "}signifikan di <strong>{c.pct_significant}%</strong> scan
                      </span>
                    </div>

                    <div style={{ width: "100%", height: "10px", background: "rgba(23, 32, 51, 0.05)", borderRadius: "999px", overflow: "hidden" }}>
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
                background: "linear-gradient(135deg, rgba(23, 32, 51, 0.03) 0%, rgba(217, 136, 42, 0.08) 100%)",
                border: "1px solid rgba(217, 136, 42, 0.25)",
                borderRadius: "var(--radius-xl, 20px)",
                padding: "22px 26px",
                marginBottom: "24px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Award size={20} color="var(--brand-amber)" />
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", color: "var(--brand-navy)", margin: 0 }}>
                  Prioritas Formula: {dominant.label} Terdeteksi Tertinggi
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-body)", lineHeight: 1.6 }}>
                Rata-rata skor <strong>{dominant.label.toLowerCase()}</strong> mencapai <strong>{dominant.avg_score}/100</strong>, tertinggi di antara kelima parameter uji dan muncul secara signifikan (skor ≥ 40) pada <strong>{dominant.pct_significant}%</strong> dari seluruh pengguna yang melakukan pemindaian. Disarankan memperbanyak kurasi produk aktif dengan target bahan penenang dan pengontrol kondisi ini.
              </p>
            </div>
          )}

          {/* ── Rekomendasi Produk Katalog Per Kondisi ── */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Package size={18} color="var(--brand-navy)" />
                Katalog Produk Terkurasi Per Target Kondisi
              </div>
              <span className="admin-card-badge">Nama Produk & Bahan Aktif</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              {recommendations.map((rec) => (
                <div
                  key={rec.condition_key}
                  style={{
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 16px)",
                    padding: "16px",
                    background: "#ffffff"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px", borderBottom: "1px solid var(--border-light, #e2e8f0)", paddingBottom: "10px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--brand-navy)" }}>
                      {rec.condition_label}
                    </h4>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Rata-rata {rec.avg_score}
                    </span>
                  </div>

                  {rec.products.length === 0 ? (
                    <div style={{ padding: "12px 0" }}>
                      <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "0 0 8px" }}>
                        Belum ada produk aktif untuk kondisi ini.
                      </p>
                      <div style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                        <Link href="/admin/ai-copilot" style={{ color: "var(--brand-amber)", fontWeight: 600 }}>
                          Cek AI Copilot →
                        </Link>
                        <Link href="/admin/products" style={{ color: "var(--brand-navy)", fontWeight: 600 }}>
                          + Tambah Produk
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {rec.products.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            background: "var(--surface-warm, #fdfbf7)",
                            border: "1px solid rgba(23, 32, 51, 0.05)"
                          }}
                        >
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)", display: "block" }}>
                            {p.brand ? `${p.brand} ${p.name}` : p.name}
                          </span>
                          {Array.isArray(p.ingredients) && p.ingredients.length > 0 ? (
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                              {p.ingredients.slice(0, 3).map((ing, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "10.5px",
                                    background: "rgba(16, 185, 129, 0.1)",
                                    color: "#047857"
                                  }}
                                >
                                  {ing}
                                </span>
                              ))}
                              {p.ingredients.length > 3 && (
                                <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                                  +{p.ingredients.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
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
