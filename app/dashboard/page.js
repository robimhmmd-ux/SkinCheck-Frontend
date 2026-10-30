"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, getDashboard, getHistory, getProducts, pickUser, pickObject, pickArray } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";
import FloatingChat from "../../components/FloatingChat";
import { SCORE_KEYS, averageScores, latestAnalyzedScan, fmtScore, fmtDate } from "../../lib/scores";

function ScoreRow({ label, value }) {
  return (
    <div className="me-score-row">
      <span>{label}</span>
      <b>{fmtScore(value)}</b>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [dash, setDash] = useState(null);
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, d, h, p] = await Promise.allSettled([getMe(), getDashboard(), getHistory(), getProducts()]);
        if (!alive) return;
        if (me.status === "fulfilled") setUser(pickUser(me.value));
        if (d.status === "fulfilled") setDash(pickObject(d.value));
        if (h.status === "fulfilled") setHistory(pickArray(h.value));
        if (p.status === "fulfilled") setProducts(pickArray(p.value));
        const firstErr = [me, d, h, p].find((r) => r.status === "rejected");
        if (firstErr) setError(firstErr.reason);
      } catch (e) { if (alive) setError(e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="card"><Loading label="Memuat dashboard…" /></div>;

  const scans = history.length ? history : pickArray(dash && (dash.recent_scans || dash.scans || dash));
  const avg = averageScores(scans);
  const latest = latestAnalyzedScan(scans);
  const latestAnalysis = latest ? (latest.analysis || latest.analysis_result || latest.result) : null;
  const totalScans = scans.length;
  const sideProducts = products.slice(0, 2);

  return (
    <div className="me-shell">
      <nav className="me-pillnav" aria-label="Navigasi customer">
        <Link href="/dashboard" aria-current="page">Dashboard</Link>
        <Link href="/scan">Scan</Link>
        <Link href="/output">Output</Link>
        <Link href="/history">Riwayat</Link>
        <Link href="/marketplace">Marketplace</Link>
        <Link href="/profile">Setting akun</Link>
      </nav>

      <section className="me-hero">
        <div className="me-hero-copy">
          <p className="me-brand">✦ SkinCheck</p>
          <h1>Get Your<br />Natural<br />Skin</h1>
          <p className="me-lead">
            Warna alami kulitmu adalah identitasmu. Jangan diubah, cukup kenali dan rawat dengan cara yang tepat untukmu.
          </p>
          <p>
            <Link className="me-cta" href="/scan">Mulai scan <span aria-hidden="true">↗</span></Link>
            <Link className="me-cta ghost" href="/marketplace">Lihat marketplace</Link>
          </p>
          {user && <p className="me-hello">Halo, <strong>{user.name || user.email || "pengguna"}</strong> — ini ringkasan kulitmu dari scan yang sudah selesai dianalisis.</p>}
          <ErrorBox error={error} />
          {error && error.status === 401 && <p>Sepertinya kamu belum masuk. <Link href="/login">Masuk dulu</Link> untuk melihat datamu.</p>}
          <div className="me-stats">
            <div><b>{totalScans || "—"}</b><span>Total scan</span></div>
            <div><b>{avg ? fmtScore(avg.overall_score) : "—"}</b><span>Rata-rata skor keseluruhan</span></div>
            <div><b>{latest ? fmtDate(latest.created_at) : "—"}</b><span>Scan terakhir</span></div>
          </div>
        </div>
        <div className="me-hero-visual">
          <img src="/hero-face.png" alt="Wajah dengan mata tertutup, kulit bercahaya lembut" />
        </div>
        <div className="me-sidecards">
          {sideProducts.length === 0 ? (
            <>
              <div className="me-sidecard sage"><span className="me-sidecard-arrow" aria-hidden="true">↗</span><span className="me-sidecard-vertical">Produk pilihan</span><span className="me-sidecard-name">Produk akan tampil di sini setelah backend dan katalog terhubung.</span></div>
              <div className="me-sidecard deep"><span className="me-sidecard-arrow" aria-hidden="true">↗</span><span className="me-sidecard-vertical">Marketplace</span><span className="me-sidecard-name"><Link href="/marketplace">Buka marketplace</Link></span></div>
            </>
          ) : sideProducts.map((p, i) => (
            <div key={p.id || i} className={`me-sidecard ${i === 0 ? "sage" : "deep"}`}>
              <span className="me-sidecard-arrow" aria-hidden="true">↗</span>
              <span className="me-sidecard-vertical">{p.brand || "SkinCheck"}</span>
              <span className="me-sidecard-name">{p.name}</span>
              <span className="me-sidecard-cat">{p.category || ""}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="me-panels">
        <div className="me-panel">
          <h2>Rata-rata dari seluruh scan</h2>
          <p className="muted">{avg ? `Dihitung dari ${avg.count} scan yang sudah selesai dianalisis.` : "Belum ada scan yang selesai dianalisis, jadi rata-rata belum bisa dihitung."}</p>
          {SCORE_KEYS.map(([key, label]) => (
            <ScoreRow key={key} label={label} value={avg ? avg[key] : null} />
          ))}
        </div>
        <div className="me-panel">
          <h2>Skor scan terakhir</h2>
          <p className="muted">{latest ? `Scan #${latest.id} · ${fmtDate(latest.created_at)} · status ${latest.status || "—"}` : "Belum ada scan terbaru yang selesai dianalisis."}</p>
          {SCORE_KEYS.map(([key, label]) => (
            <ScoreRow key={key} label={label} value={latestAnalysis ? latestAnalysis[key] : null} />
          ))}
          {latest && <p><Link href={`/history/${latest.id}`}>Lihat detail scan terakhir</Link></p>}
        </div>
        <div className="me-panel">
          <h2>Scan terbaru</h2>
          {scans.length === 0 ? (
            <p className="muted">Belum ada scan untuk ditampilkan. <Link href="/scan">Mulai scan baru</Link>.</p>
          ) : (
            <ul className="list">
              {scans.slice(0, 5).map((s, i) => (
                <li key={s.id || i}>
                  <Link href={`/history/${s.id}`}>Scan #{s.id ?? i + 1}</Link> — {s.status || "—"} · {fmtDate(s.created_at)}
                </li>
              ))}
            </ul>
          )}
          <p><Link href="/history">Lihat semua riwayat</Link> · <Link href="/scan">Scan baru</Link></p>
        </div>
      </section>

      <FloatingChat />
    </div>
  );
}
