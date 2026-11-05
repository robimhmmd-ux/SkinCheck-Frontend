"use client";
import { useEffect, useState } from "react";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deactivateAdminUser,
  pickObject,
  pickArray,
} from "../../../lib/api";
import { fmtDate } from "../../../lib/scores";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";
import { useToast } from "../../../components/Toast";

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

  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, status]);

  if (denied) return <AdminDenied />;
  if (loading && rows.length === 0) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px", textAlign: "center" }}>
          <Loading label="Memuat pengguna…" />
        </div>
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.id) {
        const body = { name: form.name, email: form.email, status: form.status };
        if (form.password) body.password = form.password;
        await updateAdminUser(form.id, body);
        toast.success("Pengguna diperbarui.");
      } else {
        await createAdminUser({ name: form.name, email: form.email, password: form.password });
        toast.success("Akun customer dibuat.");
      }
      setForm(null);
      load(page);
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan pengguna.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeactivate(u) {
    if (!window.confirm(`Nonaktifkan akun ${u.name} (${u.email})? Akun tidak dihapus — status menjadi inactive dan riwayatnya tetap utuh.`)) return;
    try {
      await deactivateAdminUser(u.id);
      toast.success("Akun dinonaktifkan.");
      load(page);
    } catch (err) {
      toast.error(err.message || "Gagal menonaktifkan akun.");
    }
  }

  return (
    <div className="page-shell-wrap">
      <div className="admin-hero-header">
        <h1 className="admin-page-title">Pengguna</h1>
        <p className="admin-page-subtitle">
          {total} akun terdaftar. Akun baru dari sini selalu dibuat sebagai customer. Menonaktifkan akun tidak menghapus baris, riwayat, maupun log.
        </p>
      </div>

      {error && <ErrorBox error={error} />}

      <div className="glass-panel" style={{ padding: "18px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...inputStyle, maxWidth: "320px" }}
          placeholder="Cari nama / email…"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setQ(qDraft); }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQ(qDraft)}>Cari</button>
        <select style={{ ...inputStyle, maxWidth: "180px" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="suspended">suspended</option>
        </select>
        <span style={{ marginLeft: "auto" }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setForm({ name: "", email: "", password: "", status: "active" })}
          >
            + Tambah Customer
          </button>
        </span>
      </div>

      {form && (
        <form onSubmit={onSubmit} className="glass-panel" style={{ padding: "20px", display: "grid", gap: "12px" }}>
          <h3 style={{ margin: 0 }}>{form.id ? "Edit Pengguna" : "Tambah Customer"}</h3>
          <input style={inputStyle} placeholder="Nama" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={inputStyle} placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input
            style={inputStyle}
            placeholder={form.id ? "Password baru (kosongkan = tidak diubah)" : "Password (min. 6 karakter)"}
            type="password"
            required={!form.id}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {form.id && (
            <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="suspended">suspended</option>
            </select>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      <div className="glass-panel" style={{ padding: "8px 12px", overflowX: "auto" }}>
        {rows.length === 0 ? (
          <p className="muted" style={{ padding: "20px", textAlign: "center" }}>Tidak ada pengguna yang cocok.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
            <thead>
              <tr>
                <th style={thStyle}>Nama</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Terdaftar</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td style={tdStyle}><strong>{u.name}</strong></td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.role}</td>
                  <td style={tdStyle}><span className="badge badge-navy">{u.status}</span></td>
                  <td style={tdStyle}>{fmtDate(u.created_at)}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ id: u.id, name: u.name, email: u.email, password: "", status: u.status })}>Edit</button>{" "}
                    {u.status !== "inactive" && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDeactivate(u)}>Nonaktifkan</button>
                    )}
                  </td>
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
