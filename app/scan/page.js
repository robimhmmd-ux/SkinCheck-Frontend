"use client";
import { useState } from "react";
import Link from "next/link";
import { uploadScan, pickObject } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";

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
          <p>Status: {result.status || result.message || "terkirim"}</p>
          {result.id && <p><Link href={`/history/${result.id}`}>Lihat detail scan #{result.id}</Link></p>}
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      <p className="muted">Butuh login dulu? <Link href="/login">Masuk</Link></p>
    </div>
  );
}
