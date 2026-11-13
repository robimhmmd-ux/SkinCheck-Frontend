"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  MessageCircleQuestion,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAdminChats,
  getAdminChatDetail,
  getAdminChatTrends,
  pickObject,
  pickArray,
} from "../../../lib/api";
import { fmtDateShort, fmtTime } from "../../../lib/scores";
import { ErrorBox } from "../../../components/Notice";
import WorkspaceLoadingScreen from "../../../components/WorkspaceLoadingScreen";
import AdminDenied from "../../../components/AdminDenied";

function trunc(text, n = 90) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

export default function AdminChatsPage() {
  const [trends, setTrends] = useState(null);
  const [chats, setChats] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled([
      getAdminChatTrends(),
      getAdminChats({ q, page, per_page: 10 }),
    ])
      .then(([t, c]) => {
        if (!alive) return;
        if (t.status === "fulfilled") setTrends(pickObject(t.value));
        if (c.status === "fulfilled") {
          const d = pickObject(c.value);
          setChats(pickArray(d.chats));
          setTotalPages(d.total_pages || 1);
        } else if (c.reason?.status === 401 || c.reason?.status === 403) {
          setDenied(true);
        } else {
          setError(c.reason);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, q]);

  async function openChat(chat) {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const d = pickObject(await getAdminChatDetail(chat.user_id));
      setSelected({
        user: d.user || chat,
        messages: pickArray(d.messages),
        total: d.total || 0,
      });
    } catch (e) {
      setDetailError(e);
    } finally {
      setDetailLoading(false);
    }
  }

  if (denied) return <AdminDenied />;

  if (loading) {
    return <WorkspaceLoadingScreen caption="Memuat obrolan customer…" />;
  }

  if (error || !trends) {
    return (
      <div className="admin-stage-container" style={{ textAlign: "center", padding: "48px 20px" }}>
        <div className="admin-glass-card" style={{ maxWidth: "480px", margin: "0 auto", padding: "36px" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginBottom: "8px" }}>
            Gagal Memuat Obrolan Customer
          </h2>
          <ErrorBox error={error} />
        </div>
      </div>
    );
  }

  const topQuestions = Array.isArray(trends.top_questions) ? trends.top_questions : [];

  return (
    <div className="admin-stage-container">
      {/* ── Page Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <h1>Obrolan Customer</h1>
          <p>
            Pantau pertanyaan customer ke Laomera Asisten — buka percakapan satu customer untuk
            membantu yang kebingungan, dan lihat pertanyaan tersering sebagai bahan update ke depan.
            Total {trends.total_user_messages || 0} pertanyaan dari {trends.total_chatters || 0} customer.
          </p>
        </div>
      </div>

      {selected ? (
        /* ── Detail percakapan satu customer ── */
        <div className="admin-glass-card">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="btn secondary"
            style={{ marginBottom: "16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={15} /> Kembali ke daftar
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "var(--brand-navy)",
                color: "var(--sunflower-yellow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {(selected.user?.name || "?").trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--brand-navy)", fontSize: "15px" }}>
                {selected.user?.name || "Customer"}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                {selected.user?.email || ""} • {selected.total} pesan
              </div>
            </div>
          </div>

          {detailLoading ? (
            <p className="muted" style={{ textAlign: "center", padding: "24px 0" }}>
              Memuat riwayat chat…
            </p>
          ) : detailError ? (
            <ErrorBox error={detailError} />
          ) : selected.messages.length === 0 ? (
            <p className="muted" style={{ textAlign: "center", padding: "24px 0" }}>
              Customer ini belum pernah chat dengan asisten.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selected.messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    style={{
                      maxWidth: "80%",
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      background: isUser ? "var(--brand-navy)" : "rgba(255, 255, 255, 0.85)",
                      color: isUser ? "#ffffff" : "var(--brand-navy)",
                      border: isUser ? "none" : "1px solid rgba(7, 18, 54, 0.08)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.7, marginBottom: "3px" }}>
                      {isUser ? "Customer" : "Laomera Asisten"}
                    </div>
                    {m.content}
                    <div style={{ fontSize: "10.5px", opacity: 0.6, marginTop: "5px", textAlign: "right" }}>
                      {m.created_at ? fmtTime(m.created_at) : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="muted" style={{ fontSize: "12px", marginTop: "18px", marginBottom: 0 }}>
            Riwayat ini hanya bisa dibaca admin — dipakai untuk membantu customer yang
            kebingungan dan menganalisis pertanyaan yang sering muncul.
          </p>
        </div>
      ) : (
        <>
          {/* ── Pertanyaan tersering ── */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <MessageCircleQuestion size={16} color="var(--brand-navy)" />
                Pertanyaan yang Paling Sering Ditanyakan
              </div>
              <span className="admin-card-badge">Dari riwayat chat customer</span>
            </div>

            {topQuestions.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: "13.5px" }}>
                Belum ada customer yang chat dengan asisten, jadi belum ada tren pertanyaan.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {topQuestions.map((t, i) => (
                  <div
                    key={`${t.question}-${i}`}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "#ffffff",
                      border: "1px solid rgba(15, 23, 42, 0.06)",
                    }}
                  >
                    <span
                      style={{
                        minWidth: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: i === 0 ? "var(--sunflower-yellow)" : "var(--brand-navy)",
                        color: i === 0 ? "var(--brand-navy)" : "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--brand-navy)", lineHeight: 1.5 }}>
                        “{t.question}”
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                        Ditanyakan oleh {Array.isArray(t.asked_by) && t.asked_by.length > 0 ? t.asked_by.join(", ") : "customer"}
                        {t.last_asked_at ? ` • terakhir ${fmtDateShort(t.last_asked_at)}` : ""}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "3px 9px",
                        borderRadius: "999px",
                        background: "rgba(7, 18, 54, 0.06)",
                        color: "var(--brand-navy)",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.count}×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Daftar customer yang pernah chat ── */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <MessageSquare size={16} color="var(--brand-navy)" />
                Obrolan Customer Terbaru
              </div>
              <span className="admin-card-badge">Klik untuk baca riwayatnya</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setQ(searchInput.trim());
              }}
              style={{ display: "flex", gap: "8px", marginBottom: "14px" }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={15}
                  style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nama atau email customer…"
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 34px",
                    borderRadius: "10px",
                    border: "1px solid rgba(7, 18, 54, 0.14)",
                    fontSize: "13.5px",
                    color: "var(--brand-navy)",
                    background: "rgba(255, 255, 255, 0.85)",
                  }}
                />
              </div>
              <button type="submit" className="btn primary" style={{ padding: "9px 16px" }}>
                Cari
              </button>
            </form>

            {chats.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontSize: "13.5px", textAlign: "center", padding: "20px 0" }}>
                {q ? "Tidak ada customer yang cocok dengan pencarian." : "Belum ada customer yang chat dengan asisten."}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {chats.map((c) => (
                  <button
                    key={c.user_id}
                    type="button"
                    onClick={() => openChat(c)}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      textAlign: "left",
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "#ffffff",
                      border: "1px solid rgba(15, 23, 42, 0.06)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "var(--brand-navy)",
                        color: "var(--sunflower-yellow)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(c.name || "?").trim().charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "baseline" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--brand-navy)" }}>
                          {c.name}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {c.last_message_at ? fmtDateShort(c.last_message_at) : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {c.email} • {c.total_messages} pesan
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--brand-navy)", marginTop: "3px", lineHeight: 1.45 }}>
                        {c.last_message_role === "user" ? "Customer: " : "Asisten: "}
                        {trunc(c.last_message, 110)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={15} /> Sebelumnya
                </button>
                <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Berikutnya <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
