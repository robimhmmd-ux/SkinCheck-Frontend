"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, getMe, pickUser } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

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
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return (
    <div className="ed-page">
      <div className="ed-auth">
        <span className="brand-mark" aria-hidden="true">S</span>
        <h1>Masuk</h1>
        <p className="muted">Masuk dengan akun SkinCheck kamu.</p>
        <ErrorBox error={error} />
        <form onSubmit={onSubmit}>
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="btn" disabled={busy}>{busy ? "Memproses…" : "Masuk"}</button>
        </form>
        <p className="ed-auth-foot">Belum punya akun? <Link href="/register">Daftar</Link></p>
        <p className="ed-auth-foot">Perlu verifikasi OTP? <Link href="/verify-otp">Lihat info OTP</Link></p>
      </div>
    </div>
  );
}
