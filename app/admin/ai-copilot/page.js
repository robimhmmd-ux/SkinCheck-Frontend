"use client";
import { useEffect, useState } from "react";
import {
  getAdminCopilot,
  syncAdminRag,
  autoInsertAdminProduct,
  pickObject,
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

  useEffect(() => { load(); }, []);

  if (denied) return <AdminDenied />;
  if (loading) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px", textAlign: "center" }}>
          <Loading label="Menghitung tren…" />
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "36px", textAlign: "center" }}>
          <h2>Gagal Memuat AI Copilot</h2>
          <ErrorBox error={error} />
        </div>
      </div>
    );
  }

  async function onSync() {
    setSyncing(true);
    try {
      const res = await syncAdminRag();
      setSyncResult(pickObject(res));
      toast.success("Sinkronisasi dilaporkan.");
    } catch (err) {
      toast.error(err.message || "Gagal sinkronisasi.");
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
        usage_guidance: p.usage_guidance,
      });
      toast.success("Usulan masuk ke katalog.");
      load();
    } catch (err) {
      toast.error(err.message || "Gagal memasukkan usulan.");
    } finally {
      setApproving(false);
    }
  }

  const trends = data.trends || [];
  const gaps = data.gaps || [];
  const p = data.proposal;

  return (
    <div className="page-shell-wrap">
      <div className="admin-hero-header">
        <h1 className="admin-page-title">AI Copilot</h1>
        <p className="admin-page-subtitle">
          Tren dari {data.total_analyzed_scans ?? 0} scan yang sudah dianalisis. Gap analysis menandai
          kondisi dengan rata-rata tinggi (≥ 40) yang produk aktifnya sedikit (≤ 2).
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ marginTop: 0 }}>Tren Masalah Kulit</h3>
        {trends.length === 0 ? (
          <p className="muted">Belum ada scan yang dianalisis — tren akan muncul setelah ada scan selesai.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {trends.map((t) => (
              <div key={t.key} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                <strong style={{ minWidth: "190px" }}>{t.label}</strong>
                <span className="muted" style={{ fontSize: "13px" }}>rata-rata {t.avg_score}</span>
                <span className="muted" style={{ fontSize: "13px" }}>{t.percentage}% scan signifikan (≥ 40)</span>
                <span className="muted" style={{ fontSize: "13px" }}>{t.count} scan</span>
              </div>
            ))}
          </div>
        )}
        {data.dominant_concern?.label && (
          <p style={{ marginBottom: 0 }}>
            Kondisi dominan: <strong>{data.dominant_concern.label}</strong>
          </p>
        )}
      </div>

      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ marginTop: 0 }}>Gap Analysis vs Katalog</h3>
        {gaps.length === 0 ? (
          <p className="muted">Belum ada data untuk gap analysis.</p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {gaps.map((g) => (
              <div key={g.key} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <strong style={{ minWidth: "190px" }}>{g.label}</strong>
                <span className="muted" style={{ fontSize: "13px" }}>rata-rata {g.avg_score}</span>
                <span className="muted" style={{ fontSize: "13px" }}>{g.active_products} produk aktif</span>
                {g.gap
                  ? <span className="badge badge-amber">Celah pasar</span>
                  : <span className="badge badge-navy">Tercukupi</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ marginTop: 0 }}>Usulan Formulasi AI</h3>
        {!data.ai_available || !p ? (
          <div>
            <p className="muted">
              {data.ai_note || "Usulan AI tidak tersedia."}
            </p>
            <p className="muted" style={{ fontSize: "13px" }}>
              Tidak ada usulan karangan yang ditampilkan: usulan hanya dibuat oleh Gemini ketika
              GEMINI_API_KEY tersedia dan SDK-nya terpasang di backend.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            <p style={{ margin: 0 }}><strong>{p.brand} — {p.name}</strong></p>
            <p className="muted" style={{ margin: 0, fontSize: "14px" }}>Kategori: {p.category}</p>
            <p style={{ margin: 0 }}>{p.description}</p>
            <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
              Bahan: {(p.ingredients || []).join(", ") || "—"}
            </p>
            <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
              Target: {(p.skin_concern || []).join(", ") || "—"}
            </p>
            <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
              Pemakaian: {p.usage_guidance || "—"}
            </p>
            {p.rationale && <p style={{ margin: 0, fontSize: "14px" }}>Alasan: {p.rationale}</p>}
            <div>
              <button type="button" className="btn btn-primary btn-sm" disabled={approving} onClick={onApprove}>
                {approving ? "Memasukkan…" : "Approve & Masukkan ke Katalog"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: "20px" }}>
        <h3 style={{ marginTop: 0 }}>Sinkronisasi Katalog (RAG)</h3>
        <p className="muted" style={{ fontSize: "14px" }}>
          Arsitektur saat ini tidak memiliki indeks RAG terpisah: katalog dimuat langsung dari database
          setiap permintaan chat. Tombol ini hanya melaporkan jumlah produk aktif yang dipakai chatbot.
        </p>
        <button type="button" className="btn btn-secondary btn-sm" disabled={syncing} onClick={onSync}>
          {syncing ? "Memeriksa…" : "Sync Katalog"}
        </button>
        {syncResult && (
          <p style={{ marginBottom: 0 }}>
            Produk aktif: <strong>{syncResult.active_products}</strong>
            {syncResult.synced_at ? ` • ${syncResult.synced_at}` : ""}
          </p>
        )}
      </div>
      <ConfirmDialog
        open={pendingApprove && !!data.proposal}
        title="Masukkan ke katalog?"
        message={data.proposal ? `Masukkan "${data.proposal.name}" ke katalog sebagai produk aktif?` : ""}
        confirmLabel="Ya, masukkan"
        onConfirm={confirmApprove}
        onCancel={() => setPendingApprove(false)}
      />
    </div>
  );
}
