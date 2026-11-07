"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Cpu,
  Key,
  UserCog,
  ShieldCheck,
  ShieldAlert,
  Server,
  Lock,
  Mail,
  Smartphone,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  Sliders,
  Send,
  Database
} from "lucide-react";
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminProfile,
  updateAdminProfile,
  testAdminDb,
  testAdminAi,
  testAdminEmail,
  testAdminWa,
  pickObject
} from "../../../lib/api";
import { ErrorBox, Loading } from "../../../components/Notice";
import AdminDenied from "../../../components/AdminDenied";
import { useToast } from "../../../components/Toast";

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border-subtle, #e2e8f0)",
  background: "#ffffff",
  fontSize: "13.5px",
  color: "var(--text-main, #172033)",
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease"
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "ai";

  const [activeConfigTab, setActiveConfigTab] = useState(initialTab); // "ai" | "otp" | "admin"
  const [values, setValues] = useState({});
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Admin Profile states (for "admin" tab)
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Testing hub states
  const [tests, setTests] = useState({});
  const [testing, setTesting] = useState(null);

  const toast = useToast();

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, profileRes] = await Promise.allSettled([
        getAdminSettings(),
        getAdminProfile()
      ]);

      if (settingsRes.status === "fulfilled") {
        const obj = pickObject(settingsRes.value);
        const list = obj.settings || [];
        const v = {};
        const m = {};
        for (const s of list) {
          v[s.key] = s.masked ? "" : (s.value ?? "");
          m[s.key] = s;
        }
        setValues(v);
        setMeta(m);
      } else {
        const e = settingsRes.reason;
        if (e && (e.status === 401 || e.status === 403)) {
          setDenied(true);
          return;
        }
        throw e;
      }

      if (profileRes.status === "fulfilled") {
        const pObj = pickObject(profileRes.value);
        setAdminProfile(pObj);
        setAdminName(pObj.name || "");
        setAdminEmail(pObj.email || "");
      }
    } catch (e) {
      if (e && (e.status === 401 || e.status === 403)) {
        setDenied(true);
      } else {
        setError(e);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["ai", "otp", "admin"].includes(tabParam)) {
      setActiveConfigTab(tabParam);
    }
  }, [searchParams]);

  // Handler for saving settings (AI / OTP)
  async function handleSaveSettings(keysToSave = null) {
    setSavingSettings(true);
    try {
      let payload = values;
      if (keysToSave && Array.isArray(keysToSave)) {
        payload = {};
        keysToSave.forEach((k) => {
          if (values[k] !== undefined) payload[k] = values[k];
        });
      }
      const res = await updateAdminSettings(payload);
      const obj = pickObject(res);
      toast.success(`Konfigurasi berhasil disimpan (${(obj.updated || []).length} kunci diperbarui).`);
      loadAllData();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan konfigurasi.");
    } finally {
      setSavingSettings(false);
    }
  }

  // Handler for saving Admin Profile (Name and/or Password)
  async function handleSaveAdminProfile(e) {
    e.preventDefault();
    if (newPassword && !oldPassword) {
      toast.error("Masukkan password lama untuk memverifikasi penggantian kata sandi.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok.");
      return;
    }

    setSavingProfile(true);
    try {
      const body = { name: adminName };
      if (newPassword) {
        body.old_password = oldPassword;
        body.new_password = newPassword;
      }
      await updateAdminProfile(body);
      toast.success("Profil dan kredensial akun administrator berhasil diperbarui.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      loadAllData();
    } catch (err) {
      toast.error(err.message || "Gagal memperbarui profil admin.");
    } finally {
      setSavingProfile(false);
    }
  }

  // Connectivity Testing Hub
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

  const renderTestBox = (name, label, icon, fn) => (
    <div style={{ padding: "14px", borderRadius: "var(--radius-lg)", background: "var(--surface-warm, #f8fafc)", border: "1px solid var(--border-light, #e2e8f0)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {icon}
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>{label}</span>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={testing === name}
          onClick={() => runTest(name, fn)}
        >
          {testing === name ? <><RefreshCw size={13} className="animate-spin" /> Menguji…</> : "Jalankan Tes"}
        </button>
      </div>

      {tests[name] && (
        <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "8px", background: tests[name].ok ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)", border: `1px solid ${tests[name].ok ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`, fontSize: "12.5px" }}>
          <strong style={{ color: tests[name].ok ? "#059669" : "#dc2626" }}>
            {tests[name].ok ? "Koneksi Berhasil (OK)" : "Koneksi Gagal"}
          </strong>
          {tests[name].latency_ms != null && ` • Latensi: ${tests[name].latency_ms} ms`}
          {tests[name].detail ? ` • ${tests[name].detail}` : ""}
          {tests[name].sample_output ? ` • Respon: ${tests[name].sample_output}` : ""}
          {tests[name].counts ? ` • Pengguna: ${tests[name].counts.users}, Scan: ${tests[name].counts.scans}, Produk: ${tests[name].counts.products}` : ""}
        </div>
      )}
    </div>
  );

  if (denied) return <AdminDenied />;

  if (loading) {
    return (
      <div className="admin-stage-container" style={{ textAlign: "center", padding: "64px 20px" }}>
        <Loading label="Memuat Pusat Konfigurasi Laomera…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-stage-container" style={{ textAlign: "center", padding: "48px 20px" }}>
        <div className="glass-panel" style={{ maxWidth: "480px", margin: "0 auto", padding: "36px" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--brand-navy)", marginBottom: "8px" }}>
            Gagal Memuat Konfigurasi
          </h2>
          <ErrorBox error={error} />
          <button type="button" className="btn btn-primary" style={{ margin: "20px auto 0" }} onClick={loadAllData}>
            <RefreshCw size={15} /> Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-stage-container">
      {/* ── Page Header ── */}
      <div className="admin-view-header">
        <div className="admin-title-group">
          <div className="badge badge-amber" style={{ marginBottom: "6px" }}>
            <Sliders size={12} /> PUSAT KONFIGURASI SISTEM & AKUN
          </div>
          <h1>Konfigurasi Terpusat</h1>
          <p>
            Pilih modul konfigurasi yang ingin disetel: Model Kecerdasan Buatan (AI), Gateway OTP, atau Akun Administrator.
          </p>
        </div>
      </div>

      {/* ── 3 SELECTION CARDS (BILAH PEMILIHAN KONFIGURASI) ── */}
      <div className="config-selector-grid">
        {/* Pilihan 1: Model AI */}
        <div
          className={`config-selector-card ${activeConfigTab === "ai" ? "active" : ""}`}
          onClick={() => setActiveConfigTab("ai")}
        >
          <div className="config-selector-top">
            <div className="config-selector-icon-wrap icon-ai">
              <Cpu size={22} />
            </div>
            <span className="config-selector-badge">
              {activeConfigTab === "ai" ? "Aktif Dipilih" : "Modul 1"}
            </span>
          </div>
          <h3 className="config-selector-title">Konfigurasi Model AI</h3>
          <p className="config-selector-desc">
            Parameter model LLM, batas token, suhu kreativitas, ambang inferensi VGG, dan mode simulasi.
          </p>
        </div>

        {/* Pilihan 2: OTP & Gateway */}
        <div
          className={`config-selector-card ${activeConfigTab === "otp" ? "active" : ""}`}
          onClick={() => setActiveConfigTab("otp")}
        >
          <div className="config-selector-top">
            <div className="config-selector-icon-wrap icon-otp">
              <Key size={22} />
            </div>
            <span className="config-selector-badge">
              {activeConfigTab === "otp" ? "Aktif Dipilih" : "Modul 2"}
            </span>
          </div>
          <h3 className="config-selector-title">Konfigurasi OTP</h3>
          <p className="config-selector-desc">
            Alur pengiriman kode OTP verifikasi pengguna, token gateway WhatsApp Fonnte, dan server SMTP.
          </p>
        </div>

        {/* Pilihan 3: Akun Admin (Profil yang digabung) */}
        <div
          className={`config-selector-card ${activeConfigTab === "admin" ? "active" : ""}`}
          onClick={() => setActiveConfigTab("admin")}
        >
          <div className="config-selector-top">
            <div className="config-selector-icon-wrap icon-admin">
              <UserCog size={22} />
            </div>
            <span className="config-selector-badge">
              {activeConfigTab === "admin" ? "Aktif Dipilih" : "Modul 3"}
            </span>
          </div>
          <h3 className="config-selector-title">Konfigurasi Akun Admin</h3>
          <p className="config-selector-desc">
            Profil identitas administrator, nama akun, level akses root sistem, dan pembaruan kata sandi.
          </p>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════
          TAB CONTENT 1: KONFIGURASI MODEL AI
         ═════════════════════════════════════════════════════════ */}
      {activeConfigTab === "ai" && (
        <div style={{ display: "grid", gap: "22px" }}>
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Cpu size={18} color="var(--brand-amber)" />
                <span>Parameter Model AI & Output Engine</span>
              </div>
              <span className="admin-card-badge">LLM & CHATBOT</span>
            </div>

            <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "18px" }}>
              Parameter berikut mengendalikan model bahasa yang digunakan oleh <strong>Laomera Asisten</strong> untuk membaca hasil diagnosis dan memberikan edukasi bahan aktif.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>AI_MODEL (Nama Model LLM)</span>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="gemini-1.5-flash"
                  value={values.AI_MODEL ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, AI_MODEL: e.target.value }))}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Default: gemini-1.5-flash</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>AI_MAX_TOKENS (Batas Token)</span>
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="1024"
                  value={values.AI_MAX_TOKENS ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, AI_MAX_TOKENS: e.target.value }))}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Maksimal token dalam satu respon chat</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>AI_TEMPERATURE (Kreativitas)</span>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="0.7"
                  value={values.AI_TEMPERATURE ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, AI_TEMPERATURE: e.target.value }))}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>0.0 (Sangat presisi) hingga 1.0 (Kreatif)</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>AI_SIMULATION_MODE</span>
                <select
                  style={inputStyle}
                  value={values.AI_SIMULATION_MODE ?? "0"}
                  onChange={(e) => setValues((p) => ({ ...p, AI_SIMULATION_MODE: e.target.value }))}
                >
                  <option value="0">0 — Live AI API (Normal)</option>
                  <option value="1">1 — Mode Simulasi (Fallback Mock)</option>
                </select>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Gunakan 1 jika kuota API habis</span>
              </label>
            </div>
          </div>

          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Sliders size={18} color="var(--brand-amber)" />
                <span>Ambang Batas Inferensi & Kuota Operasional</span>
              </div>
              <span className="admin-card-badge">VGG & LIMITS</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>VGG_THRESHOLD (%)</span>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="40"
                  value={values.VGG_THRESHOLD ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, VGG_THRESHOLD: e.target.value }))}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Ambang minimal klasifikasi kondisi wajah</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>YOLO_CONFIDENCE</span>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="0.25"
                  value={values.YOLO_CONFIDENCE ?? values.YOLO_THRESHOLD ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, YOLO_CONFIDENCE: e.target.value }))}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Confidence score untuk modul deteksi objek</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>SCAN_DAILY_QUOTA (Batas Scan Harian)</span>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="5"
                  value={values.SCAN_DAILY_QUOTA ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, SCAN_DAILY_QUOTA: e.target.value }))}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Kosongkan untuk tanpa batas</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>MAINTENANCE_MODE</span>
                <select
                  style={inputStyle}
                  value={values.MAINTENANCE_MODE ?? "off"}
                  onChange={(e) => setValues((p) => ({ ...p, MAINTENANCE_MODE: e.target.value }))}
                >
                  <option value="off">off — Sistem Beroperasi Normal</option>
                  <option value="on">on — Mode Pemeliharaan (Blokir Scan Customer)</option>
                </select>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Admin tetap bisa melakukan scan</span>
              </label>
            </div>

            <div style={{ marginTop: "18px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>
                  GEMINI_API_KEY (Google AI Studio Key)
                  {meta.GEMINI_API_KEY?.configured && (
                    <span style={{ color: "#059669", fontWeight: 400, marginLeft: "8px" }}>
                      • Kunci tersimpan di backend (Kosongkan jika tidak ingin mengubah)
                    </span>
                  )}
                </span>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={values.GEMINI_API_KEY ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, GEMINI_API_KEY: e.target.value }))}
                />
              </label>
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingSettings}
                onClick={() => handleSaveSettings(["AI_MODEL", "AI_MAX_TOKENS", "AI_TEMPERATURE", "AI_SIMULATION_MODE", "VGG_THRESHOLD", "YOLO_CONFIDENCE", "SCAN_DAILY_QUOTA", "MAINTENANCE_MODE", "GEMINI_API_KEY"])}
              >
                <Save size={15} />
                <span>{savingSettings ? "Menyimpan Konfigurasi AI…" : "Simpan Konfigurasi AI"}</span>
              </button>
            </div>
          </div>

          {/* Testing Hub AI */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Sparkles size={18} color="var(--brand-amber)" />
                <span>Testing Hub: Inferensi & Basis Data</span>
              </div>
              <span className="admin-card-badge">CONNECTIVITY TEST</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
              {renderTestBox("ai", "Uji Respon Gemini AI", <Cpu size={16} color="var(--brand-amber)" />, testAdminAi)}
              {renderTestBox("db", "Uji Koneksi Database TiDB", <Database size={16} color="#2563eb" />, testAdminDb)}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          TAB CONTENT 2: KONFIGURASI OTP & GATEWAY
         ═════════════════════════════════════════════════════════ */}
      {activeConfigTab === "otp" && (
        <div style={{ display: "grid", gap: "22px" }}>
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Smartphone size={18} color="#2563eb" />
                <span>Metode Verifikasi OTP & Gateway WhatsApp</span>
              </div>
              <span className="admin-card-badge">VERIFIKASI PENGGUNA</span>
            </div>

            <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "18px" }}>
              Konfigurasikan alur verifikasi kode one-time password (OTP) untuk pendaftaran pengguna baru dan penghapusan akun.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>OTP_MODE (Kanal Verifikasi)</span>
                <select
                  style={inputStyle}
                  value={values.OTP_MODE ?? values.REGISTRATION_OTP_MODE ?? "whatsapp"}
                  onChange={(e) => setValues((p) => ({ ...p, OTP_MODE: e.target.value, REGISTRATION_OTP_MODE: e.target.value }))}
                >
                  <option value="whatsapp">WhatsApp Only (Fonnte API)</option>
                  <option value="email">Email Only (SMTP)</option>
                  <option value="dual">Dual (WhatsApp & Email)</option>
                </select>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Pilih jalur pengiriman kode OTP ke pengguna</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>
                  FONNTE_TOKEN (Token API WhatsApp Fonnte)
                  {meta.FONNTE_TOKEN?.configured && (
                    <span style={{ color: "#059669", fontWeight: 400, marginLeft: "6px" }}>• Tersimpan</span>
                  )}
                </span>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••••••••••••••"
                  value={values.FONNTE_TOKEN ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, FONNTE_TOKEN: e.target.value }))}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Token akun Fonnte untuk broadcast WhatsApp</span>
              </label>
            </div>
          </div>

          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Mail size={18} color="#2563eb" />
                <span>Kredensial Server Email SMTP</span>
              </div>
              <span className="admin-card-badge">EMAIL GATEWAY</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>MAIL_USERNAME (Email SMTP)</span>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="admin@laomera.com"
                  value={values.MAIL_USERNAME ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, MAIL_USERNAME: e.target.value }))}
                />
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>
                  MAIL_PASSWORD (Password SMTP)
                  {meta.MAIL_PASSWORD?.configured && (
                    <span style={{ color: "#059669", fontWeight: 400, marginLeft: "6px" }}>• Tersimpan</span>
                  )}
                </span>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••••••"
                  value={values.MAIL_PASSWORD ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, MAIL_PASSWORD: e.target.value }))}
                />
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>MAIL_FROM_NAME (Nama Pengirim)</span>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Laomera Skin Intelligence"
                  value={values.MAIL_FROM_NAME ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, MAIL_FROM_NAME: e.target.value }))}
                />
              </label>
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingSettings}
                onClick={() => handleSaveSettings(["OTP_MODE", "REGISTRATION_OTP_MODE", "FONNTE_TOKEN", "WA_API_TOKEN", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM_NAME"])}
              >
                <Save size={15} />
                <span>{savingSettings ? "Menyimpan Konfigurasi OTP…" : "Simpan Konfigurasi OTP & Gateway"}</span>
              </button>
            </div>
          </div>

          {/* Testing Hub Komunikasi */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <Send size={18} color="#2563eb" />
                <span>Testing Hub: Gateway WhatsApp & Email</span>
              </div>
              <span className="admin-card-badge">GATEWAY TEST</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
              {renderTestBox("wa", "Uji Status Device WhatsApp Fonnte", <Smartphone size={16} color="#059669" />, testAdminWa)}
              {renderTestBox("email", "Uji Autentikasi Login SMTP", <Mail size={16} color="#2563eb" />, testAdminEmail)}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          TAB CONTENT 3: KONFIGURASI AKUN ADMIN (PROFIL TERPADU)
         ═════════════════════════════════════════════════════════ */}
      {activeConfigTab === "admin" && (
        <form onSubmit={handleSaveAdminProfile} style={{ display: "grid", gap: "22px" }}>
          {/* Identitas Administrator */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <UserCog size={18} color="var(--brand-navy)" />
                <span>Profil Identitas Administrator</span>
              </div>
              <span className="admin-card-badge" style={{ background: "var(--amber-100)", color: "var(--amber-700)", fontWeight: 700 }}>
                ROOT SYSTEM ACCESS
              </span>
            </div>

            <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "18px" }}>
              Data kredensial administrator ini digunakan untuk otentikasi sesi konsol sistem Laomera dan audit aktivitas backend.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>Nama Lengkap Administrator</span>
                <input
                  style={inputStyle}
                  type="text"
                  required
                  placeholder="Administrator"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Nama yang tertera pada catatan sistem dan log audit</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Lock size={12} color="var(--text-muted)" /> Alamat Email (Permanen)
                </span>
                <input
                  style={{ ...inputStyle, background: "#f8fafc", cursor: "not-allowed", color: "#64748b" }}
                  type="email"
                  disabled
                  value={adminEmail || "admin@laomera.com"}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Email root administrator tidak dapat diubah demi integritas sistem</span>
              </label>
            </div>
          </div>

          {/* Keamanan & Pembaruan Password */}
          <div className="admin-glass-card">
            <div className="admin-card-head">
              <div className="admin-card-title">
                <ShieldCheck size={18} color="var(--brand-amber)" />
                <span>Keamanan & Pembaruan Kata Sandi</span>
              </div>
              <span className="admin-card-badge">BCRYPT PROTECTED</span>
            </div>

            <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "18px" }}>
              Kosongkan bagian ini jika Anda hanya ingin memperbarui nama akun tanpa mengganti kata sandi.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>Kata Sandi Lama</span>
                <input
                  style={inputStyle}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Diperlukan untuk otorisasi perubahan kata sandi</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>Kata Sandi Baru</span>
                <input
                  style={inputStyle}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Minimal 8 karakter disarankan</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>Konfirmasi Kata Sandi Baru</span>
                <input
                  style={inputStyle}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Ulangi kata sandi baru secara identik</span>
              </label>
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingProfile}
              >
                <Save size={15} />
                <span>{savingProfile ? "Menyimpan Perubahan Akun…" : "Simpan Perubahan Akun Administrator"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={
      <div className="admin-stage-container" style={{ textAlign: "center", padding: "64px 20px" }}>
        <Loading label="Menyiapkan Bilah Konfigurasi…" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
