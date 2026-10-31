"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Sistem notifikasi SkinCheck — pengganti popup bawaan browser.
// Prinsipnya: tidak ada lagi window.alert / window.confirm di proyek
// ini. Umpan balik aksi tampil sebagai toast yang halus (geser + fade,
// hanya transform dan opacity), panel blur palet landing, ikon SVG
// (bukan emoji), dan bisa ditutup manual. Konfirmasi destruktif tampil
// sebagai dialog blur ala modal login, bukan popup browser.
// Toast hidup di layout (global), jadi semua halaman memakai sistem
// yang sama. Pesan error kontekstual yang butuh tetap terlihat di
// tempatnya (misalnya "backend belum dikonfigurasi") tetap ditangani
// ErrorBox yang sudah dirapikan di components/Notice.js — toast tidak
// menduplikasi pesan itu.
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam ToastProvider.");
  return ctx;
}

function ToastIcon({ type }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true };
  if (type === "success") return (
    <svg {...common}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
  if (type === "error") return (
    <svg {...common}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  );
  return (
    <svg {...common}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M12 11v5M12 7.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type, message, title) => {
    const id = ++idRef.current;
    const duration = type === "error" ? 7000 : 5000;
    setToasts((prev) => [...prev.slice(-2), { id, type, message, title }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const api = {
    show,
    success: (message, title = "Berhasil") => show("success", message, title),
    error: (message, title = "Terjadi kesalahan") => show("error", message, title),
    info: (message, title = "Info") => show("info", message, title),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role={t.type === "error" ? "alert" : "status"}>
            <span className="toast-icon"><ToastIcon type={t.type} /></span>
            <span className="toast-text">
              <strong>{t.title}</strong>
              <span>{t.message}</span>
            </span>
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Dialog konfirmasi elegan, pengganti window.confirm.
export function ConfirmDialog({ open, title, message, confirmLabel = "Ya, lanjutkan", cancelLabel = "Batal", onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel} role="presentation">
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button type="button" className="btn secondary" onClick={onCancel} autoFocus>{cancelLabel}</button>
          <button type="button" className="btn danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
