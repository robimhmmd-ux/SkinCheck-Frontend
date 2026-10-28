"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiHealth, isBackendNotConfigured } from "../lib/api";

export default function Home() {
  const [status, setStatus] = useState("checking");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let alive = true;
    apiHealth()
      .then((d) => { if (alive) { setStatus("online"); setDetail(d); } })
      .catch((e) => { if (alive) { setStatus(isBackendNotConfigured(e) ? "not-configured" : "error"); setDetail(e.message); } });
    return () => { alive = false; };
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Kenali kondisi kulit wajahmu, dengan SkinCheck.</h1>
        <p className="lead">Upload foto wajah, dapatkan analisis kondisi kulit, dan rekomendasi perawatan yang sesuai.</p>
        <p>
          <Link className="btn" href="/login">Masuk</Link>{" "}
          <Link className="btn secondary" href="/register">Daftar</Link>{" "}
          <Link className="btn secondary" href="/scan">Mulai Scan</Link>
        </p>
      </section>

      <div className="card">
        <h2>Status backend</h2>
        {status === "checking" && <p className="muted">Memeriksa backend…</p>}
        {status === "online" && <p className="ok">Backend terhubung. {detail ? JSON.stringify(detail).slice(0, 200) : ""}</p>}
        {status === "not-configured" && (
          <div className="notice"><strong>Backend belum dikonfigurasi.</strong> Isi <code>NEXT_PUBLIC_API_URL</code> di <code>.env.local</code> atau Environment Variables Vercel dengan URL backend Python kamu. Halaman ini tetap bisa dibuka tanpa backend.</div>
        )}
        {status === "error" && <div className="error">Backend tidak dapat dihubungi: {String(detail)}</div>}
      </div>

      <div className="grid">
        <div className="card"><h3>5 kondisi kulit</h3><p className="muted">Jerawat, kering, berminyak, dark spots, dan kerutan — dari satu foto wajah.</p></div>
        <div className="card"><h3>Rekomendasi produk</h3><p className="muted">Produk yang sesuai dengan kondisi kulitmu, dari katalog SkinCheck.</p></div>
        <div className="card"><h3>Riwayat scan</h3><p className="muted">Lihat perkembangan kulitmu dari scan-scan sebelumnya.</p></div>
        <div className="card"><h3>Asisten AI</h3><p className="muted">Tanya seputar perawatan kulit — membutuhkan backend dan kunci Gemini.</p></div>
      </div>
    </>
  );
}
