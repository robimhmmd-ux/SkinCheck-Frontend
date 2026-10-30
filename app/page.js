"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiHealth, isBackendNotConfigured } from "../lib/api";

const orbitFeatures = [
  { title: "Analisis AI 5 kondisi", text: "Jerawat, kering, berminyak, dark spots, dan kerutan dari satu foto." },
  { title: "Rutin harian personal", text: "Rekomendasi yang menyesuaikan kondisi kulitmu, bukan sekadar tren." },
  { title: "Kecantikan + teknologi", text: "Desain yang tenang, analisis yang terukur, hasil yang bisa ditelusuri." },
  { title: "Aman dan mudah", text: "Satu foto, tanpa antre. Riwayatmu tersimpan untuk melihat perubahan." },
];

const conditions = [
  { name: "Jerawat", note: "Acne" },
  { name: "Kulit kering", note: "Dry" },
  { name: "Kulit berminyak", note: "Oily" },
  { name: "Dark spots", note: "Noda gelap" },
  { name: "Kerutan", note: "Wrinkles" },
];

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
    <div className="landing">
      <section className="landing-hero">
        <p className="landing-kicker">SkinCheck</p>
        <h1>The Future of Skin Health is Automated</h1>
        <p className="landing-lead">Upload satu foto wajah, SkinCheck menganalisis kondisi kulitmu dan memberi rekomendasi perawatan yang sesuai denganmu.</p>
        <p className="landing-actions">
          <Link className="btn" href="/scan">Mulai Scan</Link>{" "}
          <Link className="btn secondary" href="/register">Daftar gratis</Link>
        </p>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-oval" />
          <svg className="hero-face" viewBox="0 0 320 400" role="img" aria-label="">
            <ellipse cx="160" cy="155" rx="108" ry="105" fill="#1c2438" />
            <ellipse cx="160" cy="210" rx="92" ry="125" fill="#f8e3da" />
            <path d="M108 208 Q130 196 152 208" fill="none" stroke="#8a5a4a" strokeWidth="3" strokeLinecap="round" />
            <path d="M168 208 Q190 196 212 208" fill="none" stroke="#8a5a4a" strokeWidth="3" strokeLinecap="round" />
            <path d="M138 258 Q160 270 182 258" fill="none" stroke="#d9a08e" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="120" cy="282" rx="22" ry="12" fill="#f2b8a6" opacity="0.7" />
            <ellipse cx="200" cy="282" rx="22" ry="12" fill="#f2b8a6" opacity="0.7" />
          </svg>
          <div className="orbit orbit-1"><strong>Analisis AI</strong><span>5 kondisi kulit</span></div>
          <div className="orbit orbit-2"><strong>Rutin personal</strong><span>sesuai kulitmu</span></div>
          <div className="orbit orbit-3"><strong>Kecantikan + teknologi</strong><span>terukur dan tenang</span></div>
          <div className="orbit orbit-4"><strong>Aman dan mudah</strong><span>satu foto saja</span></div>
        </div>
      </section>

      <section className="landing-features">
        <h2>Kenapa SkinCheck terasa berbeda</h2>
        <div className="feature-list">
          {orbitFeatures.map((f) => (
            <div key={f.title} className="feature-item">
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-vision">
        <h2>Lima kondisi yang kami kenali</h2>
        <p className="muted">Bukan sekadar label. Setiap kondisi mengarah ke rekomendasi produk dan langkah perawatan yang berbeda.</p>
        <div className="vision-cards">
          {conditions.map((c, i) => (
            <article key={c.name} className={`vision-card tilt-${i % 3}`}>
              <span className="vision-note">{c.note}</span>
              <h3>{c.name}</h3>
            </article>
          ))}
        </div>
        <p className="landing-actions">
          <Link className="btn" href="/scan">Coba scan sekarang</Link>
        </p>
      </section>

      <section className="landing-status" aria-label="Status backend">
        <h2>Status backend</h2>
        {status === "checking" && <p className="muted">Memeriksa backend…</p>}
        {status === "online" && <p className="ok">Backend terhubung. {detail ? JSON.stringify(detail).slice(0, 200) : ""}</p>}
        {status === "not-configured" && (
          <div className="notice"><strong>Backend belum dikonfigurasi.</strong> Isi <code>NEXT_PUBLIC_API_URL</code> di <code>.env.local</code> atau Environment Variables Vercel dengan URL backend Python kamu. Halaman ini tetap bisa dibuka tanpa backend.</div>
        )}
        {status === "error" && <div className="error">Backend tidak dapat dihubungi: {String(detail)}</div>}
      </section>
    </div>
  );
}
