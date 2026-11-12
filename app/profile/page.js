"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Activity, 
  Bell, 
  Percent, 
  LogOut, 
  Clock, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { getMe, logout, pickUser, updateMyProfile } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";
import { useToast, ConfirmDialog } from "../../components/Toast";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();
  const [reminder, setReminder] = useState(false);
  const [showPercent, setShowPercent] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    try {
      setReminder(localStorage.getItem("skincheck-reminder") === "1");
      setShowPercent(localStorage.getItem("skincheck-percent") !== "0");
    } catch {}
    let alive = true;
    getMe()
      .then((d) => {
        if (!alive) return;
        const u = pickUser(d);
        setUser(u);
        setName(u?.name || "");
      })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  function toggleReminder(v) {
    setReminder(v);
    try { localStorage.setItem("skincheck-reminder", v ? "1" : "0"); } catch {}
    toast.success("Preferensi pengingat disimpan di perangkat ini.");
  }

  function togglePercent(v) {
    setShowPercent(v);
    try { localStorage.setItem("skincheck-percent", v ? "1" : "0"); } catch {}
    toast.success("Format tampilan skor diperbarui.");
  }

  async function onSaveName(e) {
    e.preventDefault();
    const next = name.trim();
    if (!next) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }
    setSaving(true);
    try {
      const d = await updateMyProfile({ name: next });
      const u = pickUser(d);
      if (u) {
        setUser(u);
        setName(u.name || next);
      }
      toast.success("Nama pengguna diperbarui.");
    } catch (err) {
      toast.error(err.message || "Gagal memperbarui nama.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    try { 
      await logout(); 
      toast.success("Anda berhasil logout."); 
      setUser(null); 
      router.push("/"); 
      router.refresh();
    } catch (e) { 
      setError(e); 
    }
  }

  return (
    <div className="page-shell-wrap">
      {/* ── Page Header ── */}
      <div className="profile-hero-header">
        <div className="badge badge-navy" style={{ margin: "0 auto 12px" }}>
          <User size={13} /> PUSAT AKUN & PREFERENSI
        </div>
        <h1 className="profile-title">Pengaturan Profil</h1>
        <p className="profile-subtitle">
          Kelola informasi sesi autentikasi dan kustomisasi preferensi tampilan skin check kamu.
        </p>
      </div>

      {loading && (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
          <Loading label="Memuat data profil pengguna…" />
        </div>
      )}

      <ErrorBox error={error} />

      <div className="profile-cards-stack">
        {/* ── Section 1: User Identity Card ── */}
        <div className="glass-panel profile-section-card">
          <div className="profile-card-header">
            <div className="profile-card-icon-bubble">
              <User size={20} />
            </div>
            <div>
              <h2 className="profile-section-title">Data Pengguna</h2>
              <p className="profile-section-desc">Informasi akun aktif dari sesi login backend.</p>
            </div>
          </div>

          <div className="profile-card-body">
            {user && !loading ? (
              <div className="user-profile-details">
                <div className="user-avatar-badge-row">
                  <div className="user-avatar-circle">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="user-name-role">
                    {/* Fallback nama tanpa "Laomera" (roboy 2026-11-12). */}
                    <h3 className="user-name-display">{user.name || "Pengguna"}</h3>
                    <div className="user-role-tags">
                      <span className="badge badge-amber">
                        <ShieldCheck size={12} /> {user.role || "Customer"}
                      </span>
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> {user.status || "Aktif"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="user-info-fields-grid">
                  <div className="user-field-card">
                    <span className="field-label">
                      <Mail size={13} /> Alamat Email
                    </span>
                    <strong className="field-value">{user.email || "—"}</strong>
                  </div>
                  <div className="user-field-card">
                    <span className="field-label">
                      <ShieldCheck size={13} /> Tingkat Izin
                    </span>
                    <strong className="field-value" style={{ textTransform: "capitalize" }}>
                      {user.role || "Member"}
                    </strong>
                  </div>
                </div>

                <div className="profile-info-footnote">
                  <p className="muted" style={{ margin: 0, fontSize: "12.5px" }}>
                    Nama pengguna dapat diubah di bawah ini. Email tidak dapat diubah.
                  </p>
                </div>

                <form onSubmit={onSaveName} style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
                  <label style={{ display: "grid", gap: "4px" }}>
                    {/* Label navy (roboy 2026-11-12, desain.md §1.3): tadinya putih di atas kartu terang. */}
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>Nama pengguna</span>
                    <input
                      value={name}
                      required
                      className="app-text-input"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label style={{ display: "grid", gap: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>Email (tidak dapat diubah)</span>
                    <input
                      value={user.email || ""}
                      disabled
                      className="app-text-input"
                      style={{ opacity: 0.65, cursor: "not-allowed" }}
                    />
                  </label>
                  <div>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                      {saving ? "Menyimpan…" : "Simpan Nama"}
                    </button>
                  </div>
                </form>
              </div>
            ) : !loading && (
              <div className="profile-unauthenticated-box">
                <p className="muted">Kamu sedang tidak terautentikasi.</p>
                <Link href="/login" className="btn btn-primary btn-sm">
                  Masuk ke Akun
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: Local Preferences ── */}
        <div className="glass-panel profile-section-card">
          <div className="profile-card-header">
            <div className="profile-card-icon-bubble">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="profile-section-title">Preferensi Aplikasi</h2>
              <p className="profile-section-desc">Kustomisasi tersimpan di browser untuk pengalaman optimal.</p>
            </div>
          </div>

          <div className="profile-card-body">
            <div className="pref-toggle-list">
              <div className="pref-toggle-row">
                <div className="pref-toggle-info">
                  <div className="pref-toggle-title">
                    <Bell size={16} /> Pengingat Sesi Rutin
                  </div>
                  <p className="pref-toggle-caption">
                    Kirim notifikasi pengingat untuk memeriksa progres kulit secara terjadwal.
                  </p>
                </div>
                <button
                  type="button"
                  className={`app-switch ${reminder ? "active" : ""}`}
                  role="switch"
                  aria-checked={reminder}
                  aria-label="Pengingat scan rutin"
                  onClick={() => toggleReminder(!reminder)}
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="pref-toggle-row">
                <div className="pref-toggle-info">
                  <div className="pref-toggle-title">
                    <Percent size={16} /> Format Persentase Skor
                  </div>
                  <p className="pref-toggle-caption">
                    Tampilkan metrik diagnosa dalam format rasio persen absolut (mis. 88%).
                  </p>
                </div>
                <button
                  type="button"
                  className={`app-switch ${showPercent ? "active" : ""}`}
                  role="switch"
                  aria-checked={showPercent}
                  aria-label="Format skor persen"
                  onClick={() => togglePercent(!showPercent)}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Security & Session Actions ── */}
        <div className="glass-panel profile-section-card">
          <div className="profile-card-header">
            <div className="profile-card-icon-bubble" style={{ background: "var(--crimson-100)", color: "var(--crimson-500)" }}>
              <LogOut size={20} />
            </div>
            <div>
              <h2 className="profile-section-title">Sesi & Keamanan</h2>
              <p className="profile-section-desc">Manajemen sesi login pada perangkat saat ini.</p>
            </div>
          </div>

          <div className="profile-card-body session-actions-wrap">
            <p className="muted" style={{ fontSize: "13.5px" }}>
              Keluar akan mengosongkan token otentikasi aktif di peramban ini. Kamu perlu masuk kembali untuk mengakses riwayat dan dossier.
            </p>
            <div className="session-buttons-cluster">
              <button className="btn btn-secondary" onClick={() => setConfirmLogout(true)} style={{ color: "var(--crimson-500)", borderColor: "rgba(197, 48, 48, 0.25)" }}>
                <LogOut size={16} /> Keluar dari Sesi
              </button>
              <Link href="/dashboard" className="btn btn-primary">
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Yakin mau keluar?"
        message="Sesi kamu akan diakhiri dan kamu perlu masuk kembali untuk mengakses riwayat dan diagnosis."
        confirmLabel="Ya, keluar"
        onConfirm={() => {
          setConfirmLogout(false);
          onLogout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
