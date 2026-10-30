"use client";
import { useState } from "react";
import Link from "next/link";
import LoginModal from "./LoginModal";

export default function SiteHeader() {
  const [loginOpen, setLoginOpen] = useState(false);
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">SkinCheck</Link>
        <nav className="nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/scan">Scan</Link>
          <Link href="/history">Riwayat</Link>
          <Link href="/assistant">Asisten</Link>
          <Link href="/profile">Profil</Link>
          <button type="button" className="btn-login-transparent" onClick={() => setLoginOpen(true)}>Masuk</button>
        </nav>
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
