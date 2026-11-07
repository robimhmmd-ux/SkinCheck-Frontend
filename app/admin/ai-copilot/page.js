"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Cpu,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowRight,
  Flame,
  Droplets,
  Zap,
  Sun,
  Activity,
  PackagePlus,
  RefreshCw,
  Layers,
  ShieldCheck,
  BrainCircuit
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
        <BrainCircuit className="animate-pulse" size={38} color="var(--brand-amber)" style={{ margin: "0 auto 16px" }} />
        <h3 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginBottom: "6px" }}>
          Mengagregasi Analisis Celah Pasar & AI Copilot
        </h3>
        <p className="muted" style={{ fontSize: "14px" }}>
          Menghitung korelasi antara riwayat keluhan pengguna dan direktori katalog produk...
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
      toast.success("Sinkronisasi katalog dan indeks AI berhasil.");
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
  const gapCount = gaps.filter((g) => g.gap).length;

  return (
    <div className="admin-stage-container">
      {/* ── Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <div className="badge badge-amber" style={{ marginBottom: "6px" }}>
            <Sparkles size={12} /> KECERDASAN BISNIS & FORMULASI AI
          </div>
          <h1>AI Copilot & Analisis Kesenjangan Pasar</h1>
          <p>
            Mendeteksi keluhan kulit pengguna yang belum terlayani produk katalog serta memberikan usulan formulasi klinis otomatis.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={load}
          >
            <RefreshCw size={13} /> Segarkan Data
          </button>
        </div>
      </div>

      {/* ── KPI Telemetry Strip ── */}
      <div className="admin-stat-strip">
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-purple">
            <Activity size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Scan Dianalisis</span>
            <span className="admin-stat-value">{data.total_analyzed_scans ?? 0}</span>
            <span className="admin-stat-meta">Sampel data agregat</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-amber">
            <Flame size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Kondisi Dominan</span>
            <span className="admin-stat-value" style={{ fontSize: "20px" }}>
              {data.dominant_concern?.label || "Seimbang"}
            </span>
            <span className="admin-stat-meta">Frekuensi tertinggi</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-blue">
            <AlertCircle size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Celah Pasar Terdeteksi</span>
            <span className="admin-stat-value">{gapCount} Kondisi</span>
            <span className="admin-stat-meta">Katalog belum memadai</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-emerald">
            <Cpu size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Status Gemini AI</span>
            <span className="admin-stat-value" style={{ fontSize: "20px" }}>
              {data.ai_available ? "Aktif" : "Standby"}
            </span>
            <span className="admin-stat-meta">Mesin inferensi usulan</span>
          </div>
        </div>
      </div>

      {/* ── 2 Columns Bento Layout: Tren & Gap Analysis ── */}
      <div className="admin-bento-grid">
        {/* Kolom Kiri: Tren Masalah Kulit */}
        <div className="admin-glass-card">
          <div className="admin-card-head">
            <div className="admin-card-title">
              <TrendingUp size={18} color="var(--brand-amber)" />
              Tren Masalah Kulit Pengguna
            </div>
            <span className="admin-card-badge">Skor Signifikan ≥ 40</span>
          </div>

          {trends.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: "32px 16px" }}>
              <p className="muted" style={{ margin: 0, fontSize: "13.5px" }}>
                Belum ada data scan yang selesai dianalisis untuk merangkum tren.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {trends.map((t) => (
                <div key={t.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 600, color: "var(--brand-navy)", fontSize: "14px" }}>
                      {t.label}
                    </span>
                    <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                      Rata-rata <strong>{t.avg_score}</strong> / 100 ({t.count} scan)
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(23, 32, 51, 0.05)", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.max(0, Math.min(100, t.percentage))}%`,
                        height: "100%",
                        background: t.percentage > 30 ? "var(--brand-amber)" : "var(--brand-navy)",
                        borderRadius: "999px",
                        transition: "width 0.5s ease"
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    {t.percentage}% pengguna terdeteksi memiliki kerentanan signifikan pada kondisi ini.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Gap Analysis vs Katalog */}
        <div className="admin-glass-card">
          <div className="admin-card-head">
            <div className="admin-card-title">
              <AlertCircle size={18} color="#2563eb" />
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
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {gaps.map((g) => (
                <div
                  key={g.key}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    background: g.gap ? "rgba(217, 136, 42, 0.04)" : "#ffffff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--brand-navy)", fontSize: "13.5px", display: "block" }}>
                      {g.label}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Rata-rata skor: <strong>{g.avg_score}</strong> • Tersedia <strong>{g.active_products}</strong> produk aktif
                    </span>
                  </div>

                  <div>
                    {g.gap ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 9px",
                          borderRadius: "var(--radius-full)",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "rgba(217, 136, 42, 0.15)",
                          color: "var(--amber-700)",
                          border: "1px solid rgba(217, 136, 42, 0.3)"
                        }}
                      >
                        Celah Pasar
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 9px",
                          borderRadius: "var(--radius-full)",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "rgba(16, 185, 129, 0.1)",
                          color: "#047857"
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
      <div className="admin-glass-card" style={{ marginBottom: "24px" }}>
        <div className="admin-card-head">
          <div className="admin-card-title">
            <Sparkles size={18} color="var(--brand-amber)" />
            Rekomendasi Formulasi Baru Berbasis AI (Gemini Copilot)
          </div>
          <span className="admin-card-badge">Otomatisasi R&D Skincare</span>
        </div>

        {!data.ai_available || !p ? (
          <div style={{ padding: "20px 0" }}>
            <p className="muted" style={{ fontSize: "14px", marginBottom: "8px" }}>
              {data.ai_note || "Usulan formulasi AI belum tersedia saat ini."}
            </p>
            <p className="muted" style={{ fontSize: "12.5px", margin: 0 }}>
              Sistem Laomera mematuhi standar integritas ilmiah: formulasi baru hanya dibuat melalui penalaran cerdas Gemini ketika konfigurasi API Key tersedia di lingkungan backend.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                background: "var(--surface-warm, #fdfbf7)",
                border: "1px solid var(--border-light, #e2e8f0)",
                borderRadius: "var(--radius-lg, 16px)",
                padding: "20px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <span className="badge badge-amber" style={{ marginBottom: "6px" }}>
                    {p.category ? p.category.toUpperCase() : "SERUM"}
                  </span>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--brand-navy)", margin: 0 }}>
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

              <p style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.6, marginBottom: "16px" }}>
                {p.description}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-navy)", display: "block", marginBottom: "6px" }}>
                    Bahan Aktif yang Disarankan:
                  </span>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {(p.ingredients || []).map((ing, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11.5px",
                          background: "rgba(16, 185, 129, 0.1)",
                          color: "#047857"
                        }}
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-navy)", display: "block", marginBottom: "6px" }}>
                    Target Keluhan Kulit:
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
                <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "8px", background: "rgba(23, 32, 51, 0.04)", fontSize: "13px", color: "var(--text-muted)" }}>
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
            <Database size={18} color="var(--brand-navy)" />
            Sinkronisasi Pengetahuan Katalog & Konsultasi AI
          </div>
        </div>

        <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: "0 0 16px" }}>
          Katalog produk dimuat langsung dari basis data relasional setiap konsultasi asisten dimulai. Lakukan sinkronisasi untuk memastikan jumlah stok dan bahan aktif terbaru terindeks ke bot konsultasi.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={syncing}
            onClick={onSync}
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Memverifikasi Indeks..." : "Sync Direktori Katalog"}
          </button>

          {syncResult && (
            <span style={{ fontSize: "13px", color: "#059669", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={15} />
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
            ? `Masukkan formula "${data.proposal.name}" ke dalam katalog aktif Laomera? Produk ini akan langsung dapat direkomendasikan kepada pengguna dengan keluhan yang sesuai.`
            : ""
        }
        confirmLabel="Ya, Masukkan ke Katalog"
        onConfirm={confirmApprove}
        onCancel={() => setPendingApprove(false)}
      />
    </div>
  );
}
