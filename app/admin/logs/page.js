"use client";
import { useEffect, useState } from "react";
import {
  getAdminLogs,
  pickObject,
  pickArray,
} from "../../../lib/api";
import { fmtDate } from "../../../lib/scores";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";

const thStyle = { textAlign: "left", padding: "10px 12px", fontSize: "12px", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" };
const tdStyle = { padding: "10px 12px", fontSize: "14px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top" };

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

  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  if (denied) return <AdminDenied />;
  if (loading && rows.length === 0) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px", textAlign: "center" }}>
          <Loading label="Memuat log…" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell-wrap">
      <div className="admin-hero-header">
        <h1 className="admin-page-title">Log Aktivitas</h1>
        <p className="admin-page-subtitle">
          Jejak aksi admin dan login/logout — terbaru dulu, 20 baris per halaman.
        </p>
      </div>

      {error && <ErrorBox error={error} />}

      <div className="glass-panel" style={{ padding: "8px 12px", overflowX: "auto" }}>
        {rows.length === 0 ? (
          <p className="muted" style={{ padding: "20px", textAlign: "center" }}>Belum ada log aktivitas.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
            <thead>
              <tr>
                <th style={thStyle}>Waktu</th>
                <th style={thStyle}>Pengguna</th>
                <th style={thStyle}>Aktivitas</th>
                <th style={thStyle}>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td style={tdStyle}>{fmtDate(l.created_at)}</td>
                  <td style={tdStyle}>
                    <strong>{l.user_name || "—"}</strong>
                    <div className="muted" style={{ fontSize: "12px" }}>{l.user_email || "—"}</div>
                  </td>
                  <td style={tdStyle}>{l.activity}</td>
                  <td style={tdStyle}>{l.ip_address || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
        <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => load(page - 1)}>← Sebelumnya</button>
        <span className="muted" style={{ fontSize: "13px" }}>Halaman {page} / {totalPages}</span>
        <button type="button" className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>Berikutnya →</button>
      </div>
    </div>
  );
}
