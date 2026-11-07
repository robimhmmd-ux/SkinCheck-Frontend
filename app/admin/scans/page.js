"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminScans,
  pickObject,
  pickArray,
} from "../../../lib/api";
import { fmtDate, fmtScore } from "../../../lib/scores";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid var(--border-subtle)",
  background: "#fff",
  fontSize: "14px",
};
const thStyle = { textAlign: "left", padding: "10px 12px", fontSize: "12px", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" };
const tdStyle = { padding: "10px 12px", fontSize: "14px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top" };

const STATUS_LABEL = { completed: "Selesai", processing: "Diproses", failed: "Gagal" };

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

  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  if (denied) return <AdminDenied />;
  if (loading && rows.length === 0) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px", textAlign: "center" }}>
          <Loading label="Memuat audit scan…" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell-wrap">
      <div className="admin-hero-header">
        <h1 className="admin-page-title">Audit Scan</h1>
        <p className="admin-page-subtitle">
          {total} pemindaian dari semua pengguna, terbaru dulu. Kolom YOLO menampilkan "—" karena
          integrasi penanda jerawat YOLO belum masuk aplikasi — tidak ada koordinat yang dikarang.
        </p>
      </div>

      {error && <ErrorBox error={error} />}

      <div className="glass-panel" style={{ padding: "18px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <select style={{ ...inputStyle, maxWidth: "220px" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="completed">Selesai</option>
          <option value="processing">Diproses</option>
          <option value="failed">Gagal</option>
        </select>
        <p className="muted" style={{ fontSize: "13px", margin: 0 }}>
          Foto wajah tidak disajikan di halaman ini: backend API-only tidak menyediakan URL foto publik.
          Yang ditampilkan adalah metadata dan skor — bukan foto pengganti.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "8px 12px", overflowX: "auto" }}>
        {rows.length === 0 ? (
          <p className="muted" style={{ padding: "20px", textAlign: "center" }}>Belum ada pemindaian.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "820px" }}>
            <thead>
              <tr>
                <th style={thStyle}>Pemilik</th>
                <th style={thStyle}>Waktu</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Jerawat</th>
                <th style={thStyle}>Kering</th>
                <th style={thStyle}>Berminyak</th>
                <th style={thStyle}>Dark spots</th>
                <th style={thStyle}>Kerutan</th>
                <th style={thStyle}>Skor akhir</th>
                <th style={thStyle}>YOLO</th>
                <th style={thStyle}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const a = s.analysis || null;
                return (
                  <tr key={s.id}>
                    <td style={tdStyle}>
                      <strong>{s.owner?.name || "—"}</strong>
                      <div className="muted" style={{ fontSize: "12px" }}>{s.owner?.email || "—"}</div>
                    </td>
                    <td style={tdStyle}>{fmtDate(s.created_at)}</td>
                    <td style={tdStyle}><span className="badge badge-navy">{STATUS_LABEL[s.status] || s.status}</span></td>
                    <td style={tdStyle}>{a ? fmtScore(a.acne_score) : "—"}</td>
                    <td style={tdStyle}>{a ? fmtScore(a.dry_skin_score) : "—"}</td>
                    <td style={tdStyle}>{a ? fmtScore(a.oily_skin_score) : "—"}</td>
                    <td style={tdStyle}>{a ? fmtScore(a.dark_spots_score) : "—"}</td>
                    <td style={tdStyle}>{a ? fmtScore(a.wrinkles_score) : "—"}</td>
                    <td style={tdStyle}><strong>{a ? fmtScore(a.overall_score) : "—"}</strong></td>
                    <td style={tdStyle}>—</td>
                    <td style={tdStyle}>
                      <Link href={`/history/${s.id}`} className="btn btn-secondary btn-sm">Lihat</Link>
                    </td>
                  </tr>
                );
              })}
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
