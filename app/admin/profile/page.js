"use client";
import { useEffect, useState } from "react";
import {
  getAdminProfile,
  updateAdminProfile,
  pickObject,
} from "../../../lib/api";
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

export default function AdminProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await getAdminProfile();
      const obj = pickObject(d);
      setData(obj);
      setName(obj.name || "");
      setEmail(obj.email || "");
    } catch (e) {
      if (e.status === 401 || e.status === 403) setDenied(true);
      else setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (denied) return <AdminDenied />;
  if (loading) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "48px", textAlign: "center" }}>
          <Loading label="Memuat profil…" />
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "36px", textAlign: "center" }}>
          <h2>Gagal Memuat Profil</h2>
          <ErrorBox error={error} />
        </div>
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (newPassword && !oldPassword) {
      toast.error("Isi password lama untuk mengubah password.");
      return;
    }
    setBusy(true);
    try {
      const body = { name, email };
      if (newPassword) {
        body.old_password = oldPassword;
        body.new_password = newPassword;
      }
      await updateAdminProfile(body);
      toast.success("Profil diperbarui.");
      setOldPassword("");
      setNewPassword("");
      load();
    } catch (err) {
      toast.error(err.message || "Gagal memperbarui profil.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell-wrap">
      <div className="admin-hero-header">
        <h1 className="admin-page-title">Profil Admin</h1>
        <p className="admin-page-subtitle">
          Nama dan email dapat diubah langsung. Password baru hanya diproses kalau password lama terverifikasi.
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass-panel" style={{ padding: "20px", display: "grid", gap: "12px", maxWidth: "560px" }}>
        <label style={{ display: "grid", gap: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600 }}>Nama</span>
          <input style={inputStyle} value={name} required onChange={(e) => setName(e.target.value)} />
        </label>
        <label style={{ display: "grid", gap: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600 }}>Email</span>
          <input style={inputStyle} type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
        </label>
        <p className="muted" style={{ fontSize: "13px", margin: 0 }}>
          Role: <strong>{data.role}</strong> • Status: <strong>{data.status}</strong> • Password lama wajib diisi hanya kalau mau ganti password.
        </p>
        <label style={{ display: "grid", gap: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600 }}>Password lama</span>
          <input style={inputStyle} type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </label>
        <label style={{ display: "grid", gap: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600 }}>Password baru (min. 6 karakter, kosongkan = tidak diubah)</span>
          <input style={inputStyle} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        <div>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan Profil"}</button>
        </div>
      </form>
    </div>
  );
}
