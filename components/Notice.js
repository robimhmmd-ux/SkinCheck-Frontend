"use client";
import { useState } from "react";
import { isBackendNotConfigured } from "../lib/api";

// Banner error inline yang dirapikan: panel blur palet landing, ikon
// SVG, animasi masuk yang halus, dan bisa ditutup manual. Ini untuk
// pesan yang memang harus tetap terlihat di tempatnya (misalnya
// backend belum dikonfigurasi). Umpan balik aksi sesaat (simpan,
// keluar, dsb.) memakai toast di components/Toast.js, bukan banner ini.
export function ErrorBox({ error }) {
  const [closed, setClosed] = useState(false);
  if (!error || closed) return null;
  const closeBtn = (
    <button type="button" className="notice-close" onClick={() => setClosed(true)} aria-label="Tutup pesan">×</button>
  );
  if (isBackendNotConfigured(error)) {
    return (
      <div className="notice notice-elegant" role="alert">
        <span className="notice-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M12 11v5M12 7.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </span>
        <span className="notice-text">
          <strong>Backend belum dikonfigurasi.</strong>
          <span>
            Isi <code>NEXT_PUBLIC_API_URL</code> di <code>.env.local</code> (lokal) atau di
            Environment Variables Vercel dengan URL backend Python kamu, lalu muat ulang halaman ini.
            Halaman ini tetap bisa dibuka, tapi data dari backend belum bisa dimuat.
          </span>
        </span>
        {closeBtn}
      </div>
    );
  }
  return (
    <div className="error notice-elegant" role="alert">
      <span className="notice-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </span>
      <span className="notice-text">{error.message || String(error)}</span>
      {closeBtn}
    </div>
  );
}

export function Loading({ label }) {
  return <p className="muted">{label || "Memuat…"}</p>;
}
