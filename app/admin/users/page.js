"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Calendar,
  X,
  RefreshCw,
  UserX,
  Eye,
  EyeOff
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
import WorkspaceLoadingScreen from "../../../components/WorkspaceLoadingScreen";
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
  const [showPassword, setShowPassword] = useState(false);
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
      toast.success(`Akun ${u.name} dinonaktifkan.`);
      load(page);
    } catch (err) {
      toast.error(err.message || "Gagal menonaktifkan akun.");
    }
  }

  if (loading && rows.length === 0) {
    return <WorkspaceLoadingScreen caption="Memuat Data Pengguna…" />;
  }

  return (
    <div className="admin-stage-container">
      {/* ── Page Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <h1>Manajemen Pengguna</h1>
          <p>
            {total} akun terdaftar • Mengelola hak akses dan status customer tanpa menghapus riwayat analisis.
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

      {error && <ErrorBox error={error} />}

      {/* ── Form Modal / Inline Card ── */}
      {form && (
        <form onSubmit={onSubmit} className="admin-form-card">
          <div className="admin-form-header">
            <h3 className="admin-form-title">
              {form.id ? "Edit Pengguna" : "Tambah Customer Baru"}
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
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Kata Sandi</label>
              <div className="password-field">
                <input
                  className="admin-input-styled"
                  placeholder={form.id ? "Kosongkan jika tidak ingin mengubah sandi" : "Minimal 6 karakter"}
                  type={showPassword ? "text" : "password"}
                  required={!form.id}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {form.id && (
              <div className="admin-field-group">
                <label className="admin-field-label">Status Akun</label>
                <select
                  className="admin-input-styled"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active (Normal)</option>
                  <option value="inactive">Inactive (Nonaktif)</option>
                  <option value="suspended">Suspended (Ditangguhkan)</option>
                </select>
              </div>
            )}
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan Akun"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(null)}>
              Batal
            </button>
          </div>
        </form>
      )}

      {/* ── Unified Table Surface (Toolbar + Table + Pagination in ONE Card) ── */}
      <div className="admin-table-card">
        {/* Seamless Integrated Toolbar */}
        <div className="admin-table-card-head">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "420px" }}>
            <div className="admin-search-box" style={{ width: "100%", maxWidth: "100%" }}>
              <Search size={14} className="search-icon" />
              <input
                placeholder="Cari nama atau email…"
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
              Cari
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="admin-filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive (termasuk belum verifikasi)</option>
              <option value="suspended">Suspended</option>
            </select>
            <span style={{ fontSize: "12.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Total <strong>{total}</strong> akun
            </span>
          </div>
        </div>

        {/* Table Content */}
        {loading && rows.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Loading label="Memuat pengguna..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Users size={22} />
            </div>
            <h4 className="admin-empty-title">Tidak Ada Pengguna yang Cocok</h4>
            <p className="admin-empty-desc">
              Tidak ditemukan data pengguna untuk parameter pencarian saat ini.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Peran</th>
                  <th>Status</th>
                  <th>Terdaftar</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
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
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            background: u.role === "admin" ? "rgba(217, 136, 42, 0.12)" : "rgba(15, 23, 42, 0.05)",
                            color: u.role === "admin" ? "var(--amber-700)" : "var(--brand-navy)"
                          }}
                        >
                          {u.role || "customer"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${u.status === "awaiting_biodata" ? "pending" : u.status || "active"}`}>
                          <span className="status-dot" />
                          {u.status === "active" ? "Aktif"
                            : u.status === "inactive" ? "Nonaktif"
                            : u.status === "pending" ? "Belum verifikasi"
                            : u.status === "awaiting_biodata" ? "Biodata belum lengkap"
                            : u.status === "suspended" ? "Ditangguhkan"
                            : u.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "12.5px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                          {fmtDate(u.created_at)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 10px", fontSize: "12px" }}
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
                              style={{ padding: "4px 10px", fontSize: "12px", color: "var(--crimson-500)" }}
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

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Nonaktifkan akun pengguna?"
        message={
          pendingDeactivate
            ? `Nonaktifkan akun ${pendingDeactivate.name} (${pendingDeactivate.email})? Akun tidak dihapus dari basis data dan riwayat tetap utuh.`
            : ""
        }
        confirmLabel="Ya, Nonaktifkan Akun"
        onConfirm={confirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}
