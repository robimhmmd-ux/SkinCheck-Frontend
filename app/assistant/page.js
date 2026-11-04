"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  assistantChat,
  getAssistantHistory,
  clearAssistantHistory,
  isBackendConfigured,
  pickArray,
} from "../../lib/api";
import { ErrorBox } from "../../components/Notice";
import { ConfirmDialog, useToast } from "../../components/Toast";

export default function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authNeeded, setAuthNeeded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const toast = useToast();
  const chatEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  function scrollToBottom() {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setError(null);
    setInitialLoading(true);
    try {
      if (!isBackendConfigured()) {
        setMessages([
          {
            role: "assistant",
            content:
              "Halo! Aku Luvenna (Ven), asisten SkinCheck. Backend belum dikonfigurasi. Silakan isi NEXT_PUBLIC_API_URL pada environment variable.",
          },
        ]);
        return;
      }
      const res = await getAssistantHistory();
      const list = pickArray(res);
      if (list && list.length > 0) {
        setMessages(
          list.map((m) => ({
            role: m.role || "assistant",
            content: m.content || m.text || "",
            time: m.time || "",
          }))
        );
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "Halo! Aku Luvenna (Ven), asisten SkinCheck untuk kesehatan kulit wajah. Ada yang ingin kamu diskusikan atau tanyakan seputar kondisi kulit wajah atau perawatanmu?",
          },
        ]);
      }
    } catch (err) {
      if (err.status === 401) {
        setAuthNeeded(true);
        setMessages([
          {
            role: "assistant",
            content:
              "Silakan masuk ke akun SkinCheck kamu terlebih dahulu untuk berkonsultasi dengan asisten dan melihat riwayat kesehatan kulitmu.",
          },
        ]);
      } else if (err.code === "BACKEND_NOT_CONFIGURED") {
        setError(err);
      } else if (err.code === "BACKEND_UNREACHABLE") {
        setError(
          new Error("Tidak dapat menghubungi server backend. Pastikan server aktif.")
        );
      } else if (err.status === 503) {
        setError(
          new Error("Layanan database sedang tidak tersedia, silakan coba lagi beberapa saat lagi.")
        );
      } else {
        setError(err);
      }
    } finally {
      setInitialLoading(false);
    }
  }

  async function onSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await assistantChat(text);
      const aiReply =
        res && (res.response || res.reply || res.message || res.detail);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiReply || "Maaf, respon tidak dapat diproses saat ini.",
        },
      ]);
    } catch (err) {
      if (err.status === 401) {
        setAuthNeeded(true);
        setError(
          new Error("Sesi login kamu telah berakhir atau belum login. Silakan login terlebih dahulu.")
        );
      } else if (err.status === 503) {
        setError(
          new Error("Database sedang tidak tersedia. Data riwayat tidak dapat dimuat.")
        );
      } else if (err.status === 500) {
        setError(
          new Error("Layanan AI sedang dalam gangguan atau kunci API belum aktif.")
        );
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onClear() {
    setConfirmClear(false);
    try {
      await clearAssistantHistory();
      setMessages([
        {
          role: "assistant",
          content:
            "Riwayat percakapan telah dibersihkan. Ada yang ingin kamu tanyakan seputar kulit wajahmu?",
        },
      ]);
      toast.success("Riwayat percakapan telah dibersihkan.");
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="card chat-shell">
      <div className="chat-head">
        <div>
          <h1>Asisten SkinCheck (Luvenna)</h1>
          <p className="muted">
            Konsultasi kesehatan dan bimbingan perawatan kulit wajah terpercaya.
          </p>
        </div>
        {messages.length > 1 && (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="btn secondary sm"
          >
            Bersihkan Riwayat
          </button>
        )}
      </div>

      <ErrorBox error={error} />
      <ConfirmDialog
        open={confirmClear}
        title="Bersihkan riwayat?"
        message="Seluruh riwayat percakapan dengan asisten akan dihapus dan tidak bisa dikembalikan."
        confirmLabel="Ya, hapus riwayat"
        onConfirm={onClear}
        onCancel={() => setConfirmClear(false)}
      />

      {authNeeded && (
        <div className="notice chat-head" style={{ borderBottom: 0, marginBottom: 0 }}>
          <span>Kamu perlu masuk akun terlebih dahulu untuk menggunakan asisten.</span>
          <Link href="/login" className="btn sm">
            Masuk Akun
          </Link>
        </div>
      )}

      <div className="chat chat-scroll">
        {initialLoading ? (
          <p className="muted" style={{ textAlign: "center", padding: 20 }}>
            Memuat percakapan...
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.content}
            </div>
          ))
        )}
        {loading && (
          <div className="msg assistant" style={{ fontStyle: "italic", color: "var(--muted)" }}>
            Ven sedang mengetik...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={onSend} className="chat-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya soal kulit wajah, jerawat, atau riwayat scan..."
          disabled={loading || authNeeded}
        />
        <button className="btn" disabled={loading || !input.trim() || authNeeded}>
          {loading ? "Mengirim..." : "Kirim"}
        </button>
      </form>
    </div>
  );
}
