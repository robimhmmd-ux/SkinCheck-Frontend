"use client";
import { useState } from "react";
import Link from "next/link";
import { uploadScan, pickObject } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";

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

export default function ScanPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function onFile(e) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : "");
    setResult(null); setError(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) { setError(new Error("Pilih foto wajah dulu.")); return; }
    setError(null); setBusy(true);
    try {
      const res = await uploadScan(file);
      setResult(pickObject(res));
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  // Backend upload replies with `scan_id` (old format) and, once the
  // local AI wiring lands, also `id` + `analysis`. Accept both, and
  // never invent scores: if there is no analysis object, say so.
  const scanId = result && (result.scan_id || result.id);
  const analysis = result && (result.analysis || result.analysis_result || null);
  const status = result && result.status;

  return (
    <div className="card">
      <h1>Scan Wajah</h1>
      <p className="muted">Upload foto wajah (wajah terlihat jelas, pencahayaan cukup). Analisis AI membutuhkan backend Python + model — tanpa backend, halaman ini hanya menampilkan pratinjau dan pesan backend belum dikonfigurasi.</p>
      <ErrorBox error={error} />
      <form onSubmit={onSubmit}>
        <label>Foto wajah<input type="file" accept="image/*" onChange={onFile} /></label>
        {preview && <img className="preview" src={preview} alt="Pratinjau foto wajah" />}
        <button className="btn" disabled={busy}>{busy ? "Mengunggah…" : "Analisis Foto"}</button>
      </form>
      {result && (
        <div className="card">
          <h2>Hasil</h2>
          <p>Status: {status || result.message || "terkirim"}</p>
          {status === "processing" && (
            <p className="muted">Scan tersimpan, tapi analisis AI belum dijalankan oleh backend ini (misalnya backend live Vercel tanpa model). Di backend lokal dengan model, statusnya akan menjadi completed beserta skornya.</p>
          )}
          {status === "failed" && (
            <p className="muted">Analisis gagal di backend. Tidak ada skor yang ditampilkan karena tidak ada hasil analisis yang valid.</p>
          )}
          {analysis ? (
            <>
              <h3>Skor kondisi kulit</h3>
              <div className="score-grid">
                {SCORES.map(([key, label]) => (
                  <div className="score" key={key}>
                    <span className="muted">{label}</span>
                    <b>{analysis[key] != null ? analysis[key] : "—"}</b>
                  </div>
                ))}
              </div>
              {(analysis.ai_response || analysis.recommendation) && (
                <p>{analysis.ai_response || analysis.recommendation}</p>
              )}
            </>
          ) : status === "completed" ? (
            <p className="muted">Status completed, tapi backend tidak mengirim objek analysis — lihat detail scan untuk data lengkapnya.</p>
          ) : null}
          {scanId && <p><Link href={`/history/${scanId}`}>Lihat detail scan #{scanId}</Link></p>}
          <details><summary>Data mentah (debug)</summary><pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(result, null, 2)}</pre></details>
        </div>
      )}
      <p className="muted">Butuh login dulu? <Link href="/login">Masuk</Link></p>
    </div>
  );
}
