"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Terminal
} from "lucide-react";
import {
  getAdminLogs,
  pickObject,
  pickArray
} from "../../../lib/api";
import { fmtDate } from "../../../lib/scores";
import { ErrorBox, Loading } from "../../../components/Notice";
import WorkspaceLoadingScreen from "../../../components/WorkspaceLoadingScreen";
import AdminDenied from "../../../components/AdminDenied";

export default function AdminLogsPage() {
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const d = await getAdminLogs({ page: p, per_page: 20 });
      const obj = pickObject(d);
      setRows(pickArray(obj.logs ?? d));
      setTotalPages(obj.total_pages ?? 1);
      setPage(obj.page ?? p);
    } catch (e) {
      if (e.status === 401 || e.status === 403) setDenied(true);
      else setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (denied) return <AdminDenied />;

  const formatActivityBadge = (act) => {
    const text = String(act || "");
    const lower = text.toLowerCase();

    let bg = "rgba(15, 23, 42, 0.04)";
    let color = "var(--brand-navy)";

    if (lower.includes("login") || lower.includes("masuk")) {
      bg = "rgba(5, 150, 105, 0.08)";
      color = "#059669";
    } else if (lower.includes("logout") || lower.includes("keluar")) {
      bg = "rgba(100, 116, 139, 0.08)";
      color = "#64748B";
    } else if (lower.includes("update") || lower.includes("ubah") || lower.includes("edit")) {
      bg = "rgba(217, 136, 42, 0.1)";
      color = "var(--amber-700)";
    } else if (lower.includes("delete") || lower.includes("hapus") || lower.includes("nonaktif")) {
      bg = "rgba(220, 38, 38, 0.08)";
      color = "#DC2626";
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 500,
          background: bg,
          color: color
        }}
      >
        {text}
      </span>
    );
  };

  if (loading && rows.length === 0) {
    return <WorkspaceLoadingScreen caption="Memuat Log Aktivitas…" />;
  }

  return (
    <div className="admin-stage-container">
      {/* ── Page Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <h1>Log Aktivitas Sistem</h1>
          <p>
            Rekaman kronologis aksi administrator, otentikasi sesi, dan jejak audit database Laomera.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => load(page)}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Segarkan
          </button>
        </div>
      </div>

      {error && <ErrorBox error={error} />}

      {/* ── Unified Table Surface ── */}
      <div className="admin-table-card">
        {/* Seamless Toolbar */}
        <div className="admin-table-card-head">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal size={15} color="var(--brand-navy)" />
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--brand-navy)" }}>
              Jejak Audit Akses & Operasional
            </span>
          </div>

          <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            20 log per halaman
          </span>
        </div>

        {/* Table Content */}
        {loading && rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Loading label="Memuat log aktivitas..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <ScrollText size={22} />
            </div>
            <h4 className="admin-empty-title">Belum Ada Catatan Log</h4>
            <p className="admin-empty-desc">
              Belum ada aktivitas otentikasi atau perubahan konfigurasi yang tercatat dalam sistem.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Akun Administrator / Customer</th>
                  <th>Uraian Aktivitas</th>
                  <th style={{ textAlign: "right" }}>Alamat IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const initial = (l.user_name || l.user_email || "A").charAt(0).toUpperCase();

                  return (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                          <Clock size={12} />
                          {fmtDate(l.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="user-identity-cell">
                          <div className="user-avatar-badge">{initial}</div>
                          <div>
                            <span className="user-name">{l.user_name || "Sistem"}</span>
                            <span className="user-email">{l.user_email || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {formatActivityBadge(l.activity)}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: "11.5px",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "rgba(15, 23, 42, 0.04)",
                            color: "var(--brand-navy)"
                          }}
                        >
                          {l.ip_address || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Seamless Integrated Pagination Footer */}
        <div className="admin-pagination-bar">
          <span className="admin-pagination-summary">
            Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
          </span>
          <div className="admin-pagination-actions">
            <button
              type="button"
              className="admin-page-btn"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              <ChevronLeft size={13} /> Sebelumnya
            </button>
            <button
              type="button"
              className="admin-page-btn"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Berikutnya <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
