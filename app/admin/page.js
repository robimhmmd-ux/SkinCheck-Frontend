"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Users, 
  Scan, 
  Package, 
  ShoppingBag, 
  ArrowRight, 
  RefreshCw, 
  Activity,
  Layers,
  Sparkles
} from "lucide-react";
import { getAdminSummary, pickObject } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getAdminSummary()
      .then((d) => { if (alive) setData(pickObject(d)); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px 32px", textAlign: "center" }}>
          <p className="muted">Mengumpulkan telemetri sistem admin…</p>
        </div>
      </div>
    );
  }

  if (error && (error.status === 401 || error.status === 403)) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel admin-denied-card">
          <div className="admin-denied-icon">
            <ShieldAlert size={36} />
          </div>
          <h2>Otoritas Terbatas</h2>
          <p className="muted">
            Halaman konsol ini dikhususkan untuk akun dengan hak akses administrator sistem Laomera.
          </p>
          <div className="admin-denied-actions">
            <Link href="/login" className="btn btn-primary btn-sm">
              Masuk sebagai Administrator
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-sm">
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "36px", textAlign: "center" }}>
          <h2>Gagal Memuat Ringkasan Admin</h2>
          <p className="muted">Koneksi ke endpoint ringkasan mengalami hambatan.</p>
          <ErrorBox error={error} />
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Coba Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  const users = data.users ?? "0";
  const scans = data.scans ?? "0";
  const products = data.products ?? "0";
  const activeProducts = data.active_products ?? "0";

  return (
    <div className="page-shell-wrap">
      {/* ── Admin Header ── */}
      <div className="admin-hero-header">
        <div className="badge badge-amber" style={{ margin: "0 auto 12px" }}>
          <ShieldAlert size={13} /> KONSOL ADMINISTRASI SISTEM
        </div>
        <h1 className="admin-page-title">Ringkasan Sistem</h1>
        <p className="admin-page-subtitle">
          Statistik agregat pengguna terdaftar, volume scan kecerdasan buatan, dan katalog produk formulasi.
        </p>
      </div>

      {/* ── 4 KPI Stats Grid ── */}
      <div className="admin-kpi-grid">
        <div className="glass-panel admin-kpi-card">
          <div className="kpi-icon-pill icon-blue">
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{users}</span>
            <span className="kpi-label">Total Pengguna Terdaftar</span>
          </div>
        </div>

        <div className="glass-panel admin-kpi-card">
          <div className="kpi-icon-pill icon-amber">
            <Scan size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{scans}</span>
            <span className="kpi-label">Total Sesi Pemindaian</span>
          </div>
        </div>

        <div className="glass-panel admin-kpi-card">
          <div className="kpi-icon-pill icon-sage">
            <Package size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{products}</span>
            <span className="kpi-label">Total Katalog Produk</span>
          </div>
        </div>

        <div className="glass-panel admin-kpi-card">
          <div className="kpi-icon-pill icon-peach">
            <ShoppingBag size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{activeProducts}</span>
            <span className="kpi-label">Produk Berstatus Aktif</span>
          </div>
        </div>
      </div>

      {/* ── System Status & Shortcuts ── */}
      <div className="glass-panel admin-info-card">
        <div className="admin-info-header">
          <Activity size={18} className="text-amber" />
          <h3>Status Integrasi Layanan</h3>
        </div>
        <p className="muted" style={{ fontSize: "14px", lineHeight: "1.6" }}>
          Data statistik di atas disinkronkan secara langsung dari basis data relasional backend. 
          Katalog formulasi dan rekomendasi produk aktif dapat ditinjau melalui direktori marketplace.
        </p>
        <div className="admin-action-links">
          <Link href="/marketplace" className="btn btn-secondary btn-sm">
            Tinjau Katalog Produk <ArrowRight size={14} />
          </Link>
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
