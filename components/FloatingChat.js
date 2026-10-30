"use client";
import { useState } from "react";
import Link from "next/link";

// Widget chatbot mengambang — HANYA di dashboard customer.
// Status jujur: endpoint asisten /api/v2 belum ada (lihat halaman
// /assistant), jadi widget ini belum mengirim pesan ke backend dan
// tidak berpura-pura menjawab dengan AI. Begitu endpoint asisten
// selesai (tugas Antigravity terpisah), widget ini tinggal
// disambungkan ke endpoint yang sama seperti halaman /assistant.
export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  return (
    <div className="float-chat">
      {open && (
        <div className="float-chat-panel" role="dialog" aria-label="Asisten SkinCheck">
          <div className="float-chat-head">
            <div>
              <strong>Asisten SkinCheck</strong>
              <p className="muted">Luvenna, asisten kulit wajah</p>
            </div>
            <button type="button" className="float-chat-close" onClick={() => setOpen(false)} aria-label="Tutup chat">×</button>
          </div>
          <div className="float-chat-body">
            <div className="msg assistant">
              Halo! Aku asisten SkinCheck. Saat ini chat di sini masih dalam tahap penyambungan ke backend, jadi aku belum bisa menjawab dari datamu.
            </div>
            <p className="muted">Begitu endpoint asisten di /api/v2 selesai, chat ini akan menjawab dari skor dan riwayat scanmu, seperti di halaman Asisten.</p>
            <Link className="btn" href="/assistant">Buka halaman Asisten</Link>
          </div>
        </div>
      )}
      <button
        type="button"
        className="float-chat-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Tutup asisten SkinCheck" : "Buka asisten SkinCheck"}
        aria-expanded={open}
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
