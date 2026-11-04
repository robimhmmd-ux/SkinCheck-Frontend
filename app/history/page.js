"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getHistory, pickArray } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";

// Status diterjemahkan seperti di dashboard — bukan mentah dari backend.
const STATUS_LABEL = { completed: "Selesai", processing: "Diproses", failed: "Gagal" };
const STATUS_CLASS = { completed: "ed-status-ok", processing: "ed-status-proc", failed: "ed-status-fail" };

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getHistory()
      .then((d) => { if (alive) setItems(pickArray(d)); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="ed-page">
      <div className="ed-mast">
        <h1>Riwayat Scan</h1>
        <p className="ed-lead">Semua scan yang pernah kamu kirim, dari yang terbaru.</p>
      </div>
      <ErrorBox error={error} />
      {loading ? <Loading /> : items.length === 0 ? (
        <p className="muted">Belum ada riwayat. <Link href="/scan">Mulai scan baru</Link>.</p>
      ) : (
        <div className="ed-panel">
          <div className="ed-table-wrap">
            <table className="ed-table">
              <thead>
                <tr><th scope="col">Scan</th><th scope="col">Status</th><th scope="col">Tanggal</th><th scope="col" className="num">Kualitas gambar</th></tr>
              </thead>
              <tbody>
                {items.map((s, i) => (
                  <tr key={s.id || i}>
                    <td><Link href={`/history/${s.id}`}>Scan #{s.id ?? i + 1}</Link></td>
                    <td><span className={`ed-status ${STATUS_CLASS[s.status] || ""}`}>{STATUS_LABEL[s.status] || s.status || "—"}</span></td>
                    <td>{s.created_at || s.created || "—"}</td>
                    <td className="num">{s.image_quality_score != null ? s.image_quality_score : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
