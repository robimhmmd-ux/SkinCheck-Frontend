"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LoginModal from "./LoginModal";
import { getMe, logout, pickUser } from "../lib/api";
import { useToast } from "./Toast";

// Header sadar sesi: mengecek /api/v2/me setiap pindah halaman; kalau ada
// sesi tampilkan Keluar, kalau tidak tampilkan Masuk. Keluar memanggil
// POST /api/v2/auth/logout lalu mengarahkan ke halaman login.
// Dua wujud: "top" (pill lama, hanya dipakai landing agar landing tidak
// bergeser) dan "side" (sidebar navigasi untuk semua halaman aplikasi).
export default function SiteHeader({ variant = "side" }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    let alive = true;
    getMe()
      .then((d) => { if (alive) setLoggedIn(Boolean(pickUser(d))); })
      .catch(() => { if (alive) setLoggedIn(false); });
    return () => { alive = false; };
  }, [pathname]);

  async function onLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      setLoggedIn(false);
      toast.success("Berhasil keluar.");
      router.push("/login");
      router.refresh();
    } catch (e) {
      // Sesi backend mungkin sudah habis — tetap anggap keluar di sisi
      // browser supaya user tidak terjebak di akun lama.
      setLoggedIn(false);
      toast.success("Berhasil keluar.");
      router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  const navItems = [
    ["/dashboard", "Dashboard"],
    ["/scan", "Scan"],
    ["/output", "Output"],
    ["/history", "Riwayat"],
    ["/marketplace", "Marketplace"],
    ["/assistant", "Asisten"],
    ["/profile", "Profil"],
  ];

  const authButton = loggedIn ? (
    <button type="button" className="btn secondary" onClick={onLogout} disabled={busy}>
      {busy ? "Keluar…" : "Keluar"}
    </button>
  ) : (
    <button type="button" className="btn secondary" onClick={() => setLoginOpen(true)}>Masuk</button>
  );

  return (
    <>
      {variant === "top" ? (
        <header className="topbar">
          <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">S</span>SkinCheck</Link>
          <nav className="nav">
            {navItems.map(([href, label]) => (
              <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
            ))}
            {loggedIn ? (
              <button type="button" className="btn ghost sm" onClick={onLogout} disabled={busy}>
                {busy ? "Keluar…" : "Keluar"}
              </button>
            ) : (
              <button type="button" className="btn ghost sm" onClick={() => setLoginOpen(true)}>Masuk</button>
            )}
          </nav>
        </header>
      ) : (
        <aside className="side">
          <Link className="side-brand" href="/">
            <span className="side-mark" aria-hidden="true">S</span>
            <span><strong>SkinCheck</strong><small>Perawatan kulit wajah</small></span>
          </Link>
          <nav className="side-nav" aria-label="Navigasi utama">
            {navItems.map(([href, label]) => (
              <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
            ))}
          </nav>
          <div className="side-foot">{authButton}</div>
        </aside>
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
