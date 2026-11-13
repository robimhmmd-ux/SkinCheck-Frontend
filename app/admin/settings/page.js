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
  Database,
  Eye,
  EyeOff
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
import WorkspaceLoadingScreen from "../../../components/WorkspaceLoadingScreen";
import AdminDenied from "../../../components/AdminDenied";
import { useToast } from "../../../components/Toast";

const inputStyle = {
  width: "100%",
  padding: "11px 18px",
  borderRadius: "28px",
  border: "1px solid rgba(0, 0, 0, 0.04)",
  background: "#e0e0e0",
  boxShadow: "inset 4px 4px 9px #bebebe, inset -4px -4px 9px #ffffff",
  fontSize: "13.5px",
  color: "var(--text-main, #172033)",
  outline: "none",
  transition: "all 0.18s ease"
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
  // Visibilitas tiap kolom rahasia (kunci API + ganti kata sandi admin).
  const [showSecrets, setShowSecrets] = useState({});
  const toggleSecret = (key) => setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  const [savingProfile, setSavingProfile] = useState(false);

  // Testing hub states
  const [tests, setTests] = useState({});
  const [testing, setTesting] = useState(null);

  const toast = useToast();

  // Provider AI aktif (AI_PROVIDER): "gemini" (bawaan) atau "nvidia".
  // Menentukan field kunci + model + label uji yang tampil di tab AI.
  const provider = values.AI_PROVIDER || "gemini";
  const isNvidia = provider === "nvidia";

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

  // Kotak uji disamakan ke resep kartu dashboard (roboy 2026-11-12): dulu
  // abu neumorphic (#e0e0e0, radius 32px, bayangan inset) — kini kaca 0.5 +
  // blur 20px saturate 180% + border putih 0.6 + radius 20px + bayangan
  // navy + shine dalam, sama seperti kartu lainnya.
  const renderTestBox = (name, label, icon, fn) => (
    <div style={{ padding: "16px 20px", borderRadius: "20px", background: "rgba(255, 255, 255, 0.6)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 8px 32px rgba(7, 18, 54, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 255, 255, 0.1), inset 0 0 16px 8px rgba(255, 255, 255, 0.8)", border: "1px solid rgba(255, 255, 255, 0.85)" }}>
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
    return <WorkspaceLoadingScreen caption="Memuat Pusat Konfigurasi Laomera…" />;
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
          <h1>Pusat Konfigurasi Sistem</h1>
          <p>
            Pilih modul yang ingin disetel: Model Kecerdasan Buatan (AI), Gateway OTP, atau Akun Administrator.
          </p>
        </div>
      </div>

      {/* ── SELECTOR TABS: STANDALONE NEUMORPHIC CARDS (Tidak Bergabung) ── */}
      <div className="config-selector-tabs-grid" role="tablist">
        {/* Pilihan 1: Model AI */}
        <button
          type="button"
          className={`config-selector-tab ${activeConfigTab === "ai" ? "active" : ""}`}
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
        </button>

        {/* Pilihan 2: OTP & Gateway */}
        <button
          type="button"
          className={`config-selector-tab ${activeConfigTab === "otp" ? "active" : ""}`}
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
        </button>

        {/* Pilihan 3: Akun Admin */}
        <button
          type="button"
          className={`config-selector-tab ${activeConfigTab === "admin" ? "active" : ""}`}
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
        </button>
      </div>

      {/* ── SETTINGS CARDS STACK (Jarak Antar-card Lebih Rapat & Animasi Jalan ke Atas) ── */}
      <div className="settings-cards-stack" key={activeConfigTab}>
        {activeConfigTab === "ai" && (
          <>
            <div className="standalone-config-card card-delay-1">
              <div className="folder-section-head">
                <div className="admin-card-title">
                  <Cpu size={18} color="var(--brand-amber)" />
                  <span>Parameter Model AI & Output Engine</span>
                </div>
                <span className="admin-card-badge">LLM & CHATBOT</span>
              </div>

              <p className="muted" style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "18px" }}>
                Parameter berikut mengendalikan model bahasa yang digunakan oleh <strong>Laomera Asisten</strong> untuk membaca hasil diagnosis dan memberikan edukasi bahan aktif.
              </p>

              <div style={{ marginBottom: "18px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)", display: "block", marginBottom: "8px" }}>AI_PROVIDER (Penyedia Model AI)</span>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setValues((p) => ({ ...p, AI_PROVIDER: "gemini" }))}
                    style={{ padding: "10px 20px", borderRadius: "28px", border: "1px solid rgba(0, 0, 0, 0.04)", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, background: !isNvidia ? "var(--sunflower-yellow)" : "#e0e0e0", color: "#071236" }}
                  >
                    Gemini (Google AI Studio)
                  </button>
                  <button
                    type="button"
                    onClick={() => setValues((p) => ({ ...p, AI_PROVIDER: "nvidia" }))}
                    style={{ padding: "10px 20px", borderRadius: "28px", border: "1px solid rgba(0, 0, 0, 0.04)", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, background: isNvidia ? "var(--sunflower-yellow)" : "#e0e0e0", color: "#071236" }}
                  >
                    NVIDIA (OpenAI-compatible)
                  </button>
                </div>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Chatbot memakai provider yang dipilih. Perubahan langsung berlaku setelah disimpan — tanpa restart.</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                <label style={{ display: "grid", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>{isNvidia ? "AI_MODEL_NVIDIA (Nama Model NVIDIA)" : "AI_MODEL (Nama Model LLM)"}</span>
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder={isNvidia ? "meta/llama-3.1-8b-instruct" : "gemini-1.5-flash"}
                    value={isNvidia ? (values.AI_MODEL_NVIDIA ?? "") : (values.AI_MODEL ?? "")}
                    onChange={(e) => setValues((p) => ({ ...p, [isNvidia ? "AI_MODEL_NVIDIA" : "AI_MODEL"]: e.target.value }))}
                  />
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{isNvidia ? "Default: meta/llama-3.1-8b-instruct" : "Default: gemini-1.5-flash"}</span>
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

            {/* Card 2: Ambang Batas Inferensi & Kuota Operasional */}
            <div className="standalone-config-card card-delay-2">
              <div className="folder-section-head">
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

              {isNvidia ? (
                <div style={{ marginTop: "18px" }}>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>
                      NVIDIA_API_KEY (NVIDIA API Key)
                      {meta.NVIDIA_API_KEY?.configured && (
                        <span style={{ color: "#059669", fontWeight: 400, marginLeft: "8px" }}>
                          • Kunci tersimpan di backend (Kosongkan jika tidak ingin mengubah)
                        </span>
                      )}
                    </span>
                    <div className="password-field">
                      <input
                        style={{ ...inputStyle, paddingRight: "44px" }}
                        type={showSecrets["NVIDIA_API_KEY"] ? "text" : "password"}
                        placeholder="••••••••••••••••••••••••••••••••"
                        value={values.NVIDIA_API_KEY ?? ""}
                        onChange={(e) => setValues((p) => ({ ...p, NVIDIA_API_KEY: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="password-toggle password-toggle--dark"
                        onClick={() => toggleSecret("NVIDIA_API_KEY")}
                        aria-label={showSecrets["NVIDIA_API_KEY"] ? "Sembunyikan" : "Tampilkan"}
                        aria-pressed={!!showSecrets["NVIDIA_API_KEY"]}
                      >
                        {showSecrets["NVIDIA_API_KEY"] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                  <label style={{ display: "grid", gap: "6px", marginTop: "16px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>AI_NVIDIA_BASE_URL (Endpoint NVIDIA)</span>
                    <input
                      style={inputStyle}
                      type="text"
                      placeholder="https://integrate.api.nvidia.com/v1"
                      value={values.AI_NVIDIA_BASE_URL ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, AI_NVIDIA_BASE_URL: e.target.value }))}
                    />
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Kosongkan untuk memakai endpoint bawaan NVIDIA.</span>
                  </label>
                </div>
              ) : (
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
                  <div className="password-field">
<input
                    style={{ ...inputStyle, paddingRight: "44px" }}
                    type={showSecrets["GEMINI_API_KEY"] ? "text" : "password"}
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={values.GEMINI_API_KEY ?? ""}
                    onChange={(e) => setValues((p) => ({ ...p, GEMINI_API_KEY: e.target.value }))}
                  />
                    <button
                      type="button"
                      className="password-toggle password-toggle--dark"
                      onClick={() => toggleSecret("GEMINI_API_KEY")}
                      aria-label={showSecrets["GEMINI_API_KEY"] ? "Sembunyikan" : "Tampilkan"}
                      aria-pressed={!!showSecrets["GEMINI_API_KEY"]}
                    >
                      {showSecrets["GEMINI_API_KEY"] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>
              )}

              <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={savingSettings}
                  onClick={() => handleSaveSettings(["AI_PROVIDER", "AI_MODEL", "AI_MODEL_NVIDIA", "AI_NVIDIA_BASE_URL", "AI_MAX_TOKENS", "AI_TEMPERATURE", "AI_SIMULATION_MODE", "VGG_THRESHOLD", "SCAN_DAILY_QUOTA", "MAINTENANCE_MODE", "GEMINI_API_KEY", "NVIDIA_API_KEY"])}
                >
                  <Save size={15} />
                  <span>{savingSettings ? "Menyimpan Konfigurasi AI…" : "Simpan Konfigurasi AI"}</span>
                </button>
              </div>
            </div>

            {/* Card 3: Testing Hub AI */}
            <div className="standalone-config-card card-delay-3">
              <div className="folder-section-head">
                <div className="admin-card-title">
                  <Sparkles size={18} color="var(--brand-amber)" />
                  <span>Testing Hub: Inferensi & Basis Data</span>
                </div>
                <span className="admin-card-badge">CONNECTIVITY TEST</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                {renderTestBox("ai", isNvidia ? "Uji Respon NVIDIA AI" : "Uji Respon Gemini AI", <Cpu size={16} color="var(--brand-amber)" />, testAdminAi)}
                {renderTestBox("db", "Uji Koneksi Database TiDB", <Database size={16} color="#2563eb" />, testAdminDb)}
              </div>
            </div>
          </>
        )}

        {activeConfigTab === "otp" && (
          <>
            {/* Card 1: Alur Pengiriman Kode OTP */}
            <div className="standalone-config-card card-delay-1">
              <div className="folder-section-head">
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

                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
                  <button
                    type="button"
                    className={`app-switch ${values.ALLOW_SAME_PHONE_NUMBER === "on" ? "active" : ""}`}
                    role="switch"
                    aria-checked={values.ALLOW_SAME_PHONE_NUMBER === "on"}
                    aria-label="Boleh pakai nomor WhatsApp yang sama"
                    onClick={() =>
                      setValues((p) => ({ ...p, ALLOW_SAME_PHONE_NUMBER: p.ALLOW_SAME_PHONE_NUMBER === "on" ? "off" : "on" }))
                    }
                  >
                    <span className="switch-thumb" />
                  </button>
                  <span style={{ fontSize: "13px", lineHeight: "1.5" }}>
                    <strong style={{ color: "var(--brand-navy)" }}>Boleh pakai nomor WhatsApp yang sama</strong>
                    <span className="muted">
                      {" "}— {values.ALLOW_SAME_PHONE_NUMBER === "on"
                        ? "Boleh: satu nomor WA bisa dipakai beberapa akun (untuk demo)."
                        : "Tidak boleh: satu nomor WA hanya untuk satu akun."}
                    </span>
                    <br />
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Aturan ini ditegakkan saat pendaftaran akun baru.</span>
                  </span>
                </div>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>
                    FONNTE_TOKEN (Token API WhatsApp Fonnte)
                    {meta.FONNTE_TOKEN?.configured && (
                      <span style={{ color: "#059669", fontWeight: 400, marginLeft: "6px" }}>• Tersimpan</span>
                    )}
                  </span>
                  <div className="password-field">
<input
                    style={{ ...inputStyle, paddingRight: "44px" }}
                    type={showSecrets["FONNTE_TOKEN"] ? "text" : "password"}
                    placeholder="••••••••••••••••••••"
                    value={values.FONNTE_TOKEN ?? ""}
                    onChange={(e) => setValues((p) => ({ ...p, FONNTE_TOKEN: e.target.value }))}
                  />
                    <button
                      type="button"
                      className="password-toggle password-toggle--dark"
                      onClick={() => toggleSecret("FONNTE_TOKEN")}
                      aria-label={showSecrets["FONNTE_TOKEN"] ? "Sembunyikan" : "Tampilkan"}
                      aria-pressed={!!showSecrets["FONNTE_TOKEN"]}
                    >
                      {showSecrets["FONNTE_TOKEN"] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Token akun Fonnte untuk broadcast WhatsApp</span>
                </label>
              </div>
            </div>

            {/* Card 2: Kredensial Server Email SMTP */}
            <div className="standalone-config-card card-delay-2">
              <div className="folder-section-head">
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
                  <div className="password-field">
<input
                    style={{ ...inputStyle, paddingRight: "44px" }}
                    type={showSecrets["MAIL_PASSWORD"] ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={values.MAIL_PASSWORD ?? ""}
                    onChange={(e) => setValues((p) => ({ ...p, MAIL_PASSWORD: e.target.value }))}
                  />
                    <button
                      type="button"
                      className="password-toggle password-toggle--dark"
                      onClick={() => toggleSecret("MAIL_PASSWORD")}
                      aria-label={showSecrets["MAIL_PASSWORD"] ? "Sembunyikan" : "Tampilkan"}
                      aria-pressed={!!showSecrets["MAIL_PASSWORD"]}
                    >
                      {showSecrets["MAIL_PASSWORD"] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                  onClick={() => handleSaveSettings(["ALLOW_SAME_PHONE_NUMBER", "OTP_MODE", "REGISTRATION_OTP_MODE", "FONNTE_TOKEN", "WA_API_TOKEN", "MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM_NAME"])}
                >
                  <Save size={15} />
                  <span>{savingSettings ? "Menyimpan Konfigurasi OTP…" : "Simpan Konfigurasi OTP & Gateway"}</span>
                </button>
              </div>
            </div>

            {/* Card 3: Testing Hub Komunikasi */}
            <div className="standalone-config-card card-delay-3">
              <div className="folder-section-head">
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
          </>
        )}

        {activeConfigTab === "admin" && (
          <>
            {/* Card 1: Profil Identitas Administrator */}
            <div className="standalone-config-card card-delay-1">
              <div className="folder-section-head">
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
                    style={{ ...inputStyle, background: "#f8fafc", cursor: "not-allowed", color: "var(--text-main)" }}
                    type="email"
                    disabled
                    value={adminEmail || "admin@laomera.com"}
                  />
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Email root administrator tidak dapat diubah demi integritas sistem</span>
                </label>
              </div>
            </div>

            {/* Card 2: Keamanan & Pembaruan Password */}
            <form
              onSubmit={handleSaveAdminProfile}
              className="standalone-config-card card-delay-2"
            >
            <div className="folder-section-head">
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
                <div className="password-field">
<input
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  type={showSecrets["oldPassword"] ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                  <button
                    type="button"
                    className="password-toggle password-toggle--dark"
                    onClick={() => toggleSecret("oldPassword")}
                    aria-label={showSecrets["oldPassword"] ? "Sembunyikan" : "Tampilkan"}
                    aria-pressed={!!showSecrets["oldPassword"]}
                  >
                    {showSecrets["oldPassword"] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Diperlukan untuk otorisasi perubahan kata sandi</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>Kata Sandi Baru</span>
                <div className="password-field">
<input
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  type={showSecrets["newPassword"] ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                  <button
                    type="button"
                    className="password-toggle password-toggle--dark"
                    onClick={() => toggleSecret("newPassword")}
                    aria-label={showSecrets["newPassword"] ? "Sembunyikan" : "Tampilkan"}
                    aria-pressed={!!showSecrets["newPassword"]}
                  >
                    {showSecrets["newPassword"] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Minimal 8 karakter disarankan</span>
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-navy)" }}>Konfirmasi Kata Sandi Baru</span>
                <div className="password-field">
<input
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  type={showSecrets["confirmPassword"] ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                  <button
                    type="button"
                    className="password-toggle password-toggle--dark"
                    onClick={() => toggleSecret("confirmPassword")}
                    aria-label={showSecrets["confirmPassword"] ? "Sembunyikan" : "Tampilkan"}
                    aria-pressed={!!showSecrets["confirmPassword"]}
                  >
                    {showSecrets["confirmPassword"] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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
          </form>
        </>
      )}
    </div>
  </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<WorkspaceLoadingScreen caption="Menyiapkan Bilah Konfigurasi…" />}>
      <SettingsContent />
    </Suspense>
  );
}
