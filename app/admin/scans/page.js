"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Scan,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
  Flame,
  Droplets,
  Zap,
  Sun
} from "lucide-react";
import {
  getAdminScans,
  pickObject,
  pickArray
} from "../../../lib/api";
import { fmtDate, fmtScore } from "../../../lib/scores";
import { ErrorBox, Loading } from "../../../components/Notice";
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

  const completedCount = useMemo(() => {
    return rows.filter((r) => r.status === "completed").length;
  }, [rows]);

  const processingCount = useMemo(() => {
    return rows.filter((r) => r.status === "processing").length;
  }, [rows]);

  const failedCount = useMemo(() => {
    return rows.filter((r) => r.status === "failed").length;
  }, [rows]);

  if (denied) return <AdminDenied />;

  // Helper to render score pill with clinical color coding
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

  return (
    <div className="admin-stage-container">
      {/* ── Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <div className="badge badge-amber" style={{ marginBottom: "6px" }}>
            <Scan size={12} /> AUDIT ANALISIS DERMATOLOGI
          </div>
          <h1>Audit Pemindaian & Deteksi Klinis AI</h1>
          <p>
            Log verifikasi seluruh hasil inferensi pipeline VGG16 multi-output dari foto kulit pengguna secara real-time.
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

      {/* ── KPI Telemetry Strip ── */}
      <div className="admin-stat-strip">
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-purple">
            <Scan size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Audit Scan</span>
            <span className="admin-stat-value">{total}</span>
            <span className="admin-stat-meta">Seluruh pemindaian</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Selesai Dianalisis</span>
            <span className="admin-stat-value">{completedCount}</span>
            <span className="admin-stat-meta">Halaman saat ini</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-amber">
            <Clock size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Dalam Pemrosesan</span>
            <span className="admin-stat-value">{processingCount}</span>
            <span className="admin-stat-meta">Pipeline komputasi</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-blue">
            <AlertTriangle size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Gagal / Ditolak</span>
            <span className="admin-stat-value">{failedCount}</span>
            <span className="admin-stat-meta">Kualitas citra / timeout</span>
          </div>
        </div>
      </div>

      {/* ── Clinical Integrity Banner ── */}
      <div
        style={{
          background: "rgba(23, 32, 51, 0.03)",
          border: "1px solid var(--border-light, #e2e8f0)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px"
        }}
      >
        <Info size={18} color="var(--brand-amber)" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-body)" }}>
          <strong>Integritas Privasi Medis:</strong> Berkas foto wajah tidak disimpan secara publik demi kepatuhan regulasi data kesehatan. Backend menyajikan metadata, bobot output 5 kondisi, dan skor kesehatan kulit secara murni tanpa manipulasi koordinat.
        </p>
      </div>

      {error && <ErrorBox error={error} />}

      {/* ── Filter & Search Toolbar ── */}
      <div className="admin-toolbar-card">
        <div className="admin-toolbar-left">
          <select
            className="admin-filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Semua Status Audit</option>
            <option value="completed">Status: Selesai Dianalisis</option>
            <option value="processing">Status: Dalam Pemrosesan</option>
            <option value="failed">Status: Gagal / Anomali</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Ditemukan <strong>{total}</strong> catatan audit
          </span>
        </div>
      </div>

      {/* ── Data Table Card ── */}
      <div className="admin-table-card">
        <div className="admin-table-card-head">
          <div className="admin-table-card-title">
            <Scan size={18} color="var(--brand-navy)" />
            Log Riwayat Pemindaian & Analisis VGG16
          </div>
          <span className="admin-table-card-subtitle">
            Halaman {page} dari {totalPages}
          </span>
        </div>

        {loading && rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Loading label="Mengambil catatan audit pemindaian..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Scan size={24} />
            </div>
            <h4 className="admin-empty-title">Belum Ada Riwayat Pemindaian</h4>
            <p className="admin-empty-desc">
              Belum ditemukan data pemindaian untuk kriteria status yang dipilih saat ini.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pemilik Scan</th>
                  <th>Waktu Deteksi</th>
                  <th>Status</th>
                  <th title="Tingkat Kerentanan Jerawat">Jerawat</th>
                  <th title="Tingkat Dehidrasi Kulit">Kering</th>
                  <th title="Tingkat Produksi Sebum">Minyak</th>
                  <th title="Klaster Melanin & Noda Hitam">Dark Spots</th>
                  <th title="Garis Halus & Elastisitas">Kerutan</th>
                  <th>Skor Akhir</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const a = s.analysis || null;
                  const ownerName = s.owner?.name || "Pengguna";
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
                        <span style={{ fontSize: "12.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
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
                              fontSize: "15px",
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
                          style={{ padding: "5px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={12} /> Detail
                        </Link>
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
