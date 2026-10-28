"use client";
import { useState } from "react";
import Link from "next/link";
import { register } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null); setBusy(true);
    try { await register(name, email, password); setDone(true); }
    catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h1>Daftar</h1>
      {done ? (
        <div className="ok">Pendaftaran berhasil. Silakan <Link href="/login">masuk</Link>. Jika backend meminta verifikasi OTP, ikuti instruksi di email kamu — lihat <Link href="/verify-otp">halaman OTP</Link>.</div>
      ) : (
        <>
          <ErrorBox error={error} />
          <form onSubmit={onSubmit}>
            <label>Nama<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button className="btn" disabled={busy}>{busy ? "Memproses…" : "Daftar"}</button>
          </form>
        </>
      )}
      <p>Sudah punya akun? <Link href="/login">Masuk</Link></p>
    </div>
  );
}
