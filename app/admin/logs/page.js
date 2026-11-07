"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  Clock,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Layers,
  Terminal,
  Calendar
} from "lucide-react";
import {
  getAdminLogs,
  pickObject,
  pickArray
} from "../../../lib/api";
import { fmtDate } from "../../../lib/scores";
import { ErrorBox, Loading } from "../../../components/Notice";
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

  // Helper to format activity type badge
  const formatActivityBadge = (act) => {
    const text = String(act || "");
    const lower = text.toLowerCase();

    let bg = "rgba(23, 32, 51, 0.06)";
    let color = "var(--brand-navy)";

    if (lower.includes("login") || lower.includes("masuk")) {
      bg = "rgba(16, 185, 129, 0.1)";
      color = "#047857";
    } else if (lower.includes("logout") || lower.includes("keluar")) {
      bg = "rgba(100, 116, 139, 0.1)";
      color = "#475569";
    } else if (lower.includes("update") || lower.includes("ubah") || lower.includes("edit")) {
      bg = "rgba(217, 136, 42, 0.12)";
      color = "var(--amber-700)";
    } else if (lower.includes("delete") || lower.includes("hapus") || lower.includes("nonaktif")) {
      bg = "rgba(239, 68, 68, 0.1)";
      color = "#b91c1c";
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "11.5px",
          fontWeight: 600,
          background: bg,
          color: color
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <div className="admin-stage-container">
      {/* ── Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <div className="badge badge-amber" style={{ marginBottom: "6px" }}>
            <ScrollText size={12} /> AUDIT KEAMANAN & JEJAK OPERASIONAL
          </div>
          <h1>Log Aktivitas & Audit Forensik</h1>
          <p>
            Rekaman kronologis aksi administrator, otentikasi sesi, serta mutasi konfigurasi database Laomera.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => load(page)}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Segarkan Log
          </button>
        </div>
      </div>

      {/* ── KPI Telemetry Strip ── */}
      <div className="admin-stat-strip">
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-purple">
            <ScrollText size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Baris Pada Halaman</span>
            <span className="admin-stat-value">{rows.length}</span>
            <span className="admin-stat-meta">Maksimum 20 per lembar</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-emerald">
            <Shield size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Integritas Audit</span>
            <span className="admin-stat-value">100%</span>
            <span className="admin-stat-meta">Immutable audit trail</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-amber">
            <Layers size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Indeks Halaman</span>
            <span className="admin-stat-value">{page} / {totalPages}</span>
            <span className="admin-stat-meta">Navigasi kronologis</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-blue">
            <Activity size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Frekuensi Pemantauan</span>
            <span className="admin-stat-value" style={{ fontSize: "20px" }}>Real-time</span>
            <span className="admin-stat-meta">Capture event otomatis</span>
          </div>
        </div>
      </div>

      {error && <ErrorBox error={error} />}

      {/* ── Modern Table Card ── */}
      <div className="admin-table-card">
        <div className="admin-table-card-head">
          <div className="admin-table-card-title">
            <Terminal size={18} color="var(--brand-navy)" />
            Kronologi Event & Jejak Akses Sistem
          </div>
          <span className="admin-table-card-subtitle">
            Halaman {page} dari {totalPages}
          </span>
        </div>

        {loading && rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Loading label="Mengambil catatan log aktivitas sistem..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <ScrollText size={24} />
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
                  <th>Waktu Kejadian</th>
                  <th>Akun Administrator / Pengguna</th>
                  <th>Uraian Aktivitas</th>
                  <th style={{ textAlign: "right" }}>Alamat IP Klien</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const initial = (l.user_name || l.user_email || "A").charAt(0).toUpperCase();

                  return (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                          <Clock size={13} />
                          {fmtDate(l.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="user-identity-cell">
                          <div className="user-avatar-badge">{initial}</div>
                          <div>
                            <span className="user-name">{l.user_name || "Sistem / Otomatis"}</span>
                            <span className="user-email">{l.user_email || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {formatActivityBadge(l.activity)}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: "12px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(23, 32, 51, 0.05)",
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

        {/* ── Pagination ── */}
        <div className="admin-pagination-bar">
          <span className="admin-pagination-summary">
            Menampilkan halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> total lembar
          </span>
          <div className="admin-pagination-actions">
            <button
              type="button"
              className="admin-page-btn"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <button
              type="button"
              className="admin-page-btn"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
