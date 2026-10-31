"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LoginModal from "./LoginModal";
import { getMe, logout, pickUser } from "../lib/api";
import { useToast } from "./Toast";

// Header sadar sesi — ini yang selama ini bikin logout "tidak ada":
// sebelumnya header selalu menampilkan tombol Masuk, bahkan saat user
// sudah login, dan satu-satunya tombol Keluar tersembunyi di panel
// Setting Akun. Sekarang header mengecek /api/v2/me setiap pindah
// halaman: kalau ada sesi, tampilkan Keluar; kalau tidak, Masuk.
// Keluar memanggil POST /api/v2/auth/logout (backend menghapus sesi),
// lalu mengarahkan ke halaman login.
export default function SiteHeader() {
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

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">SkinCheck</Link>
        <nav className="nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/scan">Scan</Link>
          <Link href="/output">Output</Link>
          <Link href="/history">Riwayat</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/assistant">Asisten</Link>
          <Link href="/profile">Profil</Link>
          {loggedIn ? (
            <button type="button" className="btn-login-transparent" onClick={onLogout} disabled={busy}>
              {busy ? "Keluar…" : "Keluar"}
            </button>
          ) : (
            <button type="button" className="btn-login-transparent" onClick={() => setLoginOpen(true)}>Masuk</button>
          )}
        </nav>
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
