"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, getDashboard, pickUser, pickObject, pickArray } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [dash, setDash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, d] = await Promise.allSettled([getMe(), getDashboard()]);
        if (!alive) return;
        if (me.status === "fulfilled") setUser(pickUser(me.value));
        if (d.status === "fulfilled") setDash(pickObject(d.value));
        if (me.status === "rejected") setError(me.value);
        else if (d.status === "rejected") setError(d.value);
      } catch (e) { if (alive) setError(e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="card"><Loading label="Memuat dashboard…" /></div>;

  const scans = pickArray(dash && (dash.recent_scans || dash.scans || dash));
  const stats = dash || {};

  return (
    <>
      <h1>Dashboard</h1>
      <ErrorBox error={error} />
      {error && error.status === 401 && <p>Sepertinya kamu belum masuk. <Link href="/login">Masuk dulu</Link>.</p>}
      {user && <p>Halo, <strong>{user.name || user.email || "pengguna"}</strong> ({user.role || "customer"})</p>}
      <div className="grid">
        <div className="card"><h3>Total scan</h3><b>{stats.total_scans ?? stats.scan_count ?? "—"}</b></div>
        <div className="card"><h3>Scan terakhir</h3><p className="muted">{stats.last_scan_at || stats.latest_scan || "—"}</p></div>
        <div className="card"><h3>Produk</h3><p className="muted"><Link href="/history">Lihat riwayat</Link> · <Link href="/scan">Scan baru</Link></p></div>
      </div>
      <div className="card">
        <h2>Scan terbaru</h2>
        {scans.length === 0 ? <p className="muted">Belum ada scan untuk ditampilkan.</p> : (
          <ul className="list">
            {scans.map((s, i) => (
              <li key={s.id || i}>
                <Link href={`/history/${s.id}`}>Scan #{s.id ?? i + 1}</Link> — {s.status || "—"} · {s.created_at || s.created || ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
