"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck } from "lucide-react";
import { login, getMe, pickUser } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import WorkspaceLoadingScreen from "../../components/WorkspaceLoadingScreen";
import { useToast } from "../../components/Toast";
import AuthVisual from "../../components/AuthVisual";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await login(email, password);
      const user = pickUser(res);
      let role = user && user.role;
      if (!role) {
        try { role = pickUser(await getMe()).role; } catch {}
      }
      toast.success("Anda berhasil login.", "Selamat datang");
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell-wrap">
      <div className="auth-split-layout">
        <AuthVisual 
          title="Selamat datang kembali." 
          text="Lanjutkan pemantauan kesehatan kulit, tinjau skor VGG, dan akses riwayat pemindaianmu." 
        />
        
        <div className="glass-panel auth-form-panel">
          <div className="auth-panel-header">
            <span className="badge badge-navy">MASUK</span>
            <h1 className="auth-panel-title">Masuk ke Akun</h1>
            <p className="auth-panel-subtitle">Gunakan email terdaftar untuk membuka sesi Laomera.</p>
          </div>

          <ErrorBox error={error} />

          <form onSubmit={onSubmit} className="auth-form-stack">
            <div className="form-group-field">
              <label className="form-label" htmlFor="login-email">
                <Mail size={14} /> Alamat Email
              </label>
              <input
                id="login-email"
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
              <label className="form-label" htmlFor="login-password">
                <Lock size={14} /> Kata Sandi
              </label>
              <input
                id="login-password"
                type="password"
                required
                className="app-text-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }} disabled={busy}>
              <LogIn size={16} /> {busy ? "Memverifikasi Akun…" : "Masuk"}
            </button>
          </form>

          <div className="auth-links-footer">
            <p className="muted" style={{ margin: "0 0 8px", fontSize: "13.5px" }}>
              Belum memiliki akun? <Link href="/register" style={{ fontWeight: 600 }}>Daftar sekarang</Link>
            </p>
            <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
              Menunggu aktivasi? <Link href="/verify-otp">Verifikasi kode OTP WhatsApp</Link>
            </p>
          </div>
        </div>
      </div>

      <WorkspaceLoadingScreen
        active={busy}
        caption="Memverifikasi Akun…"
        variant="overlay"
        skeleton={false}
      />
    </div>
  );
}
