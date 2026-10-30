"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, getMe, pickUser } from "../lib/api";
import { ErrorBox } from "./Notice";

export default function LoginModal({ open, onClose }) {
  const router = useRouter();
  const emailRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    emailRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const res = await login(email, password);
      const user = pickUser(res);
      let role = user && user.role;
      if (!role) {
        try { role = pickUser(await getMe()).role; } catch { /* tetap lanjut ke dashboard */ }
      }
      onClose();
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Tutup login" onClick={onClose}>×</button>
        <h2 id="login-modal-title">Selamat datang kembali</h2>
        <p className="muted">Masuk dengan akun SkinCheck kamu untuk melihat dashboard dan riwayat scan.</p>
        <ErrorBox error={error} />
        <form onSubmit={onSubmit}>
          <label>Email<input ref={emailRef} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          <button className="btn" disabled={busy}>{busy ? "Memproses…" : "Masuk"}</button>
        </form>
        <p>Belum punya akun? <Link href="/register" onClick={onClose}>Daftar</Link> · <Link href="/login" onClick={onClose}>Buka halaman login penuh</Link></p>
      </div>
    </div>
  );
}
