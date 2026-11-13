"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  Send,
  X,
  Minus,
  Trash2,
  Sparkles,
  User,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import {
  assistantChat,
  getAssistantHistory,
  clearAssistantHistory,
  getMe,
  pickUser,
  pickArray,
} from "../lib/api";
import { useToast } from "./Toast";
import { renderChatInline } from "./ChatText";
import { fmtTime } from "../lib/scores";

const QUICK_INQUIRIES = [
  "🌟 Rutin Skincare Pagi & Malam",
  "💧 Atasi Kulit Kering & Dehidrasi",
  "✨ Rekomendasi Kandungan Jerawat",
  "☀️ Cara Mengurangi Dark Spots",
  "🔍 Panduan Membaca Skor Scan",
];

// Saran cepat khusus admin: skincare diganti pertanyaan soal database,
// karena chatbot admin membaca seluruh data website (bukan data pribadi).
const ADMIN_QUICK_INQUIRIES = [
  "👥 Berapa total pengguna?",
  "🔍 Scan terbaru dari siapa?",
  "📦 Produk apa saja di katalog?",
  "📈 Tren masalah kulit pengguna?",
  "🕒 Aktivitas terakhir di website?",
];

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const pathname = usePathname();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();

  // 1. Session check: Only show floating widget when logged in or in workspace
  useEffect(() => {
    let alive = true;
    getMe()
      .then((d) => {
        if (alive) setUser(pickUser(d));
      })
      .catch(() => {
        if (alive) setUser(null);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  // 2. (Dulu: chat otomatis TUTUP saat pindah ke /profile atau /settings.
  // 2026-11-13 roboy membalikkan: Laomera Asisten harus ada di SEMUA
  // halaman, pojok kanan bawah — jadi penutup otomatis itu dihapus.)

  // 3. Listen to external events (e.g., clicking "Konsultasi AI" or "Asisten AI" anywhere in app)
  useEffect(() => {
    function handleOpenChat() {
      setIsOpen(true);
    }
    window.addEventListener("open-laomera-chat", handleOpenChat);
    window.addEventListener("open-skincheck-chat", handleOpenChat);

    // Also check URL parameter ?openChat=1
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("openChat") === "1") {
        setIsOpen(true);
      }
    }

    return () => {
      window.removeEventListener("open-laomera-chat", handleOpenChat);
      window.removeEventListener("open-skincheck-chat", handleOpenChat);
    };
  }, [pathname]);

  // 3b. Hapus percakapan saat logout (roboy 2026-11-12): handler logout
  // (SiteHeader + sidebar) dispatch event "laomera-chat-clear" setelah
  // menghapus riwayat di backend. Widget mereset pesan + status load dan
  // menutup chat, supaya percakapan lama tidak muncul lagi saat login
  // kembali (widget ini hidup di root layout, jadi state-nya bertahan
  // melewati navigasi/logout kalau tidak direset).
  useEffect(() => {
    function handleClearChat() {
      setMessages([]);
      setInitialLoaded(false);
      setIsOpen(false);
    }
    window.addEventListener("laomera-chat-clear", handleClearChat);
    return () => window.removeEventListener("laomera-chat-clear", handleClearChat);
  }, []);

  // 4. Auto scroll to latest message when open or when message arrives
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages, loading]);

  // 5. Load history on first open
  useEffect(() => {
    if (isOpen && !initialLoaded && user) {
      loadHistory();
    }
  }, [isOpen, user, initialLoaded]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await getAssistantHistory();
      const list = pickArray(res);
      if (list && list.length > 0) {
        setMessages(
          list.map((m) => ({
            role: m.role || "assistant",
            content: m.content || m.text || "",
            // Jam dari created_at (UTC) yang dikonversi ke waktu lokal,
            // bukan field time mentah backend yang masih jam UTC.
            time: m.created_at ? fmtTime(m.created_at) : (m.time || ""),
          }))
        );
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "Halo! Aku Laomera Asisten, asisten dermatologi AI pribadimu. Ada yang ingin kamu konsultasikan seputar kondisi kulit, rekomendasi skincare, atau panduan hasil scan wajahmu?",
          },
        ]);
      }
      setInitialLoaded(true);
    } catch {
      // Fallback greeting if history fails
      setMessages([
        {
          role: "assistant",
          content:
            "Halo! Aku Laomera Asisten, asisten dermatologi AI pribadimu. Ada yang ingin kamu konsultasikan seputar kondisi kulit, rekomendasi skincare, atau panduan hasil scan wajahmu?",
        },
      ]);
      setInitialLoaded(true);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function onSend(e, customPrompt) {
    if (e) e.preventDefault();
    const text = (customPrompt || input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const res = await assistantChat(text);
      const reply =
        // Backend /assistant/chat mengembalikan { response }, bukan reply /
        // message / content — field itu harus dibaca dulu, kalau tidak
        // setiap balasan baru jatuh ke pesan fallback di bawah.
        res?.response ||
        res?.reply ||
        res?.message ||
        res?.content ||
        "Maaf, asisten belum dapat memproses jawaban saat ini. Coba tanyakan kembali.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      if (err.status === 403 && err.message) {
        // Backend menolak (akun belum verifikasi OTP / bukan customer):
        // tampilkan alasan ASLI dari backend, bukan "Koneksi terputus".
        // Kalau penolakannya soal OTP, dorong juga lewat notifikasi toast.
        if (/otp|verifik/i.test(err.message)) {
          toast.info(
            "AYO VERIFIKASI KODE OTP dan nikmati keseluruhan akses teknologi yang ada.",
            "Verifikasi Akun"
          );
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: err.message },
        ]);
      } else {
        const msg =
          err.status === 401
            ? "Sesi login kamu telah berakhir. Silakan masuk kembali untuk melanjutkan obrolan."
            : "Koneksi terputus. Pastikan backend terhubung dan coba kirim ulang.";
        setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
    try {
      await clearAssistantHistory();
      setMessages([
        {
          role: "assistant",
          content: "Riwayat obrolan telah dibersihkan. Apa yang ingin kamu tanyakan hari ini?",
        },
      ]);
      toast.success("Riwayat obrolan telah dibersihkan.");
    } catch {
      setMessages([
        {
          role: "assistant",
          content: "Riwayat obrolan telah dibersihkan. Apa yang ingin kamu tanyakan hari ini?",
        },
      ]);
      toast.success("Riwayat obrolan telah dibersihkan.");
    }
  }

  // Determine visibility:
  // Visible if user is logged in (or on workspace routes like /dashboard, /scan, /output, /history, /marketplace).
  // Sejak 2026-11-13: widget tampil di SEMUA halaman saat login, termasuk
  // /profile dan /settings — tidak ada lagi pengecualian rute.
  const isAuthPage = pathname && (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/verify-otp"));
  const isWorkspace = pathname && (pathname.startsWith("/dashboard") || pathname.startsWith("/scan") || pathname.startsWith("/output") || pathname.startsWith("/history") || pathname.startsWith("/marketplace"));

  const shouldRender = !isAuthPage && (Boolean(user) || isWorkspace);
  const isAdmin = user?.role === "admin";
  const quickInquiries = isAdmin ? ADMIN_QUICK_INQUIRIES : QUICK_INQUIRIES;

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {/* ── 1. FLOATING POP-UP CHAT WINDOW ── */}
      <div
        className={`floating-chat-window ${isOpen ? "open" : "closed"}`}
        role="dialog"
        aria-label="Konsultasi Asisten AI"
        aria-hidden={!isOpen}
      >
        {/* Window Top Header */}
        <div className="floating-chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">
              <Bot size={20} />
              <span className="chat-avatar-online-dot" />
            </div>
            <div>
              <h3 className="chat-header-title">Laomera Asisten</h3>
              <p className="chat-header-subtitle">
                {isAdmin ? "Asisten Admin · Data Website Siap Ditanya" : "Dermatologi AI Cerdas · Siap Membantu"}
              </p>
            </div>
          </div>

          <div className="chat-header-actions">
            {messages.length > 1 && (
              <button
                type="button"
                className="chat-header-btn"
                onClick={handleClearHistory}
                title="Hapus riwayat obrolan"
                aria-label="Hapus riwayat obrolan"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              type="button"
              className="chat-header-btn"
              onClick={() => setIsOpen(false)}
              title="Ciutkan obrolan"
              aria-label="Ciutkan obrolan"
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              className="chat-header-btn"
              onClick={() => setIsOpen(false)}
              title="Tutup obrolan"
              aria-label="Tutup obrolan"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="floating-chat-messages">
          {historyLoading && (
            <div className="chat-mini-loader">
              <div className="loader-spinner-sm" />
              <span>Memuat percakapan…</span>
            </div>
          )}

          {messages.map((m, idx) => {
            const isBot = m.role === "assistant";
            return (
              <div
                key={idx}
                className={`floating-msg-row ${isBot ? "bot-msg" : "user-msg"}`}
              >
                {isBot && (
                  <div className="floating-msg-avatar" aria-hidden="true">
                    <Bot size={15} />
                  </div>
                )}
                <div className="floating-msg-bubble">
                  <div className="floating-msg-sender">
                    <strong>{isBot ? "Laomera Asisten" : "Kamu"}</strong>
                    {m.time && <span className="floating-msg-time">{m.time}</span>}
                  </div>
                  <div className="floating-msg-text">
                    {m.content.split("\n").map((line, lIdx) => (
                      <p key={lIdx} style={{ margin: "0 0 4px" }}>
                        {isBot ? renderChatInline(line, `m${idx}-${lIdx}`) : line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="floating-msg-row bot-msg">
              <div className="floating-msg-avatar">
                <Bot size={15} />
              </div>
              <div className="floating-msg-bubble">
                <div className="chat-typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} style={{ height: "1px" }} />
        </div>

        {/* Quick Inquiry Chips */}
        <div className="floating-chat-chips-scroll" role="region" aria-label="Pertanyaan Cepat">
          {quickInquiries.map((q) => (
            <button
              key={q}
              type="button"
              className="floating-chip-item"
              onClick={() => onSend(null, q.replace(/^[^\w\s]+/, "").trim())}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Composer Input */}
        <form onSubmit={onSend} className="floating-chat-composer">
          <input
            ref={inputRef}
            type="text"
            className="floating-chat-input"
            placeholder={isAdmin ? "Tanya soal pengguna, scan, produk, data website..." : "Tanyakan seputar kulit, skincare, skor scan..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            aria-label="Tulis pesan untuk asisten AI"
          />
          <button
            type="submit"
            className="floating-chat-send-btn"
            disabled={!input.trim() || loading}
            aria-label="Kirim pesan"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* ── 2. ROUND FLOATING LAUNCHER LOGO BUTTON (LOGO BULAT MELAYANG) ── */}
      <button
        type="button"
        className={`floating-chat-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Tutup Konsultasi AI" : "Buka Konsultasi AI"}
        aria-expanded={isOpen}
      >
        <span className="floating-trigger-pulse" aria-hidden="true" />
        <div className="floating-trigger-inner">
          {isOpen ? (
            <X size={24} className="floating-trigger-icon" />
          ) : (
            <Bot size={26} className="floating-trigger-icon" />
          )}
        </div>
        <span className="floating-trigger-badge" aria-hidden="true">
          <Sparkles size={11} />
        </span>
        <span className="floating-trigger-tooltip">
          {isOpen ? "Tutup Asisten" : "Tanya Laomera Asisten"}
        </span>
      </button>
    </>
  );
}

