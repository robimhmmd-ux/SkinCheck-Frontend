"use client";
import { useEffect, useState } from "react";
import {
  getAdminSettings,
  updateAdminSettings,
  testAdminDb,
  testAdminAi,
  testAdminEmail,
  testAdminWa,
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

// Kelompok form. Catatan jujur per kelompok ditampilkan di bawah judulnya.
const GROUPS = [
  {
    title: "Model AI & Limit",
    note: "AI_MODEL, AI_MAX_TOKENS, AI_TEMPERATURE, dan AI_SIMULATION_MODE dibaca layanan chatbot setiap percakapan.",
    keys: ["AI_MODEL", "AI_MAX_TOKENS", "AI_TEMPERATURE", "AI_SIMULATION_MODE"],
  },
  {
    title: "Kuota & Mode Operasional",
    note: "SCAN_DAILY_QUOTA hanya berlaku kalau diisi angka positif (kosong = tanpa batas, perilaku customer tidak berubah). MAINTENANCE_MODE on memblokir upload scan customer (503); admin dikecualikan dari blokir itu.",
    keys: ["SCAN_DAILY_QUOTA", "MAINTENANCE_MODE"],
  },
  {
    title: "Verifikasi & Threshold",
    note: "OTP_MODE, VGG_THRESHOLD, dan YOLO_THRESHOLD saat ini hanya tersimpan: alur OTP masih WA-only dan threshold belum dipakai inferensi. Jangan menganggap mengubahnya langsung mengubah perilaku.",
    keys: ["OTP_MODE", "VGG_THRESHOLD", "YOLO_THRESHOLD"],
  },
  {
    title: "Kredensial Gateway",
    note: "Nilai secret tidak pernah ditampilkan. Mengosongkan kolom secret berarti TIDAK MENGUBAH nilai lama — isi hanya kalau memang mau mengganti.",
    keys: ["GEMINI_API_KEY", "FONNTE_TOKEN", "WA_API_TOKEN", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM_NAME"],
  },
];

export default function AdminSettingsPage() {
  const [values, setValues] = useState({});
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState({});
  const [testing, setTesting] = useState(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await getAdminSettings();
      const obj = pickObject(d);
      const list = obj.settings || [];
      const v = {};
      const m = {};
      for (const s of list) {
        // Untuk secret: tampilkan "" (bukan "tersimpan") agar pengiriman
        // kosong diartikan "tidak diubah" oleh backend.
        v[s.key] = s.masked ? "" : (s.value ?? "");
        m[s.key] = s;
      }
      setValues(v);
      setMeta(m);
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
          <Loading label="Memuat pengaturan…" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-shell-wrap">
        <div className="glass-panel" style={{ padding: "36px", textAlign: "center" }}>
          <h2>Gagal Memuat Pengaturan</h2>
          <ErrorBox error={error} />
        </div>
      </div>
    );
  }

  async function onSave() {
    setSaving(true);
    try {
      const res = await updateAdminSettings(values);
      const obj = pickObject(res);
      toast.success(`Pengaturan disimpan (${(obj.updated || []).length} kunci).`);
      load();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  async function runTest(name, fn) {
    setTesting(name);
    try {
      const res = await fn();
      setTests((prev) => ({ ...prev, [name]: pickObject(res) }));
    } catch (err) {
      setTests((prev) => ({ ...prev, [name]: { ok: false, detail: err.message || "Gagal menguji." } }));
    } finally {
      setTesting(null);
    }
  }

  const testBtn = (name, label, fn) => (
    <div>
      <button type="button" className="btn btn-secondary btn-sm" disabled={testing === name} onClick={() => runTest(name, fn)}>
        {testing === name ? "Menguji…" : label}
      </button>
      {tests[name] && (
        <p style={{ margin: "8px 0 0", fontSize: "13px" }}>
          <strong style={{ color: tests[name].ok ? "var(--brand-green, #2e7d32)" : "#b3261e" }}>
            {tests[name].ok ? "OK" : "Gagal"}
          </strong>
          {tests[name].latency_ms != null && ` • ${tests[name].latency_ms} ms`}
          {tests[name].detail ? ` • ${tests[name].detail}` : ""}
          {tests[name].sample_output ? ` • Contoh: ${tests[name].sample_output}` : ""}
          {tests[name].counts ? ` • users ${tests[name].counts.users}, scans ${tests[name].counts.scans}, products ${tests[name].counts.products}` : ""}
        </p>
      )}
    </div>
  );

  return (
    <div className="page-shell-wrap">
      <div className="admin-hero-header">
        <h1 className="admin-page-title">Pengaturan</h1>
        <p className="admin-page-subtitle">
          Konfigurasi sistem, batasan AI, dan pengujian konektivitas. Kunci di luar allowlist ditolak backend.
        </p>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="glass-panel" style={{ padding: "20px", display: "grid", gap: "12px" }}>
          <div>
            <h3 style={{ margin: "0 0 4px" }}>{g.title}</h3>
            <p className="muted" style={{ margin: 0, fontSize: "13px", lineHeight: "1.6" }}>{g.note}</p>
          </div>
          {g.keys.map((key) => (
            <label key={key} style={{ display: "grid", gap: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>
                {key}
                {meta[key]?.masked && (
                  <span className="muted" style={{ fontWeight: 400 }}>
                    {" "}• {meta[key]?.configured ? "tersimpan (kosongkan = tidak diubah)" : "belum disetel"}
                  </span>
                )}
              </span>
              <input
                style={inputStyle}
                type={meta[key]?.masked ? "password" : "text"}
                autoComplete="off"
                placeholder={meta[key]?.masked ? "••••••••" : ""}
                value={values[key] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={onSave}>
          {saving ? "Menyimpan…" : "Simpan Pengaturan"}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: "20px", display: "grid", gap: "16px" }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>Testing Hub</h3>
          <p className="muted" style={{ margin: 0, fontSize: "13px", lineHeight: "1.6" }}>
            Pengujian konektivitas saja: uji email hanya connect + login SMTP tanpa mengirim email,
            uji WA hanya cek status device Fonnte tanpa mengirim pesan, uji AI hanya generate prompt singkat.
          </p>
        </div>
        {testBtn("db", "Uji Database", testAdminDb)}
        {testBtn("ai", "Uji Gemini AI", testAdminAi)}
        {testBtn("email", "Uji Login SMTP", testAdminEmail)}
        {testBtn("wa", "Uji Device Fonnte", testAdminWa)}
      </div>
    </div>
  );
}
