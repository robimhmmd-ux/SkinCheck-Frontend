// Kerangka aplikasi: satu navigasi yang sama di semua halaman workspace.
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera } from "lucide-react";
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
  ["/output", "Riwayat & Diagnosis"],
  ["/history", "Riwayat & Diagnosis"],
  ["/marketplace", "Marketplace"],
  ["/assistant", "Laomera Asisten"],
  ["/profile", "Profil Akun"],
  ["/admin/users", "Admin • Pengguna"],
  ["/admin/products", "Admin • Produk"],
  ["/admin/scans", "Admin • Audit Scan"],
  ["/admin/ai-copilot", "Admin • AI Copilot"],
  ["/admin/trends", "Admin • Tren Scan"],
  ["/admin/settings", "Admin • Konfigurasi"],
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("laomera_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      } else if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("laomera_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const isWorkspace = WORKSPACE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

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
    <div className={`dash-workspace-layout ${sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
      <WorkspaceSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div className="dash-main-canvas-area">
        <header className="dash-stage-topbar">
          <div className="dash-topbar-left">
            <span className="dash-breadcrumb-path">
              Laomera / <strong>{pageLabel(pathname)}</strong>
            </span>
          </div>

          <div className="dash-topbar-right">
            <span className="dash-date-pill">{fmtDateShort(new Date().toISOString())}</span>
            {!isAdminPage && (
              <Link href="/scan" className="btn btn-amber btn-sm">
                <Camera size={14} />
                <span>Scan Baru</span>
              </Link>
            )}
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
