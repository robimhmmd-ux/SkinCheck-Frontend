"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getScanDetail, pickObject } from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";

const SCORES = [
  ["acne_score", "Jerawat"],
  ["dry_skin_score", "Kulit kering"],
  ["oily_skin_score", "Kulit berminyak"],
  ["dark_spots_score", "Dark spots"],
  ["wrinkles_score", "Kerutan"],
  ["redness_score", "Kemerahan"],
  ["texture_score", "Tekstur"],
  ["hyperpigmentation_score", "Hiperpigmentasi"],
  ["overall_score", "Skor keseluruhan"],
];

export default function ScanDetailPage({ params }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getScanDetail(params.id)
      .then((d) => { if (alive) setData(pickObject(d)); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [params.id]);

  if (loading) return <div className="card"><Loading /></div>;

  const scan = data.scan || data;
  const result = data.result || data.analysis || data.analysis_result || scan;

  return (
    <div className="card">
      <h1>Detail Scan #{params.id}</h1>
      <ErrorBox error={error} />
      {!error && (
        <>
          <p>Status: {scan.status || "—"} · Dibuat: {scan.created_at || scan.created || "—"}</p>
          <h2>Skor kondisi kulit</h2>
          <div className="score-grid">
            {SCORES.map(([key, label]) => (
              <div className="score" key={key}>
                <span className="muted">{label}</span>
                <b>{result && result[key] != null ? result[key] : "—"}</b>
              </div>
            ))}
          </div>
          {(result.ai_response || result.recommendation) && (
            <div className="card"><h3>Catatan AI</h3><p>{result.ai_response || result.recommendation}</p></div>
          )}
          <details><summary>Data mentah (debug)</summary><pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(data, null, 2)}</pre></details>
        </>
      )}
      <p><Link href="/history">Kembali ke riwayat</Link></p>
    </div>
  );
}
