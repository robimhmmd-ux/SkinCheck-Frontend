"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Camera,
  History,
  ShoppingBag,
  Bot,
  User,
  LogOut,
  Home as HomeIcon,
  Sparkles,
  ShieldAlert,
  Users,
  Package,
  ScanSearch,
  BrainCircuit,
  TrendingUp,
  Settings,
  ScrollText,
} from "lucide-react";
import { getMe, logout, pickUser } from "../lib/api";
import { useToast, ConfirmDialog } from "./Toast";

const SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan Kulit", icon: Camera },
  { href: "/history", label: "Riwayat & Diagnosis", icon: History },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/assistant", label: "Laomera Asisten", icon: Bot },
  { href: "/profile", label: "Profil Akun", icon: User },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard Admin", icon: ShieldAlert },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/scans", label: "Audit Scan", icon: ScanSearch },
  { href: "/admin/ai-copilot", label: "AI Copilot", icon: BrainCircuit },
  { href: "/admin/trends", label: "Tren Scan", icon: TrendingUp },
  { href: "/admin/settings", label: "Konfigurasi", icon: Settings },
  { href: "/admin/logs", label: "Log Aktivitas", icon: ScrollText },
];

export default function WorkspaceSidebar({ collapsed = false, onToggle, onClose }) {
  const [user, setUser] = useState(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const isUnverified =
    user?.role === "customer" && user?.status && user.status !== "active";

  useEffect(() => {
    let alive = true;
    getMe()
      .then((d) => {
        if (alive) setUser(pickUser(d));
      })
      .catch(() => {
        if (alive) setUser(null);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const links = (isAdminRoute || user?.role === "admin") ? ADMIN_LINKS : SIDEBAR_LINKS;

  // Temukan indeks rute aktif saat ini
  const computedActiveIndex = links.findIndex(({ href }) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  });

  const hasActiveLink = computedActiveIndex >= 0;
  const [glideIndex, setGlideIndex] = useState(hasActiveLink ? computedActiveIndex : 0);

  // Selaraskan posisi indikator notch saat rute halaman berubah
  useEffect(() => {
    if (computedActiveIndex >= 0) {
      setGlideIndex(computedActiveIndex);
    }
  }, [computedActiveIndex]);

  async function handleLogout() {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await logout();
      toast.success("Anda berhasil logout.");
      router.push("/");
      router.refresh();
    } catch {
      toast.success("Anda berhasil logout.");
      router.push("/");
      router.refresh();
    } finally {
      setLogoutBusy(false);
    }
  }

  function handleNavClick(e, href, idx) {
    if (isUnverified) {
      e.preventDefault();
      return;
    }

    // Picu animasi luncur indikator seketika pada saat klik
    if (typeof idx === "number") {
      setGlideIndex(idx);
    }

    // Picu loading screen skeleton + spinner di canvas saat navigasi ke halaman baru
    if (typeof window !== "undefined" && href !== pathname && href !== "/assistant") {
      const itemLabel = typeof idx === "number" ? links[idx]?.label : undefined;
      window.dispatchEvent(new CustomEvent("laomera-nav-start", { detail: { href, label: itemLabel } }));
    }

    if (href === "/assistant") {
      e.preventDefault();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-laomera-chat"));
        window.dispatchEvent(new CustomEvent("open-skincheck-chat"));
      }
    }

    try {
      if (window.innerWidth < 1024 && onClose) onClose();
    } catch {
      // ignore
    }
  }

  return (
    <>
      <aside
        className={`dash-side-slide ${collapsed ? "side-rail-mini" : "side-rail-expanded"}`}
        aria-label="Navigasi Sidebar"
      >
        <div className="dash-side-slide-inner">
          {/* Header & Brand Emblem (Klik Logo L untuk Ciutkan/Buka Sidebar tanpa redirect) */}
          <div className="side-slide-header">
            <button
              type="button"
              className="side-slide-brand"
              onClick={onToggle}
              title={collapsed ? "Buka Navigasi Penuh (Klik L)" : "Ciutkan Navigasi ke Icon Rail (Klik L)"}
              aria-label={collapsed ? "Buka Navigasi Penuh" : "Ciutkan Navigasi"}
            >
              <div className="brand-emblem-icon" aria-hidden="true">
                L
              </div>
              {!collapsed && (
                <div className="brand-title-wrap">
                  <span className="brand-title-text">Laomera</span>
                  <span className="brand-sub-badge">SYSTEM</span>
                </div>
              )}
            </button>
          </div>

          {/* User Profile Card (Hanya muncul jika sidebar tidak tersembunyi / expanded) */}
          {!collapsed && (
            <div className="side-slide-user-card">
              <div className="user-card-avatar" aria-hidden="true">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                <span className="user-status-dot-avatar" />
              </div>
              <div className="user-card-meta">
                <strong className="user-card-name">{user?.name || "Pengguna Laomera"}</strong>
                <div className="user-status-pill">
                  <span className="user-status-dot" />
                  <span>{user?.role === "admin" ? "Administrator Sistem" : user?.email || "Sesi Masuk Aktif"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigasi Utama dengan Notch Bergulir (Liquid Sliding Notch) */}
          <nav
            className="side-slide-nav"
            aria-label={user?.role === "admin" ? "Navigasi Admin" : "Navigasi Workspace"}
            style={{ "--glide-index": glideIndex }}
          >
            {!collapsed && (
              <span className="side-nav-heading">
                {user?.role === "admin" ? "ADMINISTRATOR" : "WORKSPACE"}
              </span>
            )}

            <div className="side-nav-track">
              {/* Indikator Slider Geroak (Inward Cutout Curved Slider) —
                  efek berongga DIKEMBALIKAN per roboy 2026-11-12 13:44
                  ("pertahankan efek rongganya, hilangkan kotak warna biru
                  aja"). Pilnya kini kaca (bukan biru solid) supaya tidak
                  jadi "kotak biru"; lekukan birunya yang bikin efek rongga. */}
              <div
                className="magic-geroak-slider"
                aria-hidden="true"
                style={{ display: hasActiveLink ? "block" : "none" }}
              />

              {/* Daftar Tautan Navigasi */}
              <div className="side-nav-links-list">
                {links.map(({ href, label, icon: Icon }, idx) => {
                  const active = hasActiveLink && idx === glideIndex;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`side-nav-link iso-pro ${active ? "active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      aria-disabled={isUnverified ? true : undefined}
                      title={isUnverified ? "Selesaikan verifikasi akun dulu" : (collapsed ? undefined : label)}
                      onClick={(e) => handleNavClick(e, href, idx)}
                      style={isUnverified ? { opacity: 0.55 } : undefined}
                    >
                      {/* Isometric Projection Layers (From Uiverse.io by MijailVillegas) */}
                      <span className="iso-layer iso-layer-1" aria-hidden="true" />
                      <span className="iso-layer iso-layer-2" aria-hidden="true" />
                      <span className="iso-layer iso-layer-3" aria-hidden="true" />

                      <span className="side-nav-icon-wrap" aria-hidden="true">
                        <Icon size={19} />
                      </span>
                      {!collapsed && <span className="side-nav-text">{label}</span>}
                      {collapsed && <div className="text side-nav-tooltip">{label}</div>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Customer Action Box ("Mulai Scan") - hanya saat expanded dan role customer */}
          {user?.role !== "admin" && !collapsed && (
            <div className="side-slide-action-box">
              <div className="action-box-head">
                <Sparkles size={14} color="var(--sunflower-yellow)" />
                <span>Analisis Baru</span>
              </div>
              <p>Ambil foto wajah untuk memperbarui skor kesehatan kulit.</p>
              <Link
                href="/scan"
                className="btn btn-amber btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={(e) => handleNavClick(e, "/scan")}
              >
                <Camera size={15} />
                <span>Mulai Scan</span>
              </Link>
            </div>
          )}

          {/* Footer Controls */}
          <div className="side-slide-footer">
            <Link
              href="/"
              className="side-slide-foot-link iso-pro"
              title={collapsed ? undefined : "Ke Beranda"}
            >
              <span className="iso-layer iso-layer-1" aria-hidden="true" />
              <span className="iso-layer iso-layer-2" aria-hidden="true" />
              <span className="iso-layer iso-layer-3" aria-hidden="true" />

              <span className="side-nav-icon-wrap" aria-hidden="true">
                <HomeIcon size={17} />
              </span>
              {!collapsed && <span>Ke Beranda</span>}
              {collapsed && <div className="text side-nav-tooltip">Ke Beranda</div>}
            </Link>
            <button
              type="button"
              className="side-slide-logout-btn iso-pro"
              onClick={() => setConfirmLogout(true)}
              disabled={logoutBusy}
              title={collapsed ? undefined : "Keluar"}
            >
              <span className="iso-layer iso-layer-1" aria-hidden="true" />
              <span className="iso-layer iso-layer-2" aria-hidden="true" />
              <span className="iso-layer iso-layer-3" aria-hidden="true" />

              <span className="side-nav-icon-wrap" aria-hidden="true">
                <LogOut size={17} />
              </span>
              {!collapsed && <span>{logoutBusy ? "…" : "Keluar"}</span>}
              {collapsed && <div className="text side-nav-tooltip">Keluar</div>}
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmLogout}
        title="Yakin mau keluar?"
        message="Sesi kamu akan diakhiri dan kamu perlu masuk kembali untuk mengakses riwayat dan diagnosis."
        confirmLabel="Ya, keluar"
        onConfirm={() => {
          setConfirmLogout(false);
          handleLogout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
