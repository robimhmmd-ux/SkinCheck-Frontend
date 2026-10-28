"use client";
import { isBackendNotConfigured } from "../lib/api";

export function ErrorBox({ error }) {
  if (!error) return null;
  if (isBackendNotConfigured(error)) {
    return (
      <div className="notice">
        <strong>Backend belum dikonfigurasi.</strong>
        <p style={{ margin: "6px 0 0" }}>
          Isi <code>NEXT_PUBLIC_API_URL</code> di <code>.env.local</code> (lokal) atau di
          Environment Variables Vercel dengan URL backend Python kamu, lalu muat ulang halaman ini.
          Halaman ini tetap bisa dibuka, tapi data dari backend belum bisa dimuat.
        </p>
      </div>
    );
  }
  return <div className="error">{error.message || String(error)}</div>;
}

export function Loading({ label }) {
  return <p className="muted">{label || "Memuat…"}</p>;
}
