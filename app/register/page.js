"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register, requestFonnteOtp } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";

// Pendaftaran memakai nomor WhatsApp, karena OTP dikirim lewat
// WhatsApp (Fonnte) ke nomor itu, dan akun BARU TIDAK AKTIF sebelum
// OTP terverifikasi: backend membuat akun status pending tanpa sesi,
// login ditolak sampai /verify-otp mengaktifkannya. Nomor disimpan
// backend di profile_data user. Setelah daftar berhasil, halaman ini
// langsung mencoba mengirim OTP sekali; kalau berhasil, user diarahkan
// ke /verify-otp dengan kolom kode sudah terbuka; kalau gagal (mis.
// token Fonnte belum diisi), kegagalan itu ditampilkan jujur beserta
// tautan untuk mencoba kirim ulang manual dari halaman verifikasi.
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [otpError, setOtpError] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null); setOtpError(null); setBusy(true);
    try {
      await register(name, email, password, phone);
      try {
        await requestFonnteOtp(phone, name);
        router.push(`/verify-otp?phone=${encodeURIComponent(phone)}&sent=1`);
      } catch (otpErr) {
        // Akun sudah pending; OTP gagal terkirim bukan berarti daftar
        // gagal — user tetap bisa kirim ulang dari halaman verifikasi.
        setOtpError(otpErr);
        setDone(true);
      }
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h1>Daftar</h1>
      {done ? (
        <>
          <div className="ok">
            Pendaftaran berhasil, tapi akun belum aktif. Verifikasi kode OTP WhatsApp dulu
            sebelum bisa masuk.
          </div>
          {otpError && <ErrorBox error={otpError} />}
          <p>
            <Link href={`/verify-otp?phone=${encodeURIComponent(phone)}`}>Buka verifikasi OTP</Link>{" "}
            dan kirim kode ke nomor WhatsApp kamu.
          </p>
        </>
      ) : (
        <>
          <ErrorBox error={error} />
          {error && phone && (
            <p className="muted">
              Kalau email ini sudah terdaftar tapi belum terverifikasi,{" "}
              <Link href={`/verify-otp?phone=${encodeURIComponent(phone)}`}>verifikasi OTP di sini</Link>.
            </p>
          )}
          <form onSubmit={onSubmit}>
            <label>Nama<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label>Nomor WhatsApp<input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" inputMode="tel" /></label>
            <p className="muted" style={{ marginTop: -6 }}>Kode OTP akan dikirim lewat WhatsApp ke nomor ini, dan akun baru aktif setelah kode itu terverifikasi.</p>
            <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button className="btn" disabled={busy}>{busy ? "Memproses…" : "Daftar"}</button>
          </form>
        </>
      )}
      <p>Sudah punya akun? <Link href="/login">Masuk</Link></p>
    </div>
  );
}
