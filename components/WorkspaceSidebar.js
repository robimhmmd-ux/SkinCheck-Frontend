// Sidebar workspace Laomera — dipakai SEMUA halaman aplikasi (dashboard,
// scan, diagnosis, riwayat, marketplace, asisten, profil), bukan hanya
// dashboard. Sebelumnya sidebar ini hidup di dalam halaman dashboard
// saja, sehingga begitu pengguna pindah ke /scan, sidebar ikut hilang
// dan navigasi mendadak berganti jadi topbar.
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
  PanelLeftClose,
  Sparkles,
  ShieldAlert,
  Users,
  Package,
  ScanSearch,
  BrainCircuit,
  TrendingUp,
  Settings,
  ScrollText,
  UserCog,
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

// Tautan admin: HANYA tampil kalau user.role === "admin".
const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard Admin", icon: ShieldAlert },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/scans", label: "Audit Scan", icon: ScanSearch },
  { href: "/admin/ai-copilot", label: "AI Copilot", icon: BrainCircuit },
  { href: "/admin/trends", label: "Tren Scan", icon: TrendingUp },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  { href: "/admin/logs", label: "Log Aktivitas", icon: ScrollText },
  { href: "/admin/profile", label: "Profil Admin", icon: UserCog },
];

export default function WorkspaceSidebar({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  // Di halaman admin, sidebar hanya menampilkan navigasi ADMIN — tombol
  // navigasi customer (WORKSPACE) dan kotak aksi "Mulai Scan" disembunyikan,
  // karena itu navigasi milik pengguna, bukan admin.
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

  // Di layar kecil sidebar tampil sebagai drawer: menutupnya setelah
  // memilih menu supaya halaman tujuan langsung terlihat.
  function handleNavClick(e, href) {
    if (href === "/assistant") {
      e.preventDefault();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-laomera-chat"));
        window.dispatchEvent(new CustomEvent("open-skincheck-chat"));
      }
    }
    try {
      if (window.innerWidth < 1024) onClose();
    } catch {
      // ignore
    }
  }

  return (
    <>
      {open && (
        <div
          className="dash-sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`dash-side-slide ${open ? "slide-in" : "slide-out"}`}>
        <div className="dash-side-slide-inner">
          <div className="side-slide-header">
            <Link href="/" className="side-slide-brand">
              <div className="brand-emblem-icon" aria-hidden="true">L</div>
              <span className="brand-title-text">Laomera</span>
            </Link>
            <button
              type="button"
              className="side-slide-close-trigger"
              onClick={onClose}
              title="Sembunyikan Navigasi (Hide)"
              aria-label="Sembunyikan Navigasi"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          <div className="side-slide-user-card">
            <div className="user-card-avatar" aria-hidden="true">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
            </div>
            <div className="user-card-meta">
              <strong className="user-card-name">{user?.name || "Pengguna Laomera"}</strong>
              <div className="user-status-pill">
                <span className="user-status-dot" />
                <span>{user?.email || "Sesi Masuk Aktif"}</span>
              </div>
            </div>
          </div>

          {!isAdminPage && (
            <nav className="side-slide-nav" aria-label="Navigasi Workspace">
              <span className="side-nav-heading">WORKSPACE</span>
              {SIDEBAR_LINKS.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`side-nav-link ${active ? "active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => handleNavClick(e, href)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="side-nav-text">{label}</span>
                    {active && <span className="side-nav-dot" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>
          )}

          {user?.role === "admin" && (
            <nav className="side-slide-nav" aria-label="Navigasi Admin">
              <span className="side-nav-heading">ADMIN</span>
              {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`side-nav-link ${active ? "active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => handleNavClick(e, href)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="side-nav-text">{label}</span>
                    {active && <span className="side-nav-dot" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>
          )}

          {!isAdminPage && (
            <div className="side-slide-action-box">
              <div className="action-box-head">
                <Sparkles size={14} color="var(--brand-amber)" />
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

          <div className="side-slide-footer">
            <Link href="/" className="side-slide-foot-link">
              <HomeIcon size={16} />
              <span>Ke Beranda</span>
            </Link>
            <button
              type="button"
              className="side-slide-logout-btn"
              onClick={() => setConfirmLogout(true)}
              disabled={logoutBusy}
            >
              <LogOut size={16} />
              <span>{logoutBusy ? "…" : "Keluar"}</span>
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
