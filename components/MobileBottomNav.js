// Navigasi bawah HP: bar pill navy dengan tab aktif berupa lingkaran
// kuning yang menonjol ke atas, dikelilingi lekukan (scoop) di tepi atas
// bar — lekukan & lingkarannya mengikuti tab yang aktif. Hanya tampil di
// HP (≤767px, diatur CSS); di desktop/tablet sidebar yang dipakai.
// Warna mengikuti project: navy #071236, kuning #FFC20D, ikon putih.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Camera,
  History,
  ShoppingBag,
  User,
  ShieldAlert,
  Users,
  Package,
  ScanSearch,
  Settings,
} from "lucide-react";
import { getMe, pickUser } from "../lib/api";

// 5 halaman utama (Asisten tidak ikut: ia membuka chat overlay, bukan
// halaman — tetap bisa dijangkau lewat tombol chat mengambang).
const BOTTOM_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan Kulit", icon: Camera },
  { href: "/history", label: "Riwayat & Diagnosis", icon: History },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/profile", label: "Profil Akun", icon: User },
];

const ADMIN_BOTTOM_LINKS = [
  { href: "/admin", label: "Dashboard Admin", icon: ShieldAlert },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/scans", label: "Audit Scan", icon: ScanSearch },
  { href: "/admin/settings", label: "Konfigurasi", icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

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

  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const links =
    isAdminRoute || user?.role === "admin"
      ? ADMIN_BOTTOM_LINKS
      : BOTTOM_LINKS;

  // Indeks rute aktif — aturan samanya dengan sidebar.
  const activeIndex = links.findIndex(({ href }) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  });

  const isUnverified =
    user?.role === "customer" && user?.status && user.status !== "active";
  const hasActive = activeIndex >= 0;
  const active = hasActive ? links[activeIndex] : null;
  // Posisi tengah tab aktif (5 tab sama lebar): 10% / 30% / 50% / 70% / 90%.
  const scoopX = hasActive
    ? `${(activeIndex + 0.5) * (100 / links.length)}%`
    : "10%";
  const ActiveIcon = active ? active.icon : null;

  function handleNavClick(e, href, label) {
    // Akun belum terverifikasi tidak boleh pindah halaman (sama seperti sidebar).
    if (isUnverified) {
      e.preventDefault();
      return;
    }
    if (typeof window !== "undefined" && href !== pathname) {
      window.dispatchEvent(
        new CustomEvent("laomera-nav-start", { detail: { href, label } })
      );
    }
  }

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Navigasi bawah"
      style={{ "--scoop-x": scoopX }}
    >
      <div className={`mobile-bottom-bar${hasActive ? " has-scoop" : ""}`}>
        {links.map(({ href, label, icon: Icon }, idx) => (
          <Link
            key={href}
            href={href}
            className={`mobile-bottom-tab${idx === activeIndex ? " is-active" : ""}`}
            aria-label={label}
            aria-current={idx === activeIndex ? "page" : undefined}
            onClick={(e) => handleNavClick(e, href, label)}
          >
            <Icon size={22} aria-hidden="true" />
          </Link>
        ))}
      </div>
      {hasActive && ActiveIcon && (
        <Link
          href={active.href}
          className="mobile-bottom-raised"
          aria-label={active.label}
          onClick={(e) => handleNavClick(e, active.href, active.label)}
        >
          <ActiveIcon size={24} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
