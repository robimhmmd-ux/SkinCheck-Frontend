"use client";
import { useState } from "react";
import Link from "next/link";
import { isBackendConfigured } from "../../lib/api";

// PENTING: Kontrak /api/v2 yang direncanakan (health, auth/login, auth/register,
// auth/logout, me, dashboard, history, scan/upload, products, admin/summary)
// TIDAK memuat endpoint JSON verifikasi OTP. Halaman ini sengaja TIDAK
// memanggil endpoint OTP hasil karangan — formulir di bawah hanya placeholder
// penjelasan, dan alur OTP tetap lewat email/backend yang sudah ada.
// TODO: tambahkan pemanggilan endpoint OTP di sini HANYA setelah backend
// Python benar-benar mengekspos endpoint OTP di /api/v2 (nama + payload
// harus dicocokkan dengan kontrak backend, bukan ditebak).
export default function VerifyOtpPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    if (!isBackendConfigured()) {
      setNote("Backend belum dikonfigurasi, jadi kode OTP tidak bisa diverifikasi dari halaman ini. Isi NEXT_PUBLIC_API_URL dulu, atau ikuti tautan verifikasi di email kamu.");
      return;
    }
    setNote("Endpoint verifikasi OTP belum ada di kontrak /api/v2 yang direncanakan, jadi halaman ini tidak mengirim kode ke endpoint tebakan. Ikuti tautan/instruksi verifikasi yang dikirim backend lewat email, lalu masuk lewat halaman login. Jika backend nanti menambahkan endpoint OTP, hubungkan formulir ini ke endpoint tersebut.");
  }

  return (
    <div className="card">
      <h1>Verifikasi OTP</h1>
      <p className="muted">
        Untuk saat ini, verifikasi OTP masih lewat alur email/backend yang sudah ada:
        setelah daftar, cek email kamu dan ikuti instruksi verifikasi di sana.
        Setelah akun terverifikasi, kamu bisa <Link href="/login">masuk</Link>.
      </p>
      <form onSubmit={onSubmit}>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Kode OTP<input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 digit dari email" /></label>
        <button className="btn">Periksa (placeholder)</button>
      </form>
      {note && <div className="notice">{note}</div>}
      <p><Link href="/login">Kembali ke login</Link></p>
    </div>
  );
}
