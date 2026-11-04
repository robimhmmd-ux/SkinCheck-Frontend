"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getHistory, pickArray } from "../../lib/api";
import { pickAnalysis } from "../../lib/scores";
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
    <div className="gx-page">
      <div className="gx-head">
        <h1 className="gx-title">Riwayat Scan</h1>
        <p className="gx-lead">Semua scan yang pernah kamu kirim, dari yang terbaru.</p>
      </div>
      <ErrorBox error={error} />
      {loading ? <Loading /> : items.length === 0 ? (
        <p className="muted">Belum ada riwayat. <Link href="/scan">Mulai scan baru</Link>.</p>
      ) : (
        <div className="gx-timeline">
          {items.map((s, i) => {
            const analysis = pickAnalysis(s);
            return (
            <div key={s.id || i} className="gx-tl">
              <div className="gx-tl-top">
                <Link href={`/history/${s.id}`}>Scan #{s.id ?? i + 1}</Link>
                {analysis ? <b>{analysis.overall_score}</b> : <span className={`ed-status ${STATUS_CLASS[s.status] || ""}`}>{STATUS_LABEL[s.status] || s.status || "—"}</span>}
              </div>
              <p className="gx-tl-meta">{s.created_at || s.created || "—"}{analysis ? `, ${STATUS_LABEL[s.status] || s.status || "—"}` : ""}{s.image_quality_score != null ? `, kualitas gambar ${s.image_quality_score}` : ""}</p>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
