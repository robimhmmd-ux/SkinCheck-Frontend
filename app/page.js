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

// Label orbit mengikuti referensi: judul uppercase kecil + subteks pendek.
const orbitLabels = [
  { title: "FULL-STACK INNOVATION", text: "AI + foto wajah" },
  { title: "DAILY RITUAL REIMAGINED", text: "Hemat waktu, hasil level pro" },
  { title: "BEAUTY + TECH", text: "Desain premium, personalisasi penuh" },
  { title: "SAFE & EFFORTLESS", text: "Dibuat untuk wajah, dengan hati-hati" },
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
        <h1>The Future of Skin Health is Automated</h1>
        <p className="landing-actions">
          <Link className="hero-pill" href="/scan">Mulai scan gratis <span aria-hidden="true">→</span></Link>
        </p>
        <p className="landing-lead">Upload satu foto wajah, SkinCheck menganalisis kondisi kulitmu dan memberi rekomendasi perawatan yang sesuai denganmu.</p>

        <div className="hero-visual">
          <div className="hero-oval" aria-hidden="true" />
          <img className="hero-face-img" src="/hero-face.png" alt="Wajah dengan mata tertutup, kulit bercahaya lembut" />
          {orbitLabels.map((o, i) => (
            <div key={o.title} className={`orbit orbit-${i + 1}`}><span className="orbit-dot" aria-hidden="true">✦</span><strong>{o.title}</strong><span>{o.text}</span></div>
          ))}
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
        <p className="vision-pill">OUR VISION</p>
        <h2>Lima kondisi yang kami kenali</h2>
        <p className="muted">Bukan sekadar label. Setiap kondisi mengarah ke rekomendasi produk dan langkah perawatan yang berbeda.</p>
        <div className="vision-cards vision-arc">
          {conditions.map((c, i) => (
            <article key={c.name} className={`vision-card arc-${i}`}>
              <span className="vision-note">{c.note}</span>
              <h3>{c.name}</h3>
            </article>
          ))}
        </div>
        <p className="vision-statement">Ritual harian memeriksa kulit masih manual, sampai sekarang. SkinCheck membuatnya otomatis, dari satu foto.</p>
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
