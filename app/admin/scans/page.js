"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Scan,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Info
} from "lucide-react";
import {
  getAdminScans,
  pickObject,
  pickArray
} from "../../../lib/api";
import { fmtDate, fmtScore } from "../../../lib/scores";
import { ErrorBox, Loading } from "../../../components/Notice";
import WorkspaceLoadingScreen from "../../../components/WorkspaceLoadingScreen";
import AdminDenied from "../../../components/AdminDenied";

const STATUS_LABEL = {
  completed: "Selesai",
  processing: "Diproses",
  failed: "Gagal"
};

export default function AdminScansPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const d = await getAdminScans({ status, page: p, per_page: 10 });
      const obj = pickObject(d);
      setRows(pickArray(obj.scans ?? d));
      setTotal(obj.total ?? 0);
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
  }, [status]);

  if (denied) return <AdminDenied />;

  const renderScorePill = (val) => {
    if (val === undefined || val === null) return <span style={{ color: "var(--text-muted)" }}>—</span>;
    const num = Number(val);
    let variant = "healthy";
    if (num >= 60) variant = "high";
    else if (num >= 35) variant = "moderate";

    return (
      <span className={`score-pill score-${variant}`}>
        {fmtScore(val)}
      </span>
    );
  };

  if (loading && rows.length === 0) {
    return <WorkspaceLoadingScreen caption="Memuat Audit Pemindaian…" />;
  }

  return (
    <div className="admin-stage-container">
      {/* ── Page Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <h1>Audit Pemindaian Wajah</h1>
          <p>
            {total} pemindaian terekam • Log verifikasi inferensi 5 parameter kondisi kulit VGG16 dari seluruh customer.
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

      {/* ── Subtle Integrity Notice ── */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.28)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.45)",
          borderRadius: "16px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.6)"
        }}
      >
        <Info size={16} color="#071236" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: "13px", color: "#071236" }}>
          <strong>Integritas Medis:</strong> Berkas foto wajah dilindungi privasi data kesehatan. Backend menyajikan metadata, bobot 5 model VGG, dan skor kesehatan kulit secara murni.
        </span>
      </div>

      {error && <ErrorBox error={error} />}

      {/* ── Unified Table Surface ── */}
      <div className="admin-table-card">
        {/* Seamless Toolbar */}
        <div className="admin-table-card-head">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="admin-filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua Status Audit</option>
              <option value="completed">Status: Selesai</option>
              <option value="processing">Status: Diproses</option>
              <option value="failed">Status: Gagal</option>
            </select>
          </div>

          <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            Total <strong>{total}</strong> sesi scan
          </span>
        </div>

        {/* Table Content */}
        {loading && rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Loading label="Memuat audit pemindaian..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Scan size={22} />
            </div>
            <h4 className="admin-empty-title">Belum Ada Riwayat Pemindaian</h4>
            <p className="admin-empty-desc">
              Belum ditemukan data scan untuk kriteria status yang dipilih saat ini.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Waktu Scan</th>
                  <th>Status</th>
                  <th>Jerawat</th>
                  <th>Kering</th>
                  <th>Minyak</th>
                  <th>Spots</th>
                  <th>Kerutan</th>
                  <th>Skor</th>
                  <th style={{ textAlign: "right" }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const a = s.analysis || null;
                  const ownerName = s.owner?.name || "Customer";
                  const ownerEmail = s.owner?.email || "—";
                  const initial = ownerName.charAt(0).toUpperCase();

                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="user-identity-cell">
                          <div className="user-avatar-badge">{initial}</div>
                          <div>
                            <span className="user-name">{ownerName}</span>
                            <span className="user-email">{ownerEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "12.5px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                          {fmtDate(s.created_at)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${s.status || "completed"}`}>
                          <span className="status-dot" />
                          {STATUS_LABEL[s.status] || s.status}
                        </span>
                      </td>
                      <td>{a ? renderScorePill(a.acne_score) : "—"}</td>
                      <td>{a ? renderScorePill(a.dry_skin_score) : "—"}</td>
                      <td>{a ? renderScorePill(a.oily_skin_score) : "—"}</td>
                      <td>{a ? renderScorePill(a.dark_spots_score) : "—"}</td>
                      <td>{a ? renderScorePill(a.wrinkles_score) : "—"}</td>
                      <td>
                        {a ? (
                          <span
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "var(--brand-navy)"
                            }}
                          >
                            {fmtScore(a.overall_score)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <Link
                          href={`/history/${s.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={12} /> Buka
                        </Link>
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
