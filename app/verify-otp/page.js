"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { requestFonnteOtp, verifyFonnteOtp } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import { useToast } from "../../components/Toast";

// Verifikasi OTP via WhatsApp (Fonnte), endpoint /api/v2/auth/otp/*.
// Alur: isi nomor WhatsApp -> kirim kode -> masukkan 6 digit yang
// diterima di WhatsApp -> verifikasi. Kode tidak pernah ditampilkan
// di halaman ini dan tidak pernah dikembalikan backend lewat respons.
// Token Fonnte diisi pemilik backend sendiri (env FONNTE_TOKEN /
// system_settings WA_API_TOKEN); kalau belum diisi, backend menjawab
// 503 dan halaman menampilkan instruksinya, bukan klaim "terkirim".
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
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onRequest(e) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const res = await requestFonnteOtp(phone, name);
      setSentTo(res.phone_masked || phone);
      setCooldown(res.cooldown_seconds || 60);
      toast.success(`Kode OTP dikirim via WhatsApp ke ${res.phone_masked || phone}. Berlaku 10 menit.`);
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  async function onVerify(e) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      await verifyFonnteOtp(phone, code);
      setVerified(true);
      toast.success("Nomor WhatsApp terverifikasi.");
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h1>Verifikasi OTP WhatsApp</h1>
      <p className="muted">
        Kode 6 digit dikirim lewat WhatsApp (Fonnte) ke nomor kamu. Kode berlaku 10 menit
        dan hanya bisa dipakai sekali. Jangan bagikan kode itu ke siapa pun.
      </p>
      <ErrorBox error={error} />
      {verified ? (
        <div className="ok">
          Nomor {sentTo || phone} terverifikasi. Silakan <Link href="/login">masuk</Link>
          {` atau `}<Link href="/register">daftar</Link> untuk melanjutkan.
        </div>
      ) : (
        <>
          <form onSubmit={onRequest}>
            <label>Nama (opsional)<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" /></label>
            <label>Nomor WhatsApp<input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" inputMode="tel" /></label>
            <button className="btn" disabled={busy || cooldown > 0}>
              {busy ? "Mengirim…" : cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : "Kirim kode via WhatsApp"}
            </button>
          </form>
          {sentTo && (
            <form onSubmit={onVerify} style={{ marginTop: 20 }}>
              <p className="muted">Kode dikirim ke {sentTo}. Masukkan 6 digit dari WhatsApp di bawah ini.</p>
              <label>Kode OTP<input required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" inputMode="numeric" /></label>
              <button className="btn" disabled={busy || code.length !== 6}>{busy ? "Memeriksa…" : "Verifikasi kode"}</button>
            </form>
          )}
        </>
      )}
      <p><Link href="/login">Kembali ke login</Link></p>
    </div>
  );
}
