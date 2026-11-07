"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Calendar,
  Layers,
  X,
  Check,
  RefreshCw
} from "lucide-react";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deactivateAdminUser,
  pickObject,
  pickArray
} from "../../../lib/api";
import { fmtDate } from "../../../lib/scores";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";
import { useToast, ConfirmDialog } from "../../../components/Toast";

export default function AdminUsersPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null); // null | {id?, name, email, password, status}
  const [busy, setBusy] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
  const toast = useToast();

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const d = await getAdminUsers({ q, status, page: p, per_page: 10 });
      const obj = pickObject(d);
      setRows(pickArray(obj.users ?? d));
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
  }, [q, status]);

  const activeCount = useMemo(() => {
    return rows.filter((r) => r.status === "active").length;
  }, [rows]);

  const inactiveCount = useMemo(() => {
    return rows.filter((r) => r.status === "inactive" || r.status === "suspended").length;
  }, [rows]);

  if (denied) return <AdminDenied />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.id) {
        const body = { name: form.name, email: form.email, status: form.status };
        if (form.password) body.password = form.password;
        await updateAdminUser(form.id, body);
        toast.success("Data pengguna berhasil diperbarui.");
      } else {
        await createAdminUser({ name: form.name, email: form.email, password: form.password });
        toast.success("Akun customer baru berhasil dibuat.");
      }
      setForm(null);
      load(page);
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan akun pengguna.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeactivate() {
    const u = pendingDeactivate;
    if (!u) return;
    setPendingDeactivate(null);
    try {
      await deactivateAdminUser(u.id);
      toast.success(`Akun ${u.name} berhasil dinonaktifkan.`);
      load(page);
    } catch (err) {
      toast.error(err.message || "Gagal menonaktifkan akun.");
    }
  }

  return (
    <div className="admin-stage-container">
      {/* ── Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <div className="badge badge-amber" style={{ marginBottom: "6px" }}>
            <Users size={12} /> DIREKTORI PENGGUNA TERDAFTAR
          </div>
          <h1>Manajemen Pengguna & Customer</h1>
          <p>
            Otoritas akun sistem Laomera. Menonaktifkan akun menjaga integritas data riwayat analisis dan jejak audit database.
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
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setForm({ name: "", email: "", password: "", status: "active" })}
          >
            <UserPlus size={14} /> Tambah Customer
          </button>
        </div>
      </div>

      {/* ── KPI Telemetry Strip ── */}
      <div className="admin-stat-strip">
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-blue">
            <Users size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Akun Terdaftar</span>
            <span className="admin-stat-value">{total}</span>
            <span className="admin-stat-meta">Seluruh basis data</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-emerald">
            <UserCheck size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Halaman Ini Aktif</span>
            <span className="admin-stat-value">{activeCount}</span>
            <span className="admin-stat-meta">Status operasional</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-amber">
            <UserX size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Halaman Ini Inactive</span>
            <span className="admin-stat-value">{inactiveCount}</span>
            <span className="admin-stat-meta">Perlu perhatian</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrap stat-purple">
            <Layers size={20} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Indeks Halaman</span>
            <span className="admin-stat-value">{page} / {totalPages}</span>
            <span className="admin-stat-meta">10 akun per lembar</span>
          </div>
        </div>
      </div>

      {error && <ErrorBox error={error} />}

      {/* ── Form Create / Edit Modal Card ── */}
      {form && (
        <form onSubmit={onSubmit} className="admin-form-card">
          <div className="admin-form-header">
            <h3 className="admin-form-title">
              {form.id ? "Edit Otoritas Pengguna" : "Registrasi Akun Customer Baru"}
            </h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setForm(null)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="admin-form-grid-2">
            <div className="admin-field-group">
              <label className="admin-field-label">Nama Lengkap</label>
              <input
                className="admin-input-styled"
                placeholder="mis. dr. Sarah Wijaya"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <span className="admin-field-helper">Nama identitas resmi pengguna</span>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Alamat Email</label>
              <input
                className="admin-input-styled"
                placeholder="nama@domain.com"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <span className="admin-field-helper">Digunakan untuk otentikasi & pengiriman OTP</span>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Kata Sandi Akun</label>
              <input
                className="admin-input-styled"
                placeholder={form.id ? "Kosongkan jika tidak ingin mengubah sandi" : "Minimal 6 karakter kombinasi"}
                type="password"
                required={!form.id}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <span className="admin-field-helper">
                {form.id ? "Hanya diisi jika pengguna meminta reset kredensial" : "Wajib diisi untuk akun baru"}
              </span>
            </div>

            {form.id && (
              <div className="admin-field-group">
                <label className="admin-field-label">Status Akses Akun</label>
                <select
                  className="admin-input-styled"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active (Akses Normal)</option>
                  <option value="inactive">Inactive (Dinonaktifkan)</option>
                  <option value="suspended">Suspended (Ditangguhkan)</option>
                </select>
                <span className="admin-field-helper">Mengontrol izin masuk ke dalam platform</span>
              </div>
            )}
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? "Menyimpan ke Database…" : "Simpan Akun"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(null)}>
              Batalkan
            </button>
          </div>
        </form>
      )}

      {/* ── Filter & Search Toolbar ── */}
      <div className="admin-toolbar-card">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={15} className="search-icon" />
            <input
              placeholder="Cari berdasarkan nama atau email…"
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setQ(qDraft);
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setQ(qDraft)}
          >
            Terapkan
          </button>

          <select
            className="admin-filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Semua Status Akses</option>
            <option value="active">Status: Active</option>
            <option value="inactive">Status: Inactive</option>
            <option value="suspended">Status: Suspended</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Ditemukan <strong>{total}</strong> akun
          </span>
        </div>
      </div>

      {/* ── Data Table Card ── */}
      <div className="admin-table-card">
        <div className="admin-table-card-head">
          <div className="admin-table-card-title">
            <ShieldCheck size={18} color="var(--brand-navy)" />
            Daftar Otoritas Pengguna Terverifikasi
          </div>
          <span className="admin-table-card-subtitle">
            Halaman {page} dari {totalPages}
          </span>
        </div>

        {loading && rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Loading label="Mengambil direktori pengguna..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Users size={24} />
            </div>
            <h4 className="admin-empty-title">Tidak Ada Akun yang Cocok</h4>
            <p className="admin-empty-desc">
              Tidak ditemukan data pengguna untuk parameter pencarian saat ini. Silakan atur ulang kata kunci atau filter status.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setQDraft("");
                setQ("");
                setStatus("");
              }}
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Peran (Role)</th>
                  <th>Status Akses</th>
                  <th>Tanggal Terdaftar</th>
                  <th style={{ textAlign: "right" }}>Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const initial = (u.name || u.email || "U").charAt(0).toUpperCase();
                  const isInactive = u.status === "inactive" || u.status === "suspended";
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-identity-cell">
                          <div className="user-avatar-badge">{initial}</div>
                          <div>
                            <span className="user-name">{u.name || "Tanpa Nama"}</span>
                            <span className="user-email">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            background: u.role === "admin" ? "rgba(217, 136, 42, 0.12)" : "rgba(23, 32, 51, 0.06)",
                            color: u.role === "admin" ? "var(--brand-amber)" : "var(--brand-navy)"
                          }}
                        >
                          {u.role || "customer"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${u.status || "active"}`}>
                          <span className="status-dot" />
                          {u.status === "active" ? "Aktif" : u.status === "inactive" ? "Nonaktif" : u.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12.5px" }}>
                          <Calendar size={13} />
                          {fmtDate(u.created_at)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "5px 10px", fontSize: "12px" }}
                            onClick={() =>
                              setForm({
                                id: u.id,
                                name: u.name,
                                email: u.email,
                                password: "",
                                status: u.status
                              })
                            }
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          {!isInactive && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "5px 10px", fontSize: "12px", color: "var(--crimson-500)" }}
                              onClick={() => setPendingDeactivate(u)}
                            >
                              <UserX size={12} /> Nonaktifkan
                            </button>
                          )}
                        </div>
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

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Nonaktifkan akun pengguna?"
        message={
          pendingDeactivate
            ? `Nonaktifkan akun ${pendingDeactivate.name} (${pendingDeactivate.email})? Akun tidak dihapus dari basis data — status diubah menjadi inactive dan jejak riwayat scan tetap utuh.`
            : ""
        }
        confirmLabel="Ya, Nonaktifkan Akun"
        onConfirm={confirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}
