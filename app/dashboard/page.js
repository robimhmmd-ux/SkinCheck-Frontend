"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, getDashboard, getHistory, getProducts, pickUser, pickObject, pickArray } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import Seal from "../../components/Seal";
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

function barWidth(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function ScoreBar({ label, value }) {
  return (
    <div className="ed-score-row">
      <div className="ed-score-top">
        <span>{label}</span>
        <b>{fmtScore(value)}</b>
      </div>
      <div className="ed-bar" aria-hidden="true">
        <span style={{ width: `${barWidth(value)}%` }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="ed-page" aria-busy="true" aria-label="Memuat dashboard">
      <div className="ed-skeleton-title" />
      <div className="ed-skeleton-line" />
      <div className="ed-kpis">
        <div className="ed-skeleton-kpi" />
        <div className="ed-skeleton-kpi" />
        <div className="ed-skeleton-kpi" />
      </div>
      <div className="ed-grid">
        <div className="ed-skeleton-panel" />
        <div className="ed-skeleton-panel" />
      </div>
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
        <div className="ed-page">
          <div className="ed-mast">
            <h1>Dashboard</h1>
            <p className="ed-lead">Kamu belum masuk, jadi ringkasan kulitmu belum bisa ditampilkan.</p>
            <div className="ed-mast-actions"><Link className="btn" href="/login">Masuk</Link></div>
          </div>
        </div>
      );
    }
    return (
      <div className="ed-page">
        <div className="ed-mast">
          <h1>Dashboard</h1>
          <p className="ed-lead">Ringkasan kulitmu tidak bisa dimuat saat ini.</p>
        </div>
        <ErrorBox error={error} />
        <p><button type="button" className="btn" onClick={() => window.location.reload()}>Coba lagi</button></p>
      </div>
    );
  }

  return (
    <div className="ed-page">
      <div className="ed-mast">
        <Seal />
        <h1>Dashboard</h1>
        <p className="ed-lead">
          {user
            ? `Halo, ${user.name || user.email || "pengguna"} — ringkasan dari scan yang sudah selesai dianalisis.`
            : "Ringkasan dari scan yang sudah selesai dianalisis."}
        </p>
        <div className="ed-mast-actions"><Link className="btn" href="/scan">Scan baru</Link></div>
      </div>
      <ErrorBox error={error} />
      {error && error.status === 401 && (
        <p className="muted">Sepertinya kamu belum masuk. <Link href="/login">Masuk dulu</Link> untuk melihat datamu.</p>
      )}

      <dl className="ed-kpis">
        <div>
          <dt>Scan dianalisis</dt>
          <dd>{analyzedCount}</dd>
        </div>
        <div>
          <dt>Belum ada skor</dt>
          <dd>{pendingCount}</dd>
        </div>
        <div>
          <dt>Scan terakhir dianalisis</dt>
          <dd>{latest ? fmtDateShort(latest.created_at) : "—"}</dd>
        </div>
      </dl>

      {newestPending && (
        <p className="muted">
          Scan terbaru (#{newest.id}) masih {statusLabel(newest.status).toLowerCase()} — skornya akan muncul di sini setelah selesai.
        </p>
      )}

      <div className="ed-grid">
        <section className="ed-panel" aria-labelledby="avg-heading">
          <h2 id="avg-heading">Rata-rata semua scan</h2>
          <p className="muted">{avg ? `Dihitung dari ${avg.count} scan yang sudah selesai dianalisis.` : "Belum ada scan yang selesai dianalisis, jadi rata-rata belum bisa dihitung."}</p>
          {SCORE_KEYS.map(([key, label]) => (
            <ScoreBar key={key} label={label} value={avg ? avg[key] : null} />
          ))}
          <p><Link href="/history">Lihat semua riwayat</Link></p>
        </section>

        <section className="ed-panel" aria-labelledby="latest-heading">
          <h2 id="latest-heading">Skor scan terakhir</h2>
          <p className="muted">{latest ? `Scan #${latest.id}, ${fmtDate(latest.created_at)}` : "Belum ada scan yang selesai dianalisis."}</p>
          {SCORE_KEYS.map(([key, label]) => (
            <ScoreBar key={key} label={label} value={latestAnalysis ? latestAnalysis[key] : null} />
          ))}
          {latest && <p><Link href={`/history/${latest.id}`}>Lihat detail scan terakhir</Link></p>}
        </section>
      </div>

      <section className="ed-panel" aria-labelledby="recent-heading">
        <h2 id="recent-heading">Scan terbaru</h2>
        {scans.length === 0 ? (
          <p className="muted">Belum ada scan. <Link href="/scan">Mulai scan baru</Link>.</p>
        ) : (
          <div className="ed-table-wrap">
            <table className="ed-table">
              <thead>
                <tr><th scope="col">Scan</th><th scope="col">Tanggal</th><th scope="col">Status</th><th scope="col" className="num">Skor keseluruhan</th></tr>
              </thead>
              <tbody>
                {scans.slice(0, 5).map((s, i) => {
                  const analysis = pickAnalysis(s);
                  return (
                    <tr key={s.id || i}>
                      <td><Link href={`/history/${s.id}`}>Scan #{s.id ?? i + 1}</Link></td>
                      <td>{fmtDateShort(s.created_at)}</td>
                      <td>{statusLabel(s.status)}</td>
                      <td className="num">{analysis ? fmtScore(analysis.overall_score) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p><Link href="/history">Lihat semua riwayat</Link></p>
      </section>

      <section className="ed-panel" aria-labelledby="products-heading">
        <h2 id="products-heading">Produk pilihan</h2>
        {products.length === 0 ? (
          <p className="muted">Belum ada produk di katalog. <Link href="/marketplace">Buka marketplace</Link>.</p>
        ) : (
          <ul className="ed-list">
            {products.slice(0, 3).map((p, i) => (
              <li key={p.id || i}>
                <Link href="/marketplace">{p.name}</Link>
                <p className="muted">{[p.brand, p.category].filter(Boolean).join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
        <p><Link href="/marketplace">Lihat semua produk</Link></p>
      </section>

      <section className="ed-panel" aria-labelledby="assistant-heading">
        <h2 id="assistant-heading">Tanya Luvenna</h2>
        <p className="muted">Asisten kulit wajah yang menjawab dari skor dan riwayat scanmu.</p>
        <p><Link className="btn secondary" href="/assistant">Buka halaman Asisten</Link></p>
      </section>
    </div>
  );
}
