"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, KeyRound, CheckCircle2, Send, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { requestFonnteOtp, verifyFonnteOtp } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import { useToast } from "../../components/Toast";
import AuthVisual from "../../components/AuthVisual";

export default function VerifyOtpPage() {
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const p = q.get("phone");
      if (p) {
        setPhone(p);
        if (q.get("sent") === "1") setSentTo(p);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onRequest(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await requestFonnteOtp(phone, name);
      setSentTo(res.phone_masked || phone);
      setCooldown(res.cooldown_seconds || 60);
      toast.success(`Kode OTP dikirimkan ke WhatsApp ${res.phone_masked || phone}.`);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyFonnteOtp(phone, code);
      setVerified(true);
      toast.success("Nomor WhatsApp terverifikasi dengan sukses.");
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
          title="Verifikasi keamanan akun." 
          text="Kode 6 digit dikirimkan langsung ke nomor WhatsApp kamu dan berlaku selama 10 menit." 
        />

        <div className="glass-panel auth-form-panel">
          <div className="auth-panel-header">
            <span className="badge badge-navy">VERIFIKASI OTP</span>
            <h1 className="auth-panel-title">Aktivasi Nomor WhatsApp</h1>
            <p className="auth-panel-subtitle">
              Satu langkah akhir untuk mengaktifkan akun dan melindungi privasi rekam medismu.
            </p>
          </div>

          <ErrorBox error={error} />

          {verified ? (
            <div className="auth-success-flow">
              <div className="badge badge-success" style={{ margin: "0 auto 12px" }}>
                <CheckCircle2 size={14} /> NOMOR TERVERIFIKASI
              </div>
              <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Akun Siap Digunakan!</h3>
              <p className="muted" style={{ fontSize: "14px" }}>
                Nomor WhatsApp <strong>{sentTo || phone}</strong> telah berhasil divalidasi. Silakan masuk untuk memulai sesi analisismu.
              </p>
              <div style={{ marginTop: "20px" }}>
                <Link href="/login" className="btn btn-primary" style={{ width: "100%" }}>
                  Masuk Sekarang <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="auth-form-stack">
              <form onSubmit={onRequest} className="otp-request-subform">
                <div className="form-group-field">
                  <label className="form-label" htmlFor="otp-phone">
                    <Phone size={14} /> Nomor WhatsApp Terdaftar
                  </label>
                  <input
                    id="otp-phone"
                    type="tel"
                    required
                    className="app-text-input"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-secondary btn-sm" 
                  style={{ width: "100%" }} 
                  disabled={busy || cooldown > 0}
                >
                  <Send size={14} />{" "}
                  {busy ? "Mengirim Permintaan…" : cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Kirim Kode OTP via WhatsApp"}
                </button>
              </form>

              {sentTo && (
                <form onSubmit={onVerify} className="otp-verify-subform" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed var(--border-medium)" }}>
                  <p className="muted" style={{ fontSize: "13px", marginBottom: "12px" }}>
                    Kode telah dikirim ke <strong>{sentTo}</strong>. Masukkan 6 digit di bawah:
                  </p>

                  <div className="form-group-field">
                    <label className="form-label" htmlFor="otp-code">
                      <KeyRound size={14} /> 6 Digit Kode OTP
                    </label>
                    <input
                      id="otp-code"
                      type="text"
                      required
                      className="app-text-input text-center font-mono"
                      placeholder="123456"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      style={{ letterSpacing: "6px", fontSize: "20px", fontWeight: "700" }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: "100%", marginTop: "10px" }} 
                    disabled={busy || code.length !== 6}
                  >
                    <CheckCircle2 size={16} /> {busy ? "Memvalidasi Kode…" : "Verifikasi & Aktifkan"}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="auth-links-footer">
            <p className="muted" style={{ margin: 0, fontSize: "13.5px" }}>
              Sudah aktif? <Link href="/login" style={{ fontWeight: 600 }}>Masuk</Link> · <Link href="/register">Daftar Akun Lain</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
