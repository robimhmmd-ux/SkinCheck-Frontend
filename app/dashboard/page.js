"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, getDashboard, getHistory, getProducts, pickUser, pickObject, pickArray } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import FloatingChat from "../../components/FloatingChat";
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
    <div className="dash-score-row">
      <div className="dash-score-top">
        <span>{label}</span>
        <b>{fmtScore(value)}</b>
      </div>
      <div className="dash-bar" aria-hidden="true">
        <span style={{ width: `${barWidth(value)}%` }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="dash" aria-busy="true" aria-label="Memuat dashboard">
      <div className="dash-skeleton-title" />
      <div className="dash-skeleton-line" />
      <div className="dash-kpis">
        <div className="dash-skeleton-kpi" />
        <div className="dash-skeleton-kpi" />
        <div className="dash-skeleton-kpi" />
      </div>
      <div className="dash-grid">
        <div className="dash-skeleton-panel" />
        <div className="dash-skeleton-panel" />
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
        <div className="dash">
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-lead">Kamu belum masuk, jadi ringkasan kulitmu belum bisa ditampilkan.</p>
          <p><Link className="dash-cta" href="/login">Masuk</Link></p>
        </div>
      );
    }
    return (
      <div className="dash">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-lead">Ringkasan kulitmu tidak bisa dimuat saat ini.</p>
        <ErrorBox error={error} />
        <p><button type="button" className="dash-cta" onClick={() => window.location.reload()}>Coba lagi</button></p>
      </div>
    );
  }

  return (
    <div className="dash">
      <h1 className="dash-title">Dashboard</h1>
      <p className="dash-lead">
        {user
          ? `Halo, ${user.name || user.email || "pengguna"} — ringkasan dari scan yang sudah selesai dianalisis.`
          : "Ringkasan dari scan yang sudah selesai dianalisis."}
      </p>
      <p><Link className="dash-cta" href="/scan">Scan baru</Link></p>
      <ErrorBox error={error} />
      {error && error.status === 401 && (
        <p className="dash-note">Sepertinya kamu belum masuk. <Link href="/login">Masuk dulu</Link> untuk melihat datamu.</p>
      )}

      <dl className="dash-kpis">
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
        <p className="dash-note">
          Scan terbaru (#{newest.id}) masih {statusLabel(newest.status).toLowerCase()} — skornya akan muncul di sini setelah selesai.
        </p>
      )}

      <div className="dash-grid">
        <section className="dash-panel" aria-labelledby="avg-heading">
          <h2 id="avg-heading">Rata-rata semua scan</h2>
          <p className="muted">{avg ? `Dihitung dari ${avg.count} scan yang sudah selesai dianalisis.` : "Belum ada scan yang selesai dianalisis, jadi rata-rata belum bisa dihitung."}</p>
          {SCORE_KEYS.map(([key, label]) => (
            <ScoreBar key={key} label={label} value={avg ? avg[key] : null} />
          ))}
        </section>

        <section className="dash-panel" aria-labelledby="latest-heading">
          <h2 id="latest-heading">Skor scan terakhir</h2>
          <p className="muted">{latest ? `Scan #${latest.id} · ${fmtDate(latest.created_at)}` : "Belum ada scan yang selesai dianalisis."}</p>
          {SCORE_KEYS.map(([key, label]) => (
            <ScoreBar key={key} label={label} value={latestAnalysis ? latestAnalysis[key] : null} />
          ))}
          {latest && <p><Link href={`/history/${latest.id}`}>Lihat detail scan terakhir</Link></p>}
        </section>
      </div>

      <section className="dash-panel" aria-labelledby="recent-heading">
        <h2 id="recent-heading">Scan terbaru</h2>
        {scans.length === 0 ? (
          <p className="muted">Belum ada scan. <Link href="/scan">Mulai scan baru</Link>.</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
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

      <section className="dash-panel" aria-labelledby="products-heading">
        <h2 id="products-heading">Produk pilihan</h2>
        {products.length === 0 ? (
          <p className="muted">Belum ada produk di katalog. <Link href="/marketplace">Buka marketplace</Link>.</p>
        ) : (
          <ul className="dash-product-list">
            {products.slice(0, 3).map((p, i) => (
              <li key={p.id || i}>
                <Link href="/marketplace">{p.name}</Link>
                <span className="muted">{[p.brand, p.category].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        )}
        <p><Link href="/marketplace">Lihat semua produk</Link></p>
      </section>

      <FloatingChat />
    </div>
  );
}
