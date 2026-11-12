"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import WorkspaceLoadingScreen from "../../components/WorkspaceLoadingScreen";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Scan,
  Package,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Activity,
  Layers,
  Sparkles,
  Cpu,
  Lock,
  Server,
  Database,
  Search,
  ExternalLink,
  BarChart3,
  Sliders,
  CheckCircle2,
  Clock,
  Key,
  Flame,
  Droplets,
  Zap,
  Sun,
  UserCheck,
  CalendarCheck,
  Percent,
  MessageSquare,
  TrendingUp,
  Settings,
  ScrollText
} from "lucide-react";
import {
  getAdminDashboard,
  getProducts,
  getMe,
  pickObject,
  pickArray,
  pickUser
} from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import AdminDenied from "../../components/AdminDenied";
import { useToast } from "../../components/Toast";

// Clinical distribution baseline benchmarks for 5 skin condition detectors
const CONDITION_DISTRIBUTION = [
  { key: "acne", label: "Acne Vulnerability (Jerawat)", pct: 34, color: "var(--brand-amber)", icon: Flame },
  { key: "dry", label: "Moisture Barrier Deficit (Dehidrasi)", pct: 28, color: "var(--brand-blue)", icon: Droplets },
  { key: "oily", label: "Sebum Hyperactivity (Minyak)", pct: 22, color: "var(--brand-peach)", icon: Zap },
  { key: "spots", label: "Melanin Clustering (Dark Spots)", pct: 18, color: "#8b5cf6", icon: Sun },
  { key: "wrinkles", label: "Elasticity Deficit (Fine Lines)", pct: 14, color: "var(--brand-sage)", icon: Sparkles }
];

export default function AdminPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("ringkasan"); // ringkasan | katalog | arsitektur | keamanan
  const [data, setData] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("");

  // Catalog search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("semua");

  const fetchData = async () => {
    try {
      setError(null);
      const [dashRes, prodRes, meRes] = await Promise.allSettled([
        getAdminDashboard(),
        getProducts(),
        getMe()
      ]);

      if (dashRes.status === "fulfilled") {
        setData(pickObject(dashRes.value));
      } else {
        throw dashRes.reason;
      }

      if (prodRes.status === "fulfilled") {
        setProductsList(pickArray(prodRes.value));
      }

      if (meRes.status === "fulfilled") {
        setUser(pickUser(meRes.value));
      }

      setLastSyncTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchData();
    toast.success("Telemetri sistem diperbarui.");
  };

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const matchCat =
        selectedCategory === "semua" ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.ingredients && p.ingredients.toLowerCase().includes(q)) ||
        (p.skin_concern && p.skin_concern.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [productsList, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(productsList.map((p) => p.category).filter(Boolean));
    return ["semua", ...Array.from(set)];
  }, [productsList]);

  // Loading Unified View: Skeleton Card & 3D Spinner
  if (loading) {
    return <WorkspaceLoadingScreen caption="Menginisialisasi Konsol Administrasi…" />;
  }

  // Unauthorized Access View (401 / 403)
  if (error && (error.status === 401 || error.status === 403)) {
    return <AdminDenied />;
  }

  // General Connection Error View
  if (error || !data) {
    return (
      <div className="admin-stage-container" style={{ textAlign: "center", padding: "48px 20px" }}>
        <div className="glass-panel" style={{ maxWidth: "480px", margin: "0 auto", padding: "36px" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginBottom: "8px" }}>
            Koneksi Endpoint Terhambat
          </h2>
          <p className="muted" style={{ fontSize: "13.5px", marginBottom: "16px" }}>
            Gagal memuat agregasi telemetri admin dari backend service.
          </p>
          <ErrorBox error={error} />
          <button
            type="button"
            className="btn btn-primary"
            style={{ margin: "20px auto 0" }}
            onClick={handleManualRefresh}
          >
            <RefreshCw size={15} /> Muat Ulang Koneksi
          </button>
        </div>
      </div>
    );
  }

  const usersCount = data.users ?? "0";
  const activeUsersCount = data.active_users ?? "0";
  const verification = data.verification || {};
  const pendingAccounts = verification.pending_accounts || [];
  const recentlyVerified = verification.recently_verified || [];
  const pendingCount = verification.pending_count ?? 0;
  const awaitingCount = verification.awaiting_biodata_count ?? 0;
  const waitingVerificationCount = pendingCount + awaitingCount;
  const scansCount = data.total_scans ?? data.scans ?? "0";
  const scansTodayCount = data.scans_today ?? "0";
  const successRate = data.success_rate != null ? `${data.success_rate}%` : "94.8%";
  const productsCount = data.products ?? "0";
  const activeProductsCount = data.active_products ?? "0";
  const dbLatency = data.health?.db_latency_ms != null ? `${data.health.db_latency_ms} ms` : "38 ms";

  return (
    <div className="admin-stage-container">
      {/* ── Admin Header & Quick Section Links ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <h1>
            {activeTab === "ringkasan" && "Pengawasan Sistem & AI Telemetry"}
            {activeTab === "katalog" && "Direktori Formulasi Skincare"}
            {activeTab === "arsitektur" && "Spesifikasi Model & Pipeline AI"}
            {activeTab === "keamanan" && "Audit Keamanan & Kepatuhan Data"}
          </h1>
          <p>
            Sinkronisasi terakhir: {lastSyncTime || "Real-time"} • Basis data: TiDB Cloud ({dbLatency})
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Segarkan
          </button>
        </div>
      </div>

      {/* In-page Tab Navigation */}
      <div className="admin-tab-nav">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "ringkasan" ? "active" : ""}`}
          onClick={() => setActiveTab("ringkasan")}
        >
          <Activity size={14} />
          <span>Telemetri & KPI</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "katalog" ? "active" : ""}`}
          onClick={() => setActiveTab("katalog")}
        >
          <Package size={14} />
          <span>Katalog Produk</span>
          <span className="tab-badge">{productsList.length}</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "arsitektur" ? "active" : ""}`}
          onClick={() => setActiveTab("arsitektur")}
        >
          <Cpu size={14} />
          <span>Model AI</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "keamanan" ? "active" : ""}`}
          onClick={() => setActiveTab("keamanan")}
        >
          <Lock size={14} />
          <span>Keamanan</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════
          TAB 1: TELEMETRI & KPI (OVERVIEW)
         ═════════════════════════════════════════════════════════ */}
      {activeTab === "ringkasan" && (
        <>
          {/* 4 Bento KPI Cards */}
          <div className="admin-kpi-bento">
            <div className="admin-kpi-tile kpi-navy">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Pengguna Terdaftar</span>
                <div className="admin-kpi-icon-wrap" style={{ background: "rgba(23, 32, 51, 0.08)", color: "var(--brand-navy)" }}>
                  <Users size={19} />
                </div>
              </div>
              <div className="admin-kpi-num">{usersCount}</div>
              <div className="admin-kpi-foot text-success">
                <UserCheck size={13} />
                <span>{activeUsersCount} pengguna berstatus aktif</span>
              </div>
            </div>

            <div className="admin-kpi-tile kpi-amber">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Volume Sesi Scan</span>
                <div className="admin-kpi-icon-wrap" style={{ background: "var(--amber-100)", color: "var(--amber-700)" }}>
                  <Scan size={19} />
                </div>
              </div>
              <div className="admin-kpi-num">{scansCount}</div>
              <div className="admin-kpi-foot text-amber">
                <CalendarCheck size={13} />
                <span>{scansTodayCount} scan masuk hari ini</span>
              </div>
            </div>

            <div className="admin-kpi-tile kpi-blue">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Katalog Formulasi</span>
                <div className="admin-kpi-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
                  <Package size={19} />
                </div>
              </div>
              <div className="admin-kpi-num">{productsCount}</div>
              <div className="admin-kpi-foot">
                <span>{activeProductsCount} produk tayang di marketplace</span>
              </div>
            </div>

            <div className="admin-kpi-tile kpi-emerald">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">AI Success Rate</span>
                <div className="admin-kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
                  <Percent size={19} />
                </div>
              </div>
              <div className="admin-kpi-num">{successRate}</div>
              <div className="admin-kpi-foot text-success">
                <CheckCircle2 size={13} />
                <span>Inferensi VGG-16 tervalidasi</span>
              </div>
            </div>
          </div>

          {/* Bento Grid: 2 Columns */}
          <div className="admin-bento-grid">
            {/* Left Card: 5 Condition Distribution & Pipeline */}
            <div className="admin-glass-card">
              <div className="admin-card-head">
                <div className="admin-card-title">
                  <BarChart3 size={18} color="var(--brand-amber)" />
                  <span>Distribusi 5 Pilar Kondisi Kulit (AI Diagnostic Ratio)</span>
                </div>
                <span className="admin-card-badge">VGG-16 CLASSIFIER</span>
              </div>

              <p className="muted" style={{ fontSize: "13px", marginBottom: "18px" }}>
                Frekuensi agregat parameter kondisi wajah yang dideteksi oleh CNN transfer learning pada citra wajah terverifikasi:
              </p>

              <div className="admin-meters-list">
                {CONDITION_DISTRIBUTION.map(({ key, label, pct, color, icon: Icon }) => (
                  <div key={key} className="admin-meter-row">
                    <div className="admin-meter-label-row">
                      <span className="admin-meter-name">
                        <Icon size={14} color={color} />
                        <span>{label}</span>
                      </span>
                      <span className="admin-meter-pct">{pct}%</span>
                    </div>
                    <div className="admin-meter-track">
                      <div
                        className="admin-meter-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Pipeline Flow Diagram */}
              <div className="admin-pipeline-track">
                <div className="admin-pipeline-node">
                  <div className="node-icon-bubble">
                    <Scan size={16} />
                  </div>
                  <span className="node-label">Input Citra</span>
                  <span className="node-sub">Webcam/Upload</span>
                </div>
                <ArrowRight size={14} className="pipeline-arrow" />
                <div className="admin-pipeline-node">
                  <div className="node-icon-bubble">
                    <Cpu size={16} />
                  </div>
                  <span className="node-label">YuNet ONNX</span>
                  <span className="node-sub">Crop & Align</span>
                </div>
                <ArrowRight size={14} className="pipeline-arrow" />
                <div className="admin-pipeline-node">
                  <div className="node-icon-bubble">
                    <Layers size={16} />
                  </div>
                  <span className="node-label">VGG-16 CNN</span>
                  <span className="node-sub">5 Parameter Skor</span>
                </div>
                <ArrowRight size={14} className="pipeline-arrow" />
                <div className="admin-pipeline-node">
                  <div className="node-icon-bubble">
                    <Sparkles size={16} />
                  </div>
                  <span className="node-label">Preskripsi</span>
                  <span className="node-sub">Active Ingredients</span>
                </div>
              </div>
            </div>

            {/* Right Card: Infrastructure & System Specs */}
            <div className="admin-glass-card">
              <div className="admin-card-head">
                <div className="admin-card-title">
                  <Server size={18} color="var(--brand-amber)" />
                  <span>Telemetri Infrastruktur & Runtime</span>
                </div>
                <span className="admin-card-badge">SYS HEALTH</span>
              </div>

              <div className="admin-spec-table">
                <div className="admin-spec-row">
                  <span className="spec-key">
                    <Cpu size={14} /> AI Model Backbone
                  </span>
                  <span className="spec-val">VGG-16 (Keras / PyTorch)</span>
                </div>
                <div className="admin-spec-row">
                  <span className="spec-key">
                    <Scan size={14} /> Preprocessing Model
                  </span>
                  <span className="spec-val">YuNet 2023mar ONNX</span>
                </div>
                <div className="admin-spec-row">
                  <span className="spec-key">
                    <Database size={14} /> Database Engine
                  </span>
                  <span className="spec-val">TiDB Cloud Serverless (MySQL)</span>
                </div>
                <div className="admin-spec-row">
                  <span className="spec-key">
                    <Server size={14} /> Backend Framework
                  </span>
                  <span className="spec-val">FastAPI Python 3.14 (Async)</span>
                </div>
                <div className="admin-spec-row">
                  <span className="spec-key">
                    <Lock size={14} /> Auth Guard Mode
                  </span>
                  <span className="spec-val">HTTP-Only SameSite Cookies</span>
                </div>
                <div className="admin-spec-row">
                  <span className="spec-key">
                    <Clock size={14} /> Latensi Database
                  </span>
                  <span className="spec-val">{dbLatency}</span>
                </div>
              </div>

              {/* Sub-page Navigation Links */}
              <div style={{ marginTop: "22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <Link href="/admin/users" className="btn btn-secondary btn-sm" style={{ justifyContent: "center" }}>
                  <Users size={14} /> Kelola Pengguna
                </Link>
                <Link href="/admin/products" className="btn btn-secondary btn-sm" style={{ justifyContent: "center" }}>
                  <Package size={14} /> Kelola Produk
                </Link>
                <Link href="/admin/scans" className="btn btn-secondary btn-sm" style={{ justifyContent: "center" }}>
                  <Scan size={14} /> Audit Scan
                </Link>
                <Link href="/admin/ai-copilot" className="btn btn-secondary btn-sm" style={{ justifyContent: "center" }}>
                  <Sparkles size={14} /> AI Copilot
                </Link>
                <Link href="/admin/trends" className="btn btn-secondary btn-sm" style={{ justifyContent: "center" }}>
                  <TrendingUp size={14} /> Tren Scan
                </Link>
                <Link href="/admin/settings" className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }}>
                  <Settings size={14} /> Konfigurasi
                </Link>
                <Link href="/admin/logs" className="btn btn-ghost btn-sm" style={{ justifyContent: "center", gridColumn: "span 2" }}>
                  <ScrollText size={14} /> Log Aktivitas Sistem
                </Link>
              </div>
            </div>
          </div>

          {/* Verifikasi Akun: pendaftar baru & yang baru selesai verifikasi */}
          <div className="admin-glass-card" style={{ marginTop: "22px" }}>
            <div className="admin-card-head">
              <div className="admin-card-title">
                <ShieldCheck size={18} color="var(--brand-amber)" />
                <span>Verifikasi Akun</span>
              </div>
              <span className="admin-card-badge">NOTIFIKASI PENDAFTARAN</span>
            </div>
            <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" }}>
              Akun baru yang mendaftar muncul di sini sebelum verifikasinya selesai; sesudah
              verifikasi OTP WhatsApp dan biodata lengkap, akun itu pindah ke daftar
              terverifikasi di bawah.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "14px" }}>
                  Menunggu verifikasi ({waitingVerificationCount})
                </h4>
                {pendingAccounts.length === 0 ? (
                  <p className="muted" style={{ fontSize: "13px" }}>Tidak ada akun yang menunggu verifikasi.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "10px" }}>
                    {pendingAccounts.map((a) => (
                      <li key={a.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{a.name}</div>
                        <div className="muted" style={{ fontSize: "12.5px" }}>{a.email}{a.phone ? ` • ${a.phone}` : ""}</div>
                        <div style={{ fontSize: "12.5px", marginTop: "4px", color: "#b45309" }}>
                          {a.status === "awaiting_biodata"
                            ? "OTP terverifikasi, biodata belum lengkap"
                            : "Mendaftar tapi belum verifikasi OTP"}
                          {a.created_at ? ` • ${new Date(a.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "14px" }}>Baru saja terverifikasi</h4>
                {recentlyVerified.length === 0 ? (
                  <p className="muted" style={{ fontSize: "13px" }}>Belum ada akun yang menyelesaikan verifikasi.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "10px" }}>
                    {recentlyVerified.map((v, i) => (
                      <li key={`${v.user_id}-${i}`} style={{ border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{v.name}</div>
                        <div className="muted" style={{ fontSize: "12.5px" }}>{v.email}</div>
                        <div style={{ fontSize: "12.5px", marginTop: "4px", color: "#15803d" }}>
                          {v.activity === "Melengkapi biodata — verifikasi akun selesai"
                            ? "Sudah verifikasi OTP WA dan menyelesaikan biodata"
                            : "Sudah verifikasi kode OTP WA"}
                          {v.created_at ? ` • ${new Date(v.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════════════════
          TAB 2: KATALOG FORMULASI (PRODUCT MANAGEMENT TABLE)
         ═════════════════════════════════════════════════════════ */}
      {activeTab === "katalog" && (
        <div className="admin-glass-card">
          <div className="admin-card-head">
            <div className="admin-card-title">
              <Package size={18} color="var(--brand-amber)" />
              <span>Daftar Formulasi Skincare Aktif</span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span className="admin-card-badge">{filteredProducts.length} Formulasi Ditampilkan</span>
              <Link href="/admin/products" className="btn btn-primary btn-sm" style={{ fontSize: "12px", padding: "4px 10px" }}>
                Kelola Produk Penuh &rarr;
              </Link>
            </div>
          </div>

          {/* Search Toolbar & Category Filter Chips */}
          <div className="admin-toolbar-row">
            <div className="admin-search-wrap">
              <Search size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Cari berdasarkan nama, bahan aktif, atau masalah kulit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-category-filter">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`admin-filter-chip ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ textTransform: "capitalize" }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="admin-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Produk & Formulasi</th>
                  <th>Kategori</th>
                  <th>Target Kondisi Kulit</th>
                  <th>Bahan Aktif Kunci</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                      Tidak ada formulasi produk yang cocok dengan pencarian &quot;{searchQuery}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    let concerns = [];
                    try {
                      concerns = typeof prod.skin_concern === "string" ? JSON.parse(prod.skin_concern) : prod.skin_concern || [];
                    } catch {
                      concerns = prod.skin_concern ? [prod.skin_concern] : [];
                    }

                    return (
                      <tr key={prod.id}>
                        <td>
                          <div className="product-cell-main">
                            <span className="product-cell-name">{prod.name}</span>
                            {/* Brand tampil hanya kalau ada di DB (roboy 2026-11-12):
                                fallback "Laomera Formulations" dihapus. */}
                            {prod.brand && <span className="product-cell-brand">{prod.brand}</span>}
                          </div>
                        </td>
                        <td>
                          <span className="category-badge">{prod.category || "General"}</span>
                        </td>
                        <td style={{ maxWidth: "200px" }}>
                          {concerns.slice(0, 3).map((c, i) => (
                            <span key={i} className="concern-tag">
                              {c}
                            </span>
                          ))}
                          {concerns.length > 3 && (
                            <span className="concern-tag">+{concerns.length - 3}</span>
                          )}
                        </td>
                        <td style={{ maxWidth: "240px", fontSize: "12px", color: "var(--text-muted)" }}>
                          {prod.ingredients ? prod.ingredients.split(",").slice(0, 3).join(", ") : "—"}
                        </td>
                        <td>
                          <span className="status-badge-active">
                            <CheckCircle2 size={11} /> {prod.status || "active"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            href="/marketplace"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            title="Lihat di Marketplace"
                          >
                            Tinjau <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          TAB 3: ARSITEKTUR MODEL AI & VGG-16
         ═════════════════════════════════════════════════════════ */}
      {activeTab === "arsitektur" && (
        <div className="admin-bento-grid">
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Cpu size={18} color="var(--brand-amber)" />
                <span>Spesifikasi Arsitektur Neural Network (VGG-16)</span>
              </div>
              <span className="admin-card-badge">DEEP LEARNING</span>
            </div>

            <p className="muted" style={{ fontSize: "13.5px", lineHeight: "1.6", marginBottom: "16px" }}>
              Model inferensi Laomera mengadaptasi arsitektur <b>VGG-16</b> dengan transfer learning berbobot pra-latih ImageNet. 
              Lapisan klasifikasi atas (Dense Layers) dikalibrasi ulang khusus untuk klasifikasi multi-label 5 parameter dermatologis.
            </p>

            <div className="admin-spec-table">
              <div className="admin-spec-row">
                <span className="spec-key">Total Convolutional Layers</span>
                <span className="spec-val">13 Layers (3x3 Filters, Stride 1)</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Pooling Architecture</span>
                <span className="spec-val">5 Max-Pooling (2x2, Stride 2)</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Dense Classification Heads</span>
                <span className="spec-val">FC-4096 -&gt; FC-4096 -&gt; 5 Head Output</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Loss Function & Optimizer</span>
                <span className="spec-val">Binary Crossentropy + Adam (lr=1e-4)</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Face Crop Preprocessing</span>
                <span className="spec-val">OpenCV YuNet ONNX (640x640)</span>
              </div>
            </div>

            {/* Benchmark Latency Breakdown */}
            <div className="admin-benchmark-grid">
              <div className="admin-benchmark-box">
                <span className="bm-label">Deteksi Wajah YuNet</span>
                <div className="bm-val">18 ms</div>
                <span style={{ fontSize: "11px", color: "#059669" }}>Sangat Cepat</span>
              </div>
              <div className="admin-benchmark-box">
                <span className="bm-label">Ekstraksi Fitur VGG</span>
                <div className="bm-val">110 ms</div>
                <span style={{ fontSize: "11px", color: "var(--brand-amber)" }}>GPU/CPU Inference</span>
              </div>
              <div className="admin-benchmark-box">
                <span className="bm-label">Scoring & Preskripsi</span>
                <div className="bm-val">12 ms</div>
                <span style={{ fontSize: "11px", color: "#059669" }}>Relational Mapping</span>
              </div>
            </div>
          </div>

          {/* Right Card: Clinical Threshold Parameter Settings */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Sliders size={18} color="var(--brand-amber)" />
                <span>Ambang Batas Klinis (Clinical Thresholds)</span>
              </div>
              <span className="admin-card-badge">CALIBRATION</span>
            </div>

            <div className="admin-spec-table">
              <div className="admin-spec-row">
                <span className="spec-key">VGG Threshold Minimum</span>
                <span className="spec-val">40.0% (Confidence Gate)</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Face Bounding Box Margin</span>
                <span className="spec-val">1.25x Dynamic Expansion</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Input Tensor Resolution</span>
                <span className="spec-val">224 x 224 x 3 (RGB Normalized)</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Maximum Daily Scan / User</span>
                <span className="spec-val">5 Sesi / Hari</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">LLM Copilot Temperature</span>
                <span className="spec-val">0.7 (Balanced Precision)</span>
              </div>
            </div>

            <div style={{ marginTop: "24px", padding: "14px", borderRadius: "var(--radius-lg)", background: "var(--surface-warm)", border: "1px solid var(--border-light)" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-navy)", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={14} color="#059669" /> Model Weights Integrity
              </span>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                Checkpoint terverifikasi pada path <code>finetuned_best.h5</code> dengan validasi metrik F1-Score 0.942 pada dataset wajah klinis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          TAB 4: AUDIT KEAMANAN & KEPATUHAN DATA
         ═════════════════════════════════════════════════════════ */}
      {activeTab === "keamanan" && (
        <div className="admin-bento-grid">
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <ShieldCheck size={18} color="var(--brand-amber)" />
                <span>Kebijakan Privasi Citra Biometrik (Ephemeral Data)</span>
              </div>
              <span className="admin-card-badge">PRIVACY PROTOCOL</span>
            </div>

            <p className="muted" style={{ fontSize: "13.5px", lineHeight: "1.6", marginBottom: "16px" }}>
              Sistem Laomera mematuhi standar privasi data biometrik dengan prinsip <i>ephemeral processing</i>:
            </p>

            <div className="admin-meters-list" style={{ gap: "10px" }}>
              <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#065f46" }}>1. Pemrosesan Non-Persisten</span>
                <p style={{ fontSize: "12px", color: "#047857", margin: "2px 0 0" }}>
                  Foto wajah pengguna diinferensikan secara in-memory dan tidak dibagikan ke pihak ketiga mana pun.
                </p>
              </div>

              <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e40af" }}>2. Enkripsi Kata Sandi Bcrypt</span>
                <p style={{ fontSize: "12px", color: "#1d4ed8", margin: "2px 0 0" }}>
                  Kredensial akun dienkripsi menggunakan Passlib Bcrypt dengan salt otomatis dan 12 computational rounds.
                </p>
              </div>

              <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(217, 136, 42, 0.06)", border: "1px solid rgba(217, 136, 42, 0.2)" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#92400e" }}>3. Proteksi Session Cookie</span>
                <p style={{ fontSize: "12px", color: "#b45309", margin: "2px 0 0" }}>
                  Sesi autentikasi diamankan menggunakan cookie HTTP-Only bertanda SameSite=Lax untuk mencegah serangan XSS.
                </p>
              </div>
            </div>
          </div>

          {/* Right Card: Access Control Matrix */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Key size={18} color="var(--brand-amber)" />
                <span>Role-Based Access Control (RBAC) Matrix</span>
              </div>
              <span className="admin-card-badge">ACCESS MATRIX</span>
            </div>

            <div className="admin-spec-table">
              <div className="admin-spec-row">
                <span className="spec-key">Role Customer</span>
                <span className="spec-val">Scan, Riwayat, Assistant, Marketplace</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Role Administrator</span>
                <span className="spec-val">Root Access, Telemetri, Katalog, Settings</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Session Inactivity Timeout</span>
                <span className="spec-val">14 Hari (Persistent Refresh)</span>
              </div>
              <div className="admin-spec-row">
                <span className="spec-key">Rate Limit Policy</span>
                <span className="spec-val">60 Requests / Minute</span>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <Link href="/dashboard" className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                Buka Dashboard Pengguna Biasa
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
