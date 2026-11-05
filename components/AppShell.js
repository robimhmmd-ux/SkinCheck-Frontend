// Kerangka aplikasi: satu navigasi yang sama di semua halaman workspace.
//
// Masalah yang diperbaiki: sidebar dulu hanya ada di halaman dashboard
// (SiteHeader mengembalikan null di /dashboard, dan sidebar dirender di
// dalam page dashboard). Begitu pengguna klik "Scan Kulit", halaman
// dashboard unmount, sidebar ikut hilang, dan navigasi mendadak berganti
// jadi topbar. Sekarang sidebar + stage topbar dirender di sini, di atas
// semua halaman workspace, sehingga navigasi tidak pernah berganti bentuk
// saat pindah halaman. Halaman landing dan auth tetap memakai topbar
// SiteHeader seperti sebelumnya.
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import SiteHeader from "./SiteHeader";
import WorkspaceSidebar from "./WorkspaceSidebar";
import { fmtDateShort } from "../lib/scores";

const WORKSPACE_PREFIXES = [
  "/dashboard",
  "/scan",
  "/output",
  "/history",
  "/marketplace",
  "/assistant",
  "/profile",
  "/admin",
];

const PAGE_LABELS = [
  ["/dashboard", "Dashboard"],
  ["/scan", "Scan Kulit"],
  ["/output", "Diagnosis Terkini"],
  ["/history", "Riwayat Scan"],
  ["/marketplace", "Marketplace"],
  ["/assistant", "Laomera Asisten"],
  ["/profile", "Profil Akun"],
  ["/admin/users", "Admin • Pengguna"],
  ["/admin/products", "Admin • Produk"],
  ["/admin/scans", "Admin • Audit Scan"],
  ["/admin/ai-copilot", "Admin • AI Copilot"],
  ["/admin/settings", "Admin • Pengaturan"],
  ["/admin/logs", "Admin • Log Aktivitas"],
  ["/admin/profile", "Admin • Profil"],
  ["/admin", "Admin • Dashboard"],
];

function pageLabel(pathname) {
  for (const [prefix, label] of PAGE_LABELS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return label;
  }
  return "Laomera";
}

function SiteFooter() {
  return (
    <footer className="site-footer-bar">
      <div className="content-canvas footer-inner">
        <p className="footer-brand-title">Laomera</p>
        <p className="footer-tagline">
          Sistem Evaluasi Kesehatan Kulit Wajah Berbasis Kecerdasan Buatan & Rekomendasi Formulasi Terkurasi.
        </p>
        <div className="footer-meta-row">
          <span>© 2026 Laomera Platform. Seluruh hak cipta dilindungi.</span>
        </div>
      </div>
    </footer>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("skincheck_sidebar_open");
      if (saved !== null) {
        setSidebarOpen(saved === "true");
      } else if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    } catch {
      // ignore
    }
  }, []);

  function toggleSidebar() {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("skincheck_sidebar_open", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const isWorkspace = WORKSPACE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isWorkspace) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="app-main-viewport">
          {children}
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <div className={`dash-workspace-layout ${sidebarOpen ? "sidebar-expanded" : "sidebar-hidden"}`}>
      <WorkspaceSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dash-main-canvas-area">
        <header className="dash-stage-topbar">
          <div className="dash-topbar-left">
            <button
              type="button"
              className="dash-slide-toggle-btn"
              onClick={toggleSidebar}
              title={sidebarOpen ? "Sembunyikan Navigasi" : "Buka Navigasi (Side Slide)"}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              <span className="dash-toggle-btn-label">
                {sidebarOpen ? "Sembunyikan" : "Buka Navigasi"}
              </span>
            </button>
            <span className="dash-breadcrumb-path">
              Laomera / <strong>{pageLabel(pathname)}</strong>
            </span>
          </div>

          <div className="dash-topbar-right">
            <span className="dash-date-pill">{fmtDateShort(new Date().toISOString())}</span>
            <Link href="/scan" className="btn btn-amber btn-sm">
              <Camera size={14} />
              <span>Scan Baru</span>
            </Link>
          </div>
        </header>

        <main id="main" className="app-main-viewport">
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
