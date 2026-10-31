"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, logout, pickUser } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";
import { useToast } from "../../components/Toast";

// Setting akun customer.
// Jujur soal batasan: /api/v2 belum punya endpoint ubah profil /
// ganti password, jadi bagian "Akun saya" di bawah ini hanya
// menampilkan data dari /api/v2/me (read-only), dan preferensi di
// bawahnya disimpan lokal di browser (localStorage), bukan ke
// backend. Jangan berpura-pura preferensi itu tersimpan di server.
export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [reminder, setReminder] = useState(false);
  const [showPercent, setShowPercent] = useState(true);

  useEffect(() => {
    try {
      setReminder(localStorage.getItem("skincheck-reminder") === "1");
      setShowPercent(localStorage.getItem("skincheck-percent") !== "0");
    } catch {}
    let alive = true;
    getMe()
      .then((d) => { if (alive) setUser(pickUser(d)); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  function toggleReminder(v) {
    setReminder(v);
    try { localStorage.setItem("skincheck-reminder", v ? "1" : "0"); } catch {}
    toast.success("Preferensi tersimpan di browser ini.");
  }

  function togglePercent(v) {
    setShowPercent(v);
    try { localStorage.setItem("skincheck-percent", v ? "1" : "0"); } catch {}
    toast.success("Preferensi tersimpan di browser ini.");
  }

  async function onLogout() {
    try { await logout(); toast.success("Berhasil keluar."); setUser(null); }
    catch (e) { setError(e); }
  }

  return (
    <div className="me-shell">
      <h1 className="me-page-title">Setting Akun</h1>
      <p className="muted">Kelola akun dan preferensimu. Data akun di bawah berasal dari akun yang sedang login.</p>
      {loading && <Loading />}
      <ErrorBox error={error} />

      <div className="me-panels">
        <div className="me-panel">
          <h2>Akun saya</h2>
          {user && !loading ? (
            <>
              <p><strong>Nama:</strong> {user.name || "—"}</p>
              <p><strong>Email:</strong> {user.email || "—"}</p>
              <p><strong>Role:</strong> {user.role || "—"}</p>
              <p><strong>Status:</strong> {user.status || "—"}</p>
              <p className="muted">Ubah nama, email, dan ganti password belum tersedia di /api/v2, jadi bagian ini masih read-only. Kalau perlu diubah, hubungi admin.</p>
            </>
          ) : !loading && (
            <p>Belum masuk. <Link href="/login">Masuk</Link></p>
          )}
        </div>
        <div className="me-panel">
          <h2>Preferensi</h2>
          <p className="muted">Preferensi ini hanya tersimpan di browser ini, bukan di server.</p>
          <label className="me-check">
            <input type="checkbox" checked={reminder} onChange={(e) => toggleReminder(e.target.checked)} />
            Ingatkan saya untuk scan berkala
          </label>
          <label className="me-check">
            <input type="checkbox" checked={showPercent} onChange={(e) => togglePercent(e.target.checked)} />
            Tampilkan skor dalam persen (%)
          </label>
          <p className="muted">Bahasa antarmuka: Indonesia.</p>
        </div>
        <div className="me-panel">
          <h2>Keamanan & keluar</h2>
          <p className="muted">Keluar akan mengakhiri sesi di browser ini.</p>
          <button className="btn secondary" onClick={onLogout}>Keluar</button>
          <p><Link href="/dashboard">Kembali ke dashboard</Link> · <Link href="/history">Riwayat</Link></p>
        </div>
      </div>
    </div>
  );
}
