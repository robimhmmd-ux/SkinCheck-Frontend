"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminTrends, pickObject } from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";

// Halaman admin Tren Scan: grafik rata-rata TOTAL 5 output VGG dari
// seluruh scan pengguna yang sudah dianalisis (semua waktu), kondisi yang
// paling menonjol, dan rekomendasi produk katalog yang cocok per kondisi.
// Rekomendasi di sini HANYA menampilkan nama produk + kandungannya.
export default function AdminTrendsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    getAdminTrends()
      .then((d) => { if (alive) setData(pickObject(d)); })
      .catch((e) => {
        if (!alive) return;
        if (e.status === 401 || e.status === 403) setDenied(true);
        else setError(e);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (denied) return <AdminDenied />;
  if (loading) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px", textAlign: "center" }}>
          <Loading label="Menghitung tren scan…" />
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "36px", textAlign: "center" }}>
          <h2>Gagal Memuat Tren Scan</h2>
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
    <div className="page-shell-wrap" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 className="admin-page-title">Tren Scan Seluruh Pengguna</h1>
        <p className="admin-page-subtitle">
          Rata-rata total 5 output VGG dari {analyzed} scan yang sudah dianalisis
          (dari {data.total_scans || 0} pemindaian). Grafik ini menunjukkan kondisi mana
          yang paling sering muncul dan paling tinggi — pakai sebagai masukan produk
          apa yang cocok dipromosikan atau ditambah ke katalog.
        </p>
      </div>

      {analyzed === 0 ? (
        <div className="glass-panel" style={{ padding: "36px", textAlign: "center" }}>
          <h2 style={{ marginTop: 0 }}>Belum ada scan yang selesai dianalisis</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            Begitu ada pengguna yang scan-nya selesai dianalisis, rata-rata dan
            rekomendasi produk akan muncul di sini.
          </p>
        </div>
      ) : (
        <>
          {/* Grafik rata-rata 5 output VGG */}
          <section className="glass-panel" style={{ padding: "20px" }}>
            <h2 style={{ marginTop: 0 }}>Rata-rata skor kondisi kulit (semua pengguna)</h2>
            <p className="muted" style={{ marginTop: "-6px", fontSize: "13px" }}>
              Rata-rata skor kesehatan kulit keseluruhan: <strong>{data.avg_overall ?? "-"}/100</strong>.
              Batang terpanjang = kondisi yang rata-ratanya paling tinggi.
            </p>
            <div style={{ display: "grid", gap: "14px", marginTop: "16px" }} role="img" aria-label={`Rata-rata skor: ${conditions.map((c) => `${c.label} ${c.avg_score}`).join(", ")}`}>
              {conditions.map((c, i) => {
                const isTop = dominant && c.key === dominant.key;
                return (
                  <div key={c.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: isTop ? 700 : 500 }}>
                        {i + 1}. {c.label}
                        {isTop ? " — paling menonjol" : ""}
                      </span>
                      <span>
                        <strong>{c.avg_score}</strong>
                        <span className="muted"> / 100 · signifikan di {c.pct_significant}% scan</span>
                      </span>
                    </div>
                    <div style={{ height: "14px", borderRadius: "999px", background: "var(--sand-100)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(0, Math.min(100, c.avg_score || 0))}%`,
                          borderRadius: "999px",
                          background: isTop ? "var(--brand-600, #8a2f2b)" : "var(--sage-500, #7d8a6a)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Kondisi paling menonjol */}
          {dominant && (
            <section className="glass-panel" style={{ padding: "20px" }}>
              <h2 style={{ marginTop: 0 }}>Kondisi paling menonjol: {dominant.label}</h2>
              <p style={{ marginBottom: 0 }}>
                Rata-rata skor {dominant.label.toLowerCase()} adalah <strong>{dominant.avg_score}/100</strong>,
                paling tinggi di antara kelima kondisi, dan muncul signifikan
                (skor ≥ 40) di <strong>{dominant.pct_significant}%</strong> scan yang dianalisis.
                Artinya ini masalah yang paling sering ditemui pengguna — produk untuk
                kondisi ini paling layak diprioritaskan.
              </p>
            </section>
          )}

          {/* Rekomendasi produk per kondisi: nama + kandungan saja */}
          <section className="glass-panel" style={{ padding: "20px" }}>
            <h2 style={{ marginTop: 0 }}>Produk katalog yang cocok (nama + kandungan)</h2>
            <p className="muted" style={{ marginTop: "-6px", fontSize: "13px" }}>
              Diambil dari produk aktif di katalog yang target masalahnya cocok dengan
              tiap kondisi. Hanya nama produk dan kandungannya yang ditampilkan di sini.
            </p>
            <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
              {recommendations.map((rec) => (
                <div key={rec.condition_key}>
                  <h3 style={{ margin: "0 0 8px", fontSize: "15px" }}>
                    {rec.condition_label} <span className="muted" style={{ fontWeight: 400 }}>(rata-rata {rec.avg_score})</span>
                  </h3>
                  {rec.products.length === 0 ? (
                    <p className="muted" style={{ margin: "0 0 4px", fontSize: "13.5px" }}>
                      Belum ada produk aktif yang cocok untuk kondisi ini.{" "}
                      <Link href="/admin/ai-copilot">Lihat usulan AI Copilot</Link> atau{" "}
                      <Link href="/admin/products">tambah produk</Link>.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {rec.products.map((p) => (
                        <div key={p.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "12px 14px", background: "#fff" }}>
                          <div style={{ fontWeight: 700 }}>{p.brand ? `${p.brand} ${p.name}` : p.name}</div>
                          {Array.isArray(p.ingredients) && p.ingredients.length > 0 ? (
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                              {p.ingredients.map((ing, idx) => (
                                <span key={idx} className="badge badge-success" style={{ fontSize: "11px", padding: "2px 8px" }}>
                                  {ing}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="muted" style={{ fontSize: "12.5px", marginTop: "4px" }}>Kandungan belum diisi.</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
