"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getHistory, pickArray } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";

// Status diterjemahkan seperti di dashboard — bukan mentah dari backend.
const STATUS_LABEL = { completed: "Selesai", processing: "Diproses", failed: "Gagal" };
const STATUS_CLASS = { completed: "status-ok", processing: "status-proc", failed: "status-fail" };

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
    <div className="dash">
      <h1 className="dash-title">Riwayat Scan</h1>
      <p className="dash-lead">Semua scan yang pernah kamu kirim, dari yang terbaru.</p>
      <ErrorBox error={error} />
      {loading ? <Loading /> : items.length === 0 ? (
        <p className="muted">Belum ada riwayat. <Link href="/scan">Mulai scan baru</Link>.</p>
      ) : (
        <ul className="list">
          {items.map((s, i) => (
            <li key={s.id || i}>
              <Link href={`/history/${s.id}`}>Scan #{s.id ?? i + 1}</Link>
              {" · "}
              <span className={`status ${STATUS_CLASS[s.status] || ""}`}>{STATUS_LABEL[s.status] || s.status || "—"}</span>
              {` · ${s.created_at || s.created || ""}`}
              {s.image_quality_score != null ? ` · kualitas ${s.image_quality_score}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
