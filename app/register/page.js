"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock, UserPlus, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { register, requestFonnteOtp } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import WorkspaceLoadingScreen from "../../components/WorkspaceLoadingScreen";
import AuthVisual from "../../components/AuthVisual";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [otpError, setOtpError] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setOtpError(null);
    setBusy(true);
    try {
      await register(name, email, password, phone);
      try {
        await requestFonnteOtp(phone, name);
        router.push(`/verify-otp?phone=${encodeURIComponent(phone)}&sent=1`);
      } catch (otpErr) {
        setOtpError(otpErr);
        setDone(true);
      }
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
          title="Mulai perjalanan kulit sehatmu." 
          text="Registrasi akun, aktivasi nomor WhatsApp dengan OTP terenkripsi, lalu nikmati pemindaian wajah instan." 
        />

        <div className="glass-panel auth-form-panel">
          <div className="auth-panel-header">
            <span className="badge badge-amber">REGISTRASI</span>
            <h1 className="auth-panel-title">Buat Akun Baru</h1>
            <p className="auth-panel-subtitle">Bergabung untuk mendapatkan analisa kulit berbasis klinis.</p>
          </div>

          {done ? (
            <div className="auth-success-flow">
              <div className="badge badge-success" style={{ margin: "0 auto 12px" }}>
                <CheckCircle2 size={14} /> AKUN TERDAFTAR
              </div>
              <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Tinggal Selangkah Lagi</h3>
              <p className="muted" style={{ fontSize: "14px" }}>
                Pendaftaran berhasil dibuat. Mohon lakukan verifikasi kode OTP yang dikirimkan ke WhatsApp kamu agar akun aktif.
              </p>
              {otpError && <ErrorBox error={otpError} />}
              <div style={{ marginTop: "20px" }}>
                <Link href={`/verify-otp?phone=${encodeURIComponent(phone)}`} className="btn btn-primary" style={{ width: "100%" }}>
                  Lanjut ke Verifikasi OTP <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <ErrorBox error={error} />
              {error && phone && (
                <p className="muted" style={{ fontSize: "13px", marginBottom: "16px" }}>
                  Jika nomor ini telah terdaftar namun belum aktif,{" "}
                  <Link href={`/verify-otp?phone=${encodeURIComponent(phone)}`} style={{ fontWeight: 600 }}>
                    verifikasi OTP di sini
                  </Link>.
                </p>
              )}

              <form onSubmit={onSubmit} className="auth-form-stack">
                <div className="form-group-field">
                  <label className="form-label" htmlFor="reg-name">
                    <User size={14} /> Nama Lengkap
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    className="app-text-input"
                    placeholder="Contoh: Sarah Anindya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label className="form-label" htmlFor="reg-email">
                    <Mail size={14} /> Alamat Email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    className="app-text-input"
                    placeholder="sarah@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="form-group-field">
                  <label className="form-label" htmlFor="reg-phone">
                    <Phone size={14} /> Nomor WhatsApp
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    required
                    className="app-text-input"
                    placeholder="081234567890"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <span className="field-hint-text">Kode OTP verifikasi akan dikirimkan ke nomor WhatsApp ini.</span>
                </div>

                <div className="form-group-field">
                  <label className="form-label" htmlFor="reg-password">
                    <Lock size={14} /> Kata Sandi
                  </label>
                  <div className="password-field">
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="app-text-input"
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
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

                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }} disabled={busy}>
                  <UserPlus size={16} /> {busy ? "Memproses Registrasi…" : "Daftar Akun"}
                </button>
              </form>
            </>
          )}

          <div className="auth-links-footer">
            <p className="muted" style={{ margin: 0, fontSize: "13.5px" }}>
              Sudah memiliki akun? <Link href="/login" style={{ fontWeight: 600 }}>Masuk di sini</Link>
            </p>
          </div>
        </div>
      </div>

      <WorkspaceLoadingScreen
        active={busy}
        caption="Memproses Pendaftaran…"
        variant="overlay"
        skeleton={false}
      />
    </div>
  );
}
