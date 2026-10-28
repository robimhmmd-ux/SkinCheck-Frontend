"use client";
import { useState } from "react";
import { isBackendConfigured } from "../../lib/api";

// SHELL SAJA — belum terhubung ke endpoint asisten backend.
// TODO: Kontrak /api/v2 yang direncanakan TIDAK memuat endpoint chat asisten.
// Jangan menebak nama endpoint (mis. /api/v2/assistant atau /chat) — tambahkan
// pemanggilan di sini HANYA setelah backend Python benar-benar mengekspos
// endpoint asisten di /api/v2, dan cocokkan nama + payload dengan kontrak itu.
// Asisten di backend juga membutuhkan GEMINI_API_KEY di sisi backend.
export default function AssistantPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Halo! Aku asisten SkinCheck. Tanyakan soal perawatan kulit — tapi saat ini aku masih shell: butuh backend Python + GEMINI_API_KEY, dan endpoint asisten di /api/v2." },
  ]);
  const [input, setInput] = useState("");

  function onSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input.trim() };
    const reply = isBackendConfigured()
      ? "Backend sudah dikonfigurasi, tapi endpoint asisten belum ada di kontrak /api/v2 yang direncanakan, jadi pesan ini belum dikirim ke backend. Setelah backend menambahkan endpoint asisten, hubungkan halaman ini ke endpoint tersebut (dan pastikan GEMINI_API_KEY terisi di backend)."
      : "Asisten butuh backend + GEMINI_API_KEY. Isi NEXT_PUBLIC_API_URL di .env.local / Environment Variables Vercel, pastikan backend Python sudah punya GEMINI_API_KEY, dan endpoint asisten sudah ada di /api/v2 — baru pesan bisa dikirim.";
    setMessages((m) => [...m, userMsg, { role: "assistant", text: reply }]);
    setInput("");
  }

  return (
    <div className="card">
      <h1>Asisten SkinCheck</h1>
      <div className="notice">Halaman ini adalah shell UI. Chat belum terkirim ke backend sampai endpoint asisten ditambahkan ke kontrak /api/v2.</div>
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.text}</div>
        ))}
      </div>
      <form onSubmit={onSend} style={{ marginTop: 16 }}>
        <label>Pesan<input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya soal perawatan kulit…" /></label>
        <button className="btn">Kirim</button>
      </form>
    </div>
  );
}
