"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  History,
  Bot,
  Activity,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  ShoppingBag,
  Flame,
  Droplets,
  Zap,
  Sun,
  ChevronRight,
  AlertCircle,
  LayoutDashboard,
  User,
  LogOut,
  Home as HomeIcon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
} from "lucide-react";
import { getMe, getDashboard, getHistory, getProducts, logout, pickUser, pickObject, pickArray } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import WorkspaceLoadingScreen from "../../components/WorkspaceLoadingScreen";
import { useToast } from "../../components/Toast";
import { SCORE_KEYS, averageScores, latestAnalyzedScan, fmtScore, fmtDate, pickAnalysis } from "../../lib/scores";

const STATUS_LABEL = {
  completed: "Selesai",
  processing: "Diproses",
  failed: "Gagal",
  pending: "Menunggu",
};

function statusLabel(status) {
  return STATUS_LABEL[status] || status || "—";
}

function fmtDateShort(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

const DASH_SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan Kulit", icon: Camera },
  { href: "/history", label: "Riwayat & Diagnosis", icon: History },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/assistant", label: "Laomera Asisten", icon: Bot },
  { href: "/profile", label: "Profil Akun", icon: User },
];

// Client-safe CountUp with zero hydration mismatch
function CountUp({ value, suffix = "" }) {
  const [mounted, setMounted] = useState(false);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    setMounted(true);
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(n);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 950;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(n * e * 10) / 10);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  if (!mounted || value == null || !Number.isFinite(Number(value))) {
    return (
      <span>
        {value != null && Number.isFinite(Number(value)) ? `${fmtScore(value)}${suffix}` : "—"}
      </span>
    );
  }

  return (
    <span>
      {fmtScore(display)}{suffix}
    </span>
  );
}

// Diagnostic condition meter row
function ScoreMeterRow({ label, value }) {
  const finite = value != null && Number.isFinite(Number(value));
  const pct = finite ? Math.max(0, Math.min(100, Number(value))) : 0;

  let barGradient = "linear-gradient(90deg, #d9882a 0%, #e8a149 100%)";
  if (pct >= 70) {
    barGradient = "linear-gradient(90deg, #2a6a52 0%, #3a8a6d 100%)";
  } else if (pct < 40) {
    barGradient = "linear-gradient(90deg, #c53030 0%, #e9957d 100%)";
  }

  return (
    <div className="dash-meter-row">
      <div className="dash-meter-info">
        <span className="meter-name">{label}</span>
        <b className="meter-val">{finite ? `${value}%` : "—"}</b>
      </div>
      <div className="dash-meter-rail" aria-hidden="true">
        <div
          className="dash-meter-fill"
          style={{
            width: `${pct}%`,
            background: barGradient,
          }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [meRes, dashRes, histRes, prodRes] = await Promise.allSettled([
          getMe(),
          getDashboard(),
          getHistory(),
          getProducts(8),
        ]);

        if (!alive) return;

        if (meRes.status === "fulfilled") {
          const currentUser = pickUser(meRes.value);
          setUser(currentUser);
          if (currentUser?.role === "admin") {
            router.replace("/admin");
            return;
          }
        }
        if (dashRes.status === "fulfilled") setDashboard(pickObject(dashRes.value));
        if (histRes.status === "fulfilled") setHistory(pickArray(histRes.value));
        if (prodRes.status === "fulfilled") setProducts(pickArray(prodRes.value));

        const firstErr = [meRes, dashRes, histRes].find((r) => r.status === "rejected");
        if (firstErr) setError(firstErr.reason);
      } catch (err) {
        if (alive) setError(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const scans = history.length ? history : pickArray(dashboard && (dashboard.recent_scans || dashboard.scans));
  const latest = latestAnalyzedScan(scans);
  const analysis = latest ? pickAnalysis(latest) : null;
  const overallScore = analysis?.overall_score;

  const totalScans = scans.length;
  const analyzedCount = scans.filter((s) => s.status === "completed").length;
  const pendingCount = scans.filter((s) => s.status === "processing" || s.status === "pending").length;

  let topFinding = null;
  if (analysis) {
    for (const [key, label] of SCORE_KEYS) {
      if (key === "overall_score") continue;
      const v = Number(analysis[key]);
      if (Number.isFinite(v) && (topFinding === null || v > topFinding.value)) {
        topFinding = { label, value: v };
      }
    }
  }

  return (
    <>
      <WorkspaceLoadingScreen
        active={loading}
        caption="Memuat Riwayat Kesehatan Kulitmu…"
        skeleton={true}
      />
      <div className="dashboard-fullscreen-flow">
          {/* ── 1. HERO GREETING (UNBOXED & EXPANSIVE) ── */}
          <section className="dash-hero-unboxed">
            <div className="content-canvas dash-hero-canvas">
              <div className="dash-hero-content">
                <div className="badge badge-amber" style={{ width: "fit-content", marginBottom: "8px" }}>
                  <Sparkles size={13} aria-hidden="true" />
                  <span>RINGKASAN DIAGNOSIS TERKINI</span>
                </div>

                <h1 className="dash-hero-title">
                  {user ? `Halo, ${user.name || user.email}` : "Dashboard Kesehatan Kulit"}
                </h1>
                <p className="dash-hero-sub">
                  {latest
                    ? `Hasil pemindaian terakhir tercatat pada ${fmtDate(latest.created_at || latest.created)}. Sistem AI memantau regenerasi kulitmu secara berkala.`
                    : "Mulai perjalanan kesehatan kulitmu dengan melakukan pemindaian pertama. Analisis AI akan mengevaluasi 5 pilar kesehatan wajah secara objektif."}
                </p>

                <div className="dash-hero-actions">
                  <Link href="/scan" className="btn btn-amber">
                    <Camera size={18} aria-hidden="true" />
                    <span>Ambil Scan Baru</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("open-laomera-chat"));
                        window.dispatchEvent(new CustomEvent("open-skincheck-chat"));
                      }
                    }}
                  >
                    <Bot size={18} aria-hidden="true" />
                    <span>Konsultasi AI</span>
                  </button>
                </div>
              </div>

              {/* Big Score Counter Display */}
              <div className="dash-hero-score-stat">
                <span className="dash-score-badge-label">SKOR KESEHATAN KULIT</span>
                <div className="dash-big-score-wrap">
                  <span className="dash-big-score-num">
                    <CountUp value={overallScore} />
                  </span>
                  <span className="dash-score-scale">/100</span>
                </div>
                <p className="dash-score-caption">
                  {overallScore != null
                    ? overallScore >= 75
                      ? "Kondisi prima. Pertahankan hidrasi dan proteksi UV."
                      : overallScore >= 50
                      ? "Kondisi seimbang, butuh perhatian pada area tertentu."
                      : "Perlu perawatan intensif pada pilar hidrasi & sebum."
                    : "Belum ada skor analisis tersimpan"}
                </p>
              </div>
            </div>
          </section>

          {/* ── 2. METRICS STRIP (3 UNBOXED STAT PILLARS) ── */}
          <section className="dash-kpi-unboxed">
            <div className="content-canvas dash-kpi-strip">
              <div className="dash-kpi-pillar">
                <span className="kpi-label">TOTAL SESI PEMINDAIAN</span>
                <strong className="kpi-value">{totalScans}</strong>
                <span className="kpi-subtext">{analyzedCount} sesi selesai dianalisis</span>
              </div>

              <div className="dash-kpi-pillar">
                <span className="kpi-label">STATUS INFERENCE AI</span>
                <strong className="kpi-value">
                  {pendingCount > 0 ? `${pendingCount} Antre` : "Optimal"}
                </strong>
                <span className="kpi-subtext">Model VGG-16 berjalan stabil</span>
              </div>

              <div className="dash-kpi-pillar">
                <span className="kpi-label">FOKUS PERAWATAN UTAMA</span>
                <strong className="kpi-value">{topFinding ? topFinding.label : "Normal"}</strong>
                <span className="kpi-subtext">
                  {topFinding ? `Skor keterpaparan ${topFinding.value}%` : "Kondisi wajah stabil"}
                </span>
              </div>
            </div>
          </section>

          {/* ── 3. WORKSPACE CORE: METERS & RECENT SCANS ── */}
          <div className="content-canvas dash-workspace-grid">
            {/* Condition Meters Panel */}
            <section className="dash-workspace-panel">
              <div className="panel-header-row">
                <div>
                  <h2 className="panel-title">Tingkat 5 Kondisi Wajah</h2>
                  <p className="panel-subtitle">Tingkat persentase kondisi kulit hasil deteksi neural terkini.</p>
                </div>
                <Link href="/history" className="panel-link">
                  Lihat Riwayat &amp; Diagnosis <ChevronRight size={14} />
                </Link>
              </div>

              <div className="dash-meters-stack">
                <ScoreMeterRow label="Jerawat & Inflamasi (Acne)" value={analysis?.acne_score} />
                <ScoreMeterRow label="Dehidrasi & Kulit Kering (Dryness)" value={analysis?.dryness_score} />
                <ScoreMeterRow label="Produksi Minyak & Sebum (Oiliness)" value={analysis?.oiliness_score} />
                <ScoreMeterRow label="Noda Gelap & Pigmen (Dark Spots)" value={analysis?.darkspots_score} />
                <ScoreMeterRow label="Garis Halus & Kerutan (Wrinkles)" value={analysis?.wrinkles_score} />
              </div>
            </section>

            {/* Recent Scans List */}
            <section className="dash-workspace-panel">
              <div className="panel-header-row">
                <div>
                  <h2 className="panel-title">Riwayat Sesi Terkini</h2>
                  <p className="panel-subtitle">Daftar pemindaian wajah yang tersimpan di cloud.</p>
                </div>
                <Link href="/history" className="panel-link">
                  Semua Riwayat <ChevronRight size={14} />
                </Link>
              </div>

              {scans.length === 0 ? (
                <div className="dash-empty-state">
                  <Camera size={32} color="var(--ink-300)" style={{ margin: "0 auto 8px" }} />
                  <p>Belum ada riwayat pemindaian.</p>
                  <Link href="/scan" className="btn btn-primary btn-sm">Mulai Scan Pertama</Link>
                </div>
              ) : (
                <div className="dash-recent-list">
                  {scans.slice(0, 4).map((s) => {
                    const sAnalysis = pickAnalysis(s);
                    const sScore = sAnalysis?.overall_score;
                    const status = s.status || "completed";
                    return (
                      <Link key={s.id} href={`/history/${s.id}`} className="recent-scan-item">
                        <div className="scan-item-lead">
                          <div className="scan-id-badge">#{s.id}</div>
                          <div>
                            <strong>{fmtDate(s.created_at || s.created)}</strong>
                            <span className="scan-status-text">Status: {statusLabel(status)}</span>
                          </div>
                        </div>
                        <div className="scan-item-score">
                          {sScore != null ? (
                            <span className="score-pill">{sScore}%</span>
                          ) : (
                            <span className="score-pill empty">—</span>
                          )}
                          <ChevronRight size={16} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── 4. RECOMMENDED PRODUCTS CAROUSEL ── */}
          <section className="dash-products-section">
            <div className="content-canvas">
              <div className="panel-header-row">
                <div>
                  <h2 className="panel-title">Rekomendasi Formulasi untuk Kulitmu</h2>
                  <p className="panel-subtitle">Katalog skincare terkurasi berdasarkan hasil diagnosis.</p>
                </div>
                <Link href="/marketplace" className="panel-link">
                  Buka Marketplace <ChevronRight size={14} />
                </Link>
              </div>

              <div className="dash-products-scroll-row">
                {products.slice(0, 6).map((p) => (
                  <div key={p.id} className="dash-product-item">
                    <span className="dash-product-brand">{p.brand || "Laomera Lab"}</span>
                    <h3 className="dash-product-name">{p.name}</h3>
                    <p className="dash-product-concern">{p.target_concern || "Semua jenis kulit"}</p>
                    <div className="dash-product-foot">
                      <span className="dash-product-price">
                        {p.price ? `Rp ${Number(p.price).toLocaleString("id-ID")}` : "Tersedia"}
                      </span>
                      <Link href={`/marketplace`} className="btn btn-secondary btn-sm">
                        Tinjau
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
    </div>
    </>
  );
}
