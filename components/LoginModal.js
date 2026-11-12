"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Mail, Lock, LogIn, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import { login, getMe, pickUser } from "../lib/api";
import { ErrorBox } from "./Notice";

export default function LoginModal({ open, onClose }) {
  const router = useRouter();
  const emailRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    setError(null);
    setBusy(true);
    try {
      const res = await login(email, password);
      const user = pickUser(res);
      let role = user && user.role;
      if (!role) {
        try { role = pickUser(await getMe()).role; } catch { /* tetap lanjut */ }
      }
      onClose();
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop-overlay" role="presentation" onClick={onClose}>
      <div 
        className="glass-panel modal-surface-card" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="login-modal-title" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button" 
          className="modal-close-icon-btn" 
          aria-label="Tutup jendela login" 
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="modal-header-block">
          <div className="modal-brand-badge">
            <Sparkles size={14} className="text-amber" />
            <span>PORTAL AUTENTIKASI</span>
          </div>
          <h2 id="login-modal-title" className="modal-title">Selamat Datang Kembali</h2>
          <p className="modal-subtitle">
            Masuk ke akun Laomera untuk mengakses riwayat analisis dan dossier kesehatan kulitmu.
          </p>
        </div>

        <ErrorBox error={error} />

        <form onSubmit={onSubmit} className="modal-form-stack">
          <div className="form-group-field">
            <label className="form-label" htmlFor="modal-email">
              <Mail size={14} /> Alamat Email
            </label>
            <input
              id="modal-email"
              ref={emailRef}
              type="email"
              required
              className="app-text-input"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group-field">
            <label className="form-label" htmlFor="modal-password">
              <Lock size={14} /> Kata Sandi
            </label>
            <div className="password-field">
              <input
                id="modal-password"
                type={showPassword ? "text" : "password"}
                required
                className="app-text-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={busy}>
            <LogIn size={16} /> {busy ? "Memverifikasi Kredensial…" : "Masuk ke Akun"}
          </button>
        </form>

        <div className="modal-footer-nav">
          <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
            Belum memiliki akun?{" "}
            <Link href="/register" onClick={onClose} style={{ fontWeight: 600, color: "var(--brand-navy)" }}>
              Daftar Baru <ArrowRight size={12} style={{ display: "inline" }} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
