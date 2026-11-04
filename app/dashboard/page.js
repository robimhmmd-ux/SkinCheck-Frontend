"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getMe, getDashboard, getHistory, getProducts, pickUser, pickObject, pickArray } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import { SCORE_KEYS, averageScores, latestAnalyzedScan, fmtScore, fmtDate, pickAnalysis } from "../../lib/scores";

const STATUS_LABEL = {
  completed: "Selesai",
  processing: "Diproses",
  failed: "Gagal",
  pending: "Menunggu",
};

function statusLabel(status) {
  return STATUS_LABEL[status] || status || "—";
}

function fmtDateShort(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function scaleLeft(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

// Skor sebagai penanda titik di garis skala, bukan bar.
function ScaleRow({ label, value }) {
  const finite = value != null && Number.isFinite(Number(value));
  return (
    <div className="gx-row">
      <span className="gx-label">{label}</span>
      <b className={finite ? "" : "muted"}>{finite ? `${fmtScore(value)}%` : "—"}</b>
      {finite && (
        <span className="gx-scale" aria-hidden="true">
          <i style={{ left: `${scaleLeft(value)}%` }} />
        </span>
      )}
    </div>
  );
}

// Angka naik dari 0 ke nilai akhir saat halaman dibuka (hanya gerak,
// nilainya tetap angka asli dari backend; reduced motion langsung tampil final).
function CountUp({ value, suffix }) {
  const [display, setDisplay] = useState(null);
  useEffect(() => {
    const n = Number(value);
    if (!Number.isFinite(n)) { setDisplay(null); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplay(n); return; }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(n * e * 10) / 10);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  if (display == null) return <>—</>;
  return <>{fmtScore(display)}{suffix}</>;
}

function Skeleton() {
  return (
    <div className="gx-page" aria-busy="true" aria-label="Memuat dashboard">
      <div className="ed-skeleton-title" />
      <div className="ed-skeleton-line" />
      <div className="ed-skeleton-panel" />
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

  const stripRef = useRef(null);
  const scrollStrip = (dir) => {
    if (stripRef.current) stripRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (loading) return <Skeleton />;

  // Semua angka di halaman ini dihitung dari data yang berhasil dimuat,
  // bukan dari total database: /api/v2/history dibatasi 50 item dan
  // /api/v2/dashboard 10 item terbaru. Jadi tidak ada klaim "total" di sini.
  const scans = history.length ? history : pickArray(dash && (dash.recent_scans || dash.scans || dash));
  const avg = averageScores(scans);
  const latest = latestAnalyzedScan(scans);
  const latestAnalysis = latest ? pickAnalysis(latest) : null;
  const newest = scans[0] || null;
  const newestPending = newest && !pickAnalysis(newest);
  const analyzedCount = avg ? avg.count : 0;
  const pendingCount = scans.filter((s) => !pickAnalysis(s)).length;

  const nothingLoaded = !user && !dash && scans.length === 0 && products.length === 0;

  if (nothingLoaded && error) {
    if (error.status === 401) {
      return (
        <div className="gx-page">
          <div className="gx-head">
            <h1 className="gx-title">Dashboard</h1>
            <p className="gx-lead">Kamu belum masuk, jadi ringkasan kulitmu belum bisa ditampilkan.</p>
            <div className="gx-actions"><Link className="btn" href="/login">Masuk</Link></div>
          </div>
        </div>
      );
    }
    return (
      <div className="gx-page">
        <div className="gx-head">
          <h1 className="gx-title">Dashboard</h1>
          <p className="gx-lead">Ringkasan kulitmu tidak bisa dimuat saat ini.</p>
        </div>
        <ErrorBox error={error} />
        <p><button type="button" className="btn" onClick={() => window.location.reload()}>Coba lagi</button></p>
      </div>
    );
  }

  return (
    <div className="gx-page">
      <section className="gx-hero gx-rise gx-card gx-hero-card">
        <div>
          <h1>{user ? `Halo, ${user.name || user.email || "pengguna"}` : "Dashboard"}</h1>
          <p className="gx-hero-sub">Ringkasan dari scan yang sudah selesai dianalisis.</p>
          <div className="gx-hero-num">
            <b><CountUp value={latestAnalysis ? latestAnalysis.overall_score : null} suffix={<span className="gx-unit">%</span>} /></b>
            <span>skor keseluruhan scan terakhir{latest ? ` · Scan #${latest.id}, ${fmtDateShort(latest.created_at)}` : ""}</span>
          </div>
          {(() => {
            // Finding: kondisi yang paling menonjol di scan terakhir,
            // dihitung dari skornya — bukan kalimat karangan.
            if (!latestAnalysis) return null;
            let top = null;
            for (const [key, label] of SCORE_KEYS) {
              if (key === "overall_score") continue;
              const v = Number(latestAnalysis[key]);
              if (Number.isFinite(v) && (top === null || v > top.value)) top = { label, value: v };
            }
            if (!top) return null;
            return <p className="gx-hero-finding">Yang paling menonjol: {top.label} {top.value}%.</p>;
          })()}
          <div className="gx-actions"><Link className="btn" href="/scan">Scan baru</Link><Link className="btn secondary" href="/history">Lihat riwayat</Link></div>
        </div>
        <div className="gx-arch-img">
          <Image src="/hero-face.png" alt="Ilustrasi wajah" width={520} height={650} priority />
        </div>
      </section>

      <ErrorBox error={error} />
      {error && error.status === 401 && (
        <p className="muted">Sepertinya kamu belum masuk. <Link href="/login">Masuk dulu</Link> untuk melihat datamu.</p>
      )}

      <div className="gx-card gx-stat-card" style={{ animationDelay: "80ms" }}>
        <div className="gx-stat"><b><CountUp value={analyzedCount} /></b><span>Scan dianalisis</span></div>
        <div className="gx-stat"><b>{pendingCount}</b><span>Belum ada skor</span></div>
        <div className="gx-stat"><b>{latest ? fmtDateShort(latest.created_at) : "—"}</b><span>Scan terakhir dianalisis</span></div>
      </div>

      {newestPending && (
        <p className="muted">
          Scan terbaru (#{newest.id}) masih {statusLabel(newest.status).toLowerCase()} — skornya akan muncul di sini setelah selesai.
        </p>
      )}

      <div className="gx-dash-grid">
        <section className="gx-card" style={{ animationDelay: "160ms" }} aria-labelledby="latest-heading">
          <div className="gx-card-head">
            <div>
              <h2 id="latest-heading">Skor scan terakhir</h2>
              <p className="gx-section-lead">{latest ? `Scan #${latest.id}, ${fmtDate(latest.created_at)}` : "Belum ada scan yang selesai dianalisis."}</p>
            </div>
          </div>
          <div className="gx-ledger">
            {SCORE_KEYS.map(([key, label]) => (
              <ScaleRow key={key} label={label} value={latestAnalysis ? latestAnalysis[key] : null} />
            ))}
          </div>
          {latest && <div className="gx-actions" style={{ marginTop: 16 }}><Link className="btn secondary" href={`/history/${latest.id}`}>Lihat detail scan terakhir</Link></div>}
        </section>

        <section className="gx-card" style={{ animationDelay: "240ms" }} aria-labelledby="avg-heading">
          <div className="gx-card-head">
            <div>
              <h2 id="avg-heading">Rata-rata semua scan</h2>
              <p className="gx-section-lead">{avg ? `Dihitung dari ${avg.count} scan yang sudah selesai dianalisis.` : "Belum ada scan yang selesai dianalisis, jadi rata-rata belum bisa dihitung."}</p>
            </div>
          </div>
          <div className="gx-ledger">
            {SCORE_KEYS.map(([key, label]) => (
              <ScaleRow key={key} label={label} value={avg ? avg[key] : null} />
            ))}
          </div>
        </section>
      </div>

      <section className="gx-card" style={{ animationDelay: "320ms" }} aria-labelledby="recent-heading">
        <div className="gx-card-head">
          <div>
            <h2 id="recent-heading">Jejak scan</h2>
            <p className="gx-section-lead">Lima scan terbaru, dari yang paling baru.</p>
          </div>
          <div className="gx-actions"><Link className="btn secondary" href="/history">Lihat semua</Link></div>
        </div>
        {scans.length === 0 ? (
          <p className="muted">Belum ada scan. <Link href="/scan">Mulai scan baru</Link>.</p>
        ) : (
          <div className="gx-timeline">
            {scans.slice(0, 5).map((s, i) => {
              const analysis = pickAnalysis(s);
              return (
                <div key={s.id || i} className="gx-tl">
                  <div className="gx-tl-top">
                    <Link href={`/history/${s.id}`}>Scan #{s.id ?? i + 1}</Link>
                    <b>{analysis ? fmtScore(analysis.overall_score) : "—"}</b>
                  </div>
                  <p className="gx-tl-meta">{fmtDateShort(s.created_at)}, {statusLabel(s.status)}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="gx-card" style={{ animationDelay: "400ms" }} aria-labelledby="products-heading">
        <div className="gx-card-head">
          <div>
            <h2 id="products-heading">Pilihan untukmu</h2>
            <p className="gx-section-lead">Geser ke samping atau pakai tombol geser untuk melihat produk lainnya.</p>
          </div>
          <div className="gx-strip-nav">
            <button type="button" className="btn secondary" aria-label="Produk sebelumnya" onClick={() => scrollStrip(-1)}>‹</button>
            <button type="button" className="btn secondary" aria-label="Produk berikutnya" onClick={() => scrollStrip(1)}>›</button>
          </div>
        </div>
        {products.length === 0 ? (
          <p className="muted">Belum ada produk di katalog. <Link href="/marketplace">Buka marketplace</Link>.</p>
        ) : (
          <div className="gx-strip" ref={stripRef}>
            {products.slice(0, 6).map((p, i) => (
              <article key={p.id || i} className={`gx-strip-card ${i % 2 === 1 ? "alt" : ""}`}>
                <p className="gx-brand">{p.brand || "—"}</p>
                <h3>{p.name}</h3>
                <p className="muted">{[p.category].filter(Boolean).join(", ")}</p>
                <p><Link href="/marketplace">Lihat di marketplace</Link></p>
              </article>
            ))}
          </div>
        )}
        <div className="gx-actions" style={{ marginTop: 16 }}><Link className="btn secondary" href="/marketplace">Lihat semua produk</Link></div>
      </section>

      <section className="gx-banner" aria-labelledby="assistant-heading">
        <div>
          <h2 id="assistant-heading">Tanya Luvenna</h2>
          <p className="muted">Asisten kulit wajah yang menjawab dari skor dan riwayat scanmu.</p>
        </div>
        <Link className="btn secondary" href="/assistant">Buka halaman Asisten</Link>
      </section>
    </div>
  );
}
