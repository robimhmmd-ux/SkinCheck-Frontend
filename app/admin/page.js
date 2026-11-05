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
  UserCheck,
  CalendarCheck,
  Percent,
  MessageSquare,
  Database,
} from "lucide-react";
import { getAdminDashboard, pickObject } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import AdminDenied from "../../components/AdminDenied";

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getAdminDashboard()
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
    return <AdminDenied />;
  }

  if (error || !data) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "36px", textAlign: "center" }}>
          <h2>Gagal Memuat Dashboard Admin</h2>
          <p className="muted">Koneksi ke endpoint dashboard admin mengalami hambatan.</p>
          <ErrorBox error={error} />
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Coba Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  const kpi = (icon, value, label) => (
    <div className="glass-panel admin-kpi-card">
      <div className="kpi-icon-pill icon-blue">{icon}</div>
      <div className="kpi-content">
        <span className="kpi-value">{value}</span>
        <span className="kpi-label">{label}</span>
      </div>
    </div>
  );

  return (
    <div className="page-shell-wrap">
      <div className="admin-hero-header">
        <div className="badge badge-amber" style={{ margin: "0 auto 12px" }}>
          <ShieldAlert size={13} /> KONSOL ADMINISTRASI SISTEM
        </div>
        <h1 className="admin-page-title">Dashboard Admin</h1>
        <p className="admin-page-subtitle">
          Statistik agregat pengguna, volume scan AI, katalog produk, dan kesehatan sistem — langsung dari database.
        </p>
      </div>

      <div className="admin-kpi-grid">
        {kpi(<Users size={22} />, data.users ?? "0", "Total Pengguna Terdaftar")}
        {kpi(<UserCheck size={22} />, data.active_users ?? "0", "Pengguna Berstatus Aktif")}
        {kpi(<Scan size={22} />, data.total_scans ?? "0", "Total Sesi Pemindaian")}
        {kpi(<CalendarCheck size={22} />, data.scans_today ?? "0", "Scan Hari Ini (UTC)")}
        {kpi(<Percent size={22} />, data.success_rate != null ? `${data.success_rate}%` : "—", "AI Success Rate (selesai/total)")}
        {kpi(<MessageSquare size={22} />, data.chat_messages_30d ?? "0", "Pesan Chat User 30 Hari Terakhir")}
        {kpi(<Package size={22} />, data.products ?? "0", "Total Katalog Produk")}
        {kpi(<ShoppingBag size={22} />, data.active_products ?? "0", "Produk Berstatus Aktif")}
      </div>

      <div className="glass-panel admin-info-card">
        <div className="admin-info-header">
          <Database size={18} className="text-amber" />
          <h3>Status Integrasi Layanan</h3>
        </div>
        <p className="muted" style={{ fontSize: "14px", lineHeight: "1.6" }}>
          Database: <strong>{data.health?.db === "ok" ? `OK (${data.health.db_latency_ms} ms)` : "tidak teruji"}</strong>
          {" • "}Lingkungan: <strong>{data.health?.app_env || "—"}</strong>
          {" • "}Scan gagal: <strong>{data.failed_scans ?? "0"}</strong>
          {" • "}Pengguna chat 30 hari: <strong>{data.chat_users_30d ?? "0"}</strong>.
          Uji koneksi layanan eksternal (SMTP, Fonnte, Gemini) tersedia di halaman Pengaturan &gt; Testing Hub.
        </p>
        <div className="admin-action-links">
          <Link href="/admin/users" className="btn btn-secondary btn-sm">
            Kelola Pengguna <ArrowRight size={14} />
          </Link>
          <Link href="/admin/products" className="btn btn-secondary btn-sm">
            Kelola Produk <ArrowRight size={14} />
          </Link>
          <Link href="/admin/scans" className="btn btn-secondary btn-sm">
            Audit Scan <ArrowRight size={14} />
          </Link>
          <Link href="/admin/settings" className="btn btn-ghost btn-sm">
            Pengaturan & Testing Hub
          </Link>
        </div>
      </div>

      <div className="glass-panel admin-info-card">
        <div className="admin-info-header">
          <Activity size={18} className="text-amber" />
          <h3>Catatan Adaptasi dari Versi Lama</h3>
        </div>
        <p className="muted" style={{ fontSize: "14px", lineHeight: "1.6" }}>
          Login admin tidak lagi terpisah — login tetap terpadu dan peran dibaca dari database.
          Foto scan tidak disajikan di audit (backend API-only tanpa /static), dan tombol sync RAG
          hanya melaporkan jumlah produk aktif karena tidak ada indeks RAG terpisah di arsitektur ini.
        </p>
      </div>
    </div>
  );
}
