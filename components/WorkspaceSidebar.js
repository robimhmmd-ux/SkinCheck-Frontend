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

// Tautan admin (HANYA tampil kalau user.role === "admin").
// Catatan: Menu 'Profil Admin' telah disatukan ke dalam bilah 'Konfigurasi'.
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

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

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

  async function handleLogout() {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await logout();
      toast.success("Anda berhasil logout.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.success("Anda berhasil logout.");
      router.push("/login");
    } finally {
      setLogoutBusy(false);
    }
  }

  function handleNavClick(e, href) {
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
          {/* Header & Brand Emblem */}
          <div className="side-slide-header">
            <Link href="/" className="side-slide-brand" title="Ke Beranda Laomera">
              <div className="brand-emblem-icon" aria-hidden="true">
                L
              </div>
              {!collapsed && <span className="brand-title-text">Laomera</span>}
            </Link>

            {/* Tombol ciutkan (>) saat sidebar lebar */}
            {!collapsed && onToggle && (
              <button
                type="button"
                className="side-collapse-btn"
                onClick={onToggle}
                title="Ciutkan Sidebar ke Icon Rail (>)"
                aria-label="Ciutkan Sidebar"
              >
                <span className="side-toggle-arrow">&gt;</span>
              </button>
            )}
          </div>

          {/* Tombol buka (<) kecil saat sidebar dalam mode icon rail mini */}
          {collapsed && onToggle && (
            <div className="side-mini-toggle-wrap">
              <button
                type="button"
                className="side-expand-mini-btn"
                onClick={onToggle}
                title="Buka Navigasi Penuh (<)"
                aria-label="Buka Navigasi Penuh"
              >
                <span className="side-toggle-arrow">&lt;</span>
              </button>
            </div>
          )}

          {/* User Profile Card */}
          <div
            className="side-slide-user-card"
            title={collapsed ? user?.name || "Pengguna Laomera" : undefined}
          >
            <div className="user-card-avatar" aria-hidden="true">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
            </div>
            {!collapsed && (
              <div className="user-card-meta">
                <strong className="user-card-name">{user?.name || "Pengguna Laomera"}</strong>
                <div className="user-status-pill">
                  <span className="user-status-dot" />
                  <span>{user?.email || "Sesi Masuk Aktif"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigasi Workspace (Customer) */}
          {!isAdminPage && (
            <nav className="side-slide-nav" aria-label="Navigasi Workspace">
              {!collapsed && <span className="side-nav-heading">WORKSPACE</span>}
              {SIDEBAR_LINKS.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`side-nav-link ${active ? "active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    title={label}
                    onClick={(e) => handleNavClick(e, href)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {!collapsed && <span className="side-nav-text">{label}</span>}
                    {active && !collapsed && <span className="side-nav-dot" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Navigasi Admin */}
          {user?.role === "admin" && (
            <nav className="side-slide-nav" aria-label="Navigasi Admin">
              {!collapsed && <span className="side-nav-heading">ADMIN</span>}
              {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`side-nav-link ${active ? "active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    title={label}
                    onClick={(e) => handleNavClick(e, href)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {!collapsed && <span className="side-nav-text">{label}</span>}
                    {active && !collapsed && <span className="side-nav-dot" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Customer Action Box ("Mulai Scan") - hanya saat expanded */}
          {!isAdminPage && !collapsed && (
            <div className="side-slide-action-box">
              <div className="action-box-head">
                <Sparkles size={14} color="#f59e0b" />
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
            <Link href="/" className="side-slide-foot-link" title="Ke Beranda">
              <HomeIcon size={16} />
              {!collapsed && <span>Ke Beranda</span>}
            </Link>
            <button
              type="button"
              className="side-slide-logout-btn"
              onClick={() => setConfirmLogout(true)}
              disabled={logoutBusy}
              title="Keluar"
            >
              <LogOut size={16} />
              {!collapsed && <span>{logoutBusy ? "…" : "Keluar"}</span>}
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
