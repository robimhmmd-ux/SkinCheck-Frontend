"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getScanDetail, getHistory, pickObject, pickArray } from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";
import { SCORE_KEYS, averageScores, latestAnalyzedScan, fmtScore, fmtDate } from "../../../lib/scores";

export default function ScanDetailPage({ params }) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, h] = await Promise.allSettled([getScanDetail(params.id), getHistory()]);
        if (!alive) return;
        if (d.status === "fulfilled") setData(pickObject(d.value));
        if (h.status === "fulfilled") setHistory(pickArray(h.value));
        if (d.status === "rejected") setError(d.reason);
      } catch (e) { if (alive) setError(e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [params.id]);

  if (loading) return <div className="card"><Loading /></div>;

  const scan = data ? (data.scan || data) : {};
  const result = data ? (data.result || data.analysis || data.analysis_result || scan) : null;
  const analysis = result && result.acne_score != null ? result : (scan.analysis || null);
  const avg = averageScores(history);
  const latest = latestAnalyzedScan(history);
  const latestAnalysis = latest ? (latest.analysis || latest.analysis_result || latest.result) : null;

  return (
    <div className="me-shell">
      <h1 className="me-page-title">Hasil Scan #{params.id}</h1>
      <ErrorBox error={error} />
      {!error && (
        <>
          <p className="muted">Status: {scan.status || "—"} · Dibuat: {fmtDate(scan.created_at || scan.created)}</p>
          {scan.status === "processing" && (
            <div className="notice">Scan tersimpan, tapi analisis AI belum dijalankan oleh backend ini (misalnya backend live tanpa model). Skor di bawah akan terisi setelah backend lokal dengan model menyelesaikan analisis ini. Rata-rata di bawah dihitung dari scan-scan yang sudah selesai saja.</div>
          )}
          {scan.status === "failed" && (
            <div className="error">Analisis gagal di backend. Tidak ada skor yang ditampilkan untuk scan ini, karena tidak ada hasil analisis yang valid.</div>
          )}

          <div className="me-panels">
            <div className="me-panel">
              <h2>Output VGG scan ini</h2>
              <p className="muted">5 skor kondisi kulit dari model VGG untuk foto pada scan ini.</p>
              {SCORE_KEYS.map(([key, label]) => (
                <div key={key} className="me-score-row"><span>{label}</span><b>{fmtScore(analysis ? analysis[key] : null)}</b></div>
              ))}
              {(analysis && (analysis.ai_response || analysis.recommendation)) && (
                <div className="card"><h3>Catatan AI</h3><p>{analysis.ai_response || analysis.recommendation}</p></div>
              )}
            </div>
            <div className="me-panel">
              <h2>Rata-rata dari seluruh scan</h2>
              <p className="muted">{avg ? `Dihitung dari ${avg.count} scan yang sudah selesai dianalisis.` : "Belum ada scan yang selesai dianalisis."}</p>
              {SCORE_KEYS.map(([key, label]) => (
                <div key={key} className="me-score-row"><span>{label}</span><b>{fmtScore(avg ? avg[key] : null)}</b></div>
              ))}
              <p className="muted">Total scan di riwayat: {history.length ? history.length : "—"}</p>
            </div>
            <div className="me-panel">
              <h2>Rata-rata scan terakhir</h2>
              <p className="muted">{latest ? `Scan #${latest.id} · ${fmtDate(latest.created_at)} — ini skor scan terbaru (satu sesi), ditampilkan berdampingan dengan rata-rata seluruh scan agar perubahannya terlihat.` : "Belum ada scan terbaru yang selesai dianalisis."}</p>
              {SCORE_KEYS.map(([key, label]) => (
                <div key={key} className="me-score-row"><span>{label}</span><b>{fmtScore(latestAnalysis ? latestAnalysis[key] : null)}</b></div>
              ))}
            </div>
          </div>
          <details><summary>Data mentah (debug)</summary><pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(data, null, 2)}</pre></details>
        </>
      )}
      <p><Link href="/history">Kembali ke riwayat</Link> · <Link href="/scan">Scan baru</Link> · <Link href="/dashboard">Dashboard</Link></p>
    </div>
  );
}
