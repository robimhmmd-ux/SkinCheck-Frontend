// Modal verifikasi akun: memblokir pemakaian fitur customer sampai akun
// terverifikasi penuh. Dua tahap, sesuai status akun:
//   pending           -> verifikasi nomor WhatsApp dulu (kirim OTP, masukkan kode)
//   awaiting_biodata  -> lengkapi biodata (nama, umur, jenis kelamin)
// Sesudah biodata lengkap status jadi active dan modal menutup sendiri.
// Modal ini tidak bisa ditutup paksa (tidak ada tombol silang / klik luar) —
// yang bisa dilakukan pengguna hanyalah menyelesaikan verifikasi atau keluar.
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Smartphone, UserRound, LogOut } from "lucide-react";
import {
  getMe,
  logout,
  pickUser,
  requestFonnteOtp,
  verifyFonnteOtp,
  submitBiodata,
} from "../lib/api";
import { useToast } from "./Toast";
import WorkspaceLoadingScreen from "./WorkspaceLoadingScreen";

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "10px",
  border: "1px solid var(--border-subtle)",
  background: "#fff",
  fontSize: "14px",
};

export default function VerificationModal({ user, onDone }) {
  const router = useRouter();
  const toast = useToast();
  // Tahap awal mengikuti status akun dari sesi.
  const [step, setStep] = useState(user?.status === "awaiting_biodata" ? "biodata" : "otp");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bioBusy, setBioBusy] = useState(false);
  const [bioError, setBioError] = useState(null);
  const [logoutBusy, setLogoutBusy] = useState(false);

  // Kalau status akun berubah dari luar (mis. verifikasi lewat /verify-otp
  // di tab lain), ikuti tahapnya.
  useEffect(() => {
    if (user?.status === "awaiting_biodata") setStep("biodata");
    if (user?.status === "active") onDone?.();
  }, [user?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendOtp() {
    const p = phone.trim();
    if (!p) {
      setOtpError("Masukkan nomor WhatsApp kamu dulu.");
      return;
    }
    setOtpBusy(true);
    setOtpError(null);
    try {
      await requestFonnteOtp(p, user?.name || "");
      setOtpSent(true);
      toast.success("Kode OTP dikirim ke WhatsApp kamu.");
    } catch (err) {
      setOtpError(err.message || "Gagal mengirim kode OTP.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function confirmOtp() {
    const c = code.trim();
    if (!/^\d{6}$/.test(c)) {
      setOtpError("Kode OTP terdiri dari 6 angka.");
      return;
    }
    setOtpBusy(true);
    setOtpError(null);
    try {
      const res = await verifyFonnteOtp(phone.trim(), c);
      const ok = res && (res.verified === true || res?.verified);
      if (!ok) throw new Error("Kode OTP salah atau sudah kedaluwarsa.");
      toast.success("Nomor WhatsApp terverifikasi.");
      // Segarkan sesi supaya status jadi awaiting_biodata, lalu ke biodata.
      try {
        const me = await getMe();
        const u = pickUser(me);
        if (u?.status === "awaiting_biodata") {
          setStep("biodata");
          return;
        }
      } catch {
        // abaikan — lanjut ke biodata dari respons verify
      }
      setStep("biodata");
    } catch (err) {
      setOtpError(err.message || "Kode OTP salah atau sudah kedaluwarsa.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function submitBio() {
    const n = name.trim();
    const a = Number(age);
    if (!n) {
      setBioError("Nama wajib diisi.");
      return;
    }
    if (!Number.isInteger(a) || a < 5 || a > 120) {
      setBioError("Umur harus di antara 5 dan 120 tahun.");
      return;
    }
    if (gender !== "Laki-laki" && gender !== "Perempuan") {
      setBioError("Pilih jenis kelamin.");
      return;
    }
    setBioBusy(true);
    setBioError(null);
    try {
      const res = await submitBiodata({ name: n, age: a, gender });
      const done = res && (res.verification_complete === true || res?.user?.status === "active");
      if (!done) throw new Error("Biodata belum tersimpan.");
      toast.success("Verifikasi akun selesai. Semua fitur sudah bisa dipakai.");
      onDone?.();
    } catch (err) {
      setBioError(err.message || "Gagal menyimpan biodata.");
    } finally {
      setBioBusy(false);
    }
  }

  async function handleLogout() {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await logout();
    } catch {
      // tetap keluar walau panggilan logout gagal
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="modal-backdrop-overlay" role="presentation">
      <div
        className="modal-surface-card"
        role="dialog"
        aria-modal="true"
        aria-label="Selesaikan verifikasi akun"
        style={{ maxWidth: "520px", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              background: "var(--amber-100)",
              color: "var(--amber-700)",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </span>
          <h2 style={{ margin: 0, fontSize: "19px", fontFamily: "var(--font-serif)" }}>
            Selesaikan pengisian akun Anda untuk verifikasi
          </h2>
        </div>
        <p className="muted" style={{ fontSize: "13.5px", lineHeight: "1.6", margin: "0 0 18px" }}>
          Akun Anda sudah dibuat, tapi fitur customer masih terkunci. Selesaikan dua langkah ini
          — verifikasi nomor WhatsApp, lalu lengkapi biodata — supaya semua fitur bisa dipakai.
        </p>

        {step === "otp" ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700 }}>
              <Smartphone size={15} />
              <span>Langkah 1 dari 2 — Verifikasi nomor WhatsApp</span>
            </div>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Nomor WhatsApp</span>
              <input
                style={inputStyle}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                value={phone}
                disabled={otpSent}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            {!otpSent ? (
              <button type="button" className="btn btn-primary" disabled={otpBusy} onClick={sendOtp}>
                {otpBusy ? "Mengirim…" : "Kirim kode OTP"}
              </button>
            ) : (
              <>
                <label style={{ display: "grid", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Kode OTP (6 angka)</span>
                  <input
                    style={inputStyle}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" className="btn btn-primary" disabled={otpBusy} onClick={confirmOtp} style={{ flex: 1 }}>
                    {otpBusy ? "Memeriksa…" : "Verifikasi kode"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={otpBusy}
                    onClick={() => {
                      setOtpSent(false);
                      setCode("");
                      setOtpError(null);
                    }}
                  >
                    Ganti nomor
                  </button>
                </div>
              </>
            )}
            {otpError && <p style={{ color: "#b3261e", fontSize: "13px", margin: 0 }}>{otpError}</p>}
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700 }}>
              <UserRound size={15} />
              <span>Langkah 2 dari 2 — Lengkapi biodata akun</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              Nomor WhatsApp sudah terverifikasi. Tinggal biodata ini, lalu akun Anda aktif penuh.
            </p>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Nama lengkap</span>
              <input
                style={inputStyle}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Umur (tahun)</span>
                <input
                  style={inputStyle}
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={120}
                  placeholder="cth: 19"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </label>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Jenis kelamin</span>
                <select
                  style={inputStyle}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Pilih…</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </label>
            </div>
            <button type="button" className="btn btn-primary" disabled={bioBusy} onClick={submitBio}>
              {bioBusy ? "Menyimpan…" : "Simpan biodata & aktifkan akun"}
            </button>
            {bioError && <p style={{ color: "#b3261e", fontSize: "13px", margin: 0 }}>{bioError}</p>}
          </div>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={logoutBusy}
          onClick={handleLogout}
          style={{ marginTop: "18px" }}
        >
          <LogOut size={14} /> Keluar dulu, verifikasi nanti
        </button>

        <WorkspaceLoadingScreen
          active={otpBusy || bioBusy}
          caption={bioBusy ? "Menyimpan Biodata Akun…" : "Memverifikasi Akun…"}
          variant="overlay"
          skeleton={false}
        />
      </div>
    </div>
  );
}
