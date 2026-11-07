"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Database,
  Cpu,
  PackagePlus,
  RefreshCw,
  BrainCircuit,
  CheckCircle2
} from "lucide-react";
import {
  getAdminCopilot,
  syncAdminRag,
  autoInsertAdminProduct,
  pickObject
} from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";
import { useToast, ConfirmDialog } from "../../../components/Toast";

export default function AdminCopilotPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [approving, setApproving] = useState(false);
  const [pendingApprove, setPendingApprove] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await getAdminCopilot();
      setData(pickObject(d));
    } catch (e) {
      if (e.status === 401 || e.status === 403) setDenied(true);
      else setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (denied) return <AdminDenied />;

  if (loading) {
    return (
      <div className="admin-stage-container" style={{ textAlign: "center", padding: "64px 20px" }}>
        <BrainCircuit className="animate-pulse" size={38} color="var(--brand-navy)" style={{ margin: "0 auto 16px" }} />
        <h3 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginBottom: "6px" }}>
          Mengagregasi AI Copilot & Celah Pasar
        </h3>
        <p className="muted" style={{ fontSize: "14px" }}>
          Menghitung korelasi keluhan customer dan kesiapan stok katalog...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-stage-container" style={{ textAlign: "center", padding: "48px 20px" }}>
        <div className="admin-glass-card" style={{ maxWidth: "480px", margin: "0 auto", padding: "36px" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginBottom: "8px" }}>
            Gagal Memuat AI Copilot
          </h2>
          <ErrorBox error={error} />
          <button
            type="button"
            className="btn btn-primary"
            style={{ margin: "20px auto 0" }}
            onClick={load}
          >
            <RefreshCw size={14} /> Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  async function onSync() {
    setSyncing(true);
    try {
      const res = await syncAdminRag();
      setSyncResult(pickObject(res));
      toast.success("Sinkronisasi katalog berhasil.");
    } catch (err) {
      toast.error(err.message || "Gagal sinkronisasi katalog.");
    } finally {
      setSyncing(false);
    }
  }

  async function onApprove() {
    const p = data.proposal;
    if (!p) return;
    setPendingApprove(true);
  }

  async function confirmApprove() {
    const p = data.proposal;
    if (!p) return;
    setPendingApprove(false);
    setApproving(true);
    try {
      await autoInsertAdminProduct({
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description,
        ingredients: p.ingredients,
        skin_concern: p.skin_concern,
        usage_guidance: p.usage_guidance
      });
      toast.success(`Produk "${p.name}" berhasil masuk ke katalog aktif.`);
      load();
    } catch (err) {
      toast.error(err.message || "Gagal memasukkan usulan formula ke katalog.");
    } finally {
      setApproving(false);
    }
  }

  const trends = data.trends || [];
  const gaps = data.gaps || [];
  const p = data.proposal;

  return (
    <div className="admin-stage-container">
      {/* ── Page Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <h1>AI Copilot & Analisis Kesenjangan Formulasi</h1>
          <p>
            Mendeteksi keluhan kulit pengguna dari {data.total_analyzed_scans ?? 0} scan teranalisis dan merekomendasikan formulasi produk baru.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={load}
          >
            <RefreshCw size={13} /> Segarkan
          </button>
        </div>
      </div>

      {/* ── 2 Columns Bento Grid: Tren & Gap Analysis ── */}
      <div className="admin-bento-grid">
        {/* Kolom Kiri: Tren Masalah Kulit */}
        <div className="admin-glass-card">
          <div className="admin-card-head">
            <div className="admin-card-title">
              <TrendingUp size={16} color="var(--brand-navy)" />
              Tren Masalah Kulit (Agregasi)
            </div>
            <span className="admin-card-badge">Skor Signifikan ≥ 40</span>
          </div>

          {trends.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: "32px 16px" }}>
              <p className="muted" style={{ margin: 0, fontSize: "13.5px" }}>
                Belum ada data scan selesai dianalisis.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {trends.map((t) => (
                <div key={t.key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 600, color: "var(--brand-navy)", fontSize: "13.5px" }}>
                      {t.label}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      Rata-rata <strong>{t.avg_score}</strong>/100 • {t.count} scan
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "7px", background: "rgba(15, 23, 42, 0.05)", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.max(0, Math.min(100, t.percentage))}%`,
                        height: "100%",
                        background: t.percentage > 30 ? "var(--brand-amber)" : "var(--brand-navy)",
                        borderRadius: "999px"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Gap Analysis vs Katalog */}
        <div className="admin-glass-card">
          <div className="admin-card-head">
            <div className="admin-card-title">
              <AlertCircle size={16} color="var(--brand-navy)" />
              Gap Analysis vs Katalog Aktif
            </div>
            <span className="admin-card-badge">Batas Minim 2 SKU</span>
          </div>

          {gaps.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: "32px 16px" }}>
              <p className="muted" style={{ margin: 0, fontSize: "13.5px" }}>
                Belum ada data untuk kalkulasi gap analysis.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {gaps.map((g) => (
                <div
                  key={g.key}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15, 23, 42, 0.06)",
                    background: g.gap ? "rgba(217, 136, 42, 0.04)" : "#ffffff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--brand-navy)", fontSize: "13px", display: "block" }}>
                      {g.label}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      Rata-rata {g.avg_score} • {g.active_products} produk aktif
                    </span>
                  </div>

                  <div>
                    {g.gap ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "rgba(217, 136, 42, 0.12)",
                          color: "var(--amber-700)"
                        }}
                      >
                        Celah Pasar
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "rgba(5, 150, 105, 0.08)",
                          color: "#059669"
                        }}
                      >
                        Tercukupi
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section Usulan Formulasi AI (Gemini) ── */}
      <div className="admin-glass-card">
        <div className="admin-card-head">
          <div className="admin-card-title">
            <Sparkles size={16} color="var(--brand-amber)" />
            Usulan Formulasi Baru Berbasis AI (Gemini Copilot)
          </div>
          <span className="admin-card-badge">R&D OTOMATIS</span>
        </div>

        {!data.ai_available || !p ? (
          <div style={{ padding: "16px 0" }}>
            <p className="muted" style={{ fontSize: "13.5px", marginBottom: "6px" }}>
              {data.ai_note || "Usulan formulasi AI belum tersedia saat ini."}
            </p>
            <p className="muted" style={{ fontSize: "12px", margin: 0 }}>
              Formulasi baru hanya digenerasikan oleh Gemini AI ketika kunci API dikonfigurasi di lingkungan backend.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                background: "#FAF9F5",
                border: "1px solid rgba(15, 23, 42, 0.08)",
                borderRadius: "14px",
                padding: "20px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <span className="category-badge" style={{ marginBottom: "6px" }}>
                    {p.category ? p.category.toUpperCase() : "SERUM"}
                  </span>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "19px", color: "var(--brand-navy)", margin: 0 }}>
                    {p.brand} — {p.name}
                  </h3>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={approving}
                  onClick={onApprove}
                >
                  <PackagePlus size={14} /> {approving ? "Memproses..." : "Setujui & Tambah ke Katalog"}
                </button>
              </div>

              <p style={{ fontSize: "13.5px", color: "var(--text-body)", lineHeight: 1.6, marginBottom: "14px" }}>
                {p.description}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-navy)", display: "block", marginBottom: "4px" }}>
                    Bahan Aktif:
                  </span>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {(p.ingredients || []).map((ing, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          background: "rgba(15, 23, 42, 0.06)",
                          color: "var(--brand-navy)"
                        }}
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-navy)", display: "block", marginBottom: "4px" }}>
                    Target Keluhan:
                  </span>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {(p.skin_concern || []).map((sc, idx) => (
                      <span key={idx} className="concern-tag">
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {p.rationale && (
                <div style={{ marginTop: "14px", padding: "10px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid rgba(15, 23, 42, 0.06)", fontSize: "12.5px", color: "var(--text-muted)" }}>
                  <strong>Rasionalisasi Ilmiah:</strong> {p.rationale}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Section Sinkronisasi Katalog (RAG) ── */}
      <div className="admin-glass-card">
        <div className="admin-card-head">
          <div className="admin-card-title">
            <Database size={16} color="var(--brand-navy)" />
            Sinkronisasi Pengetahuan Katalog AI
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 14px" }}>
          Katalog produk dimuat langsung dari basis data setiap konsultasi asisten dimulai. Lakukan sinkronisasi untuk memastikan direktori produk terindeks ke bot konsultasi.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={syncing}
            onClick={onSync}
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Memverifikasi..." : "Sync Katalog"}
          </button>

          {syncResult && (
            <span style={{ fontSize: "12.5px", color: "#059669", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={14} />
              Produk aktif terindeks: <strong>{syncResult.active_products}</strong>
              {syncResult.synced_at ? ` (${syncResult.synced_at})` : ""}
            </span>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingApprove && !!data.proposal}
        title="Setujui formulasi produk?"
        message={
          data.proposal
            ? `Masukkan formula "${data.proposal.name}" ke dalam katalog aktif Laomera?`
            : ""
        }
        confirmLabel="Ya, Masukkan ke Katalog"
        onConfirm={confirmApprove}
        onCancel={() => setPendingApprove(false)}
      />
    </div>
  );
}
