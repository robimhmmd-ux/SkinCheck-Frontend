"use client";
import { useState } from "react";
import Link from "next/link";
import { register } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";

// Pendaftaran memakai nomor WhatsApp, karena OTP dikirim lewat
// WhatsApp (Fonnte) ke nomor itu. Nomor disimpan backend di
// profile_data user, dan setelah daftar berhasil user diarahkan ke
// /verify-otp dengan nomornya sudah terisi — tinggal klik kirim kode.
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null); setBusy(true);
    try { await register(name, email, password, phone); setDone(true); }
    catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h1>Daftar</h1>
      {done ? (
        <div className="ok">
          Pendaftaran berhasil. Sekarang verifikasi nomor WhatsApp kamu:{" "}
          <Link href={`/verify-otp?phone=${encodeURIComponent(phone)}`}>buka verifikasi OTP</Link>{" "}
          dan kirim kode ke nomor ini. Kalau sudah punya akun, <Link href="/login">masuk</Link>.
        </div>
      ) : (
        <>
          <ErrorBox error={error} />
          <form onSubmit={onSubmit}>
            <label>Nama<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>Nomor WhatsApp<input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" inputMode="tel" /></label>
            <p className="muted" style={{ marginTop: -6 }}>Kode OTP akan dikirim lewat WhatsApp ke nomor ini.</p>
            <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button className="btn" disabled={busy}>{busy ? "Memproses…" : "Daftar"}</button>
          </form>
        </>
      )}
      <p>Sudah punya akun? <Link href="/login">Masuk</Link></p>
    </div>
  );
}
