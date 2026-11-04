"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    try { await logout(); toast.success("Berhasil keluar."); setUser(null); router.push("/login"); }
    catch (e) { setError(e); }
  }

  return (
    <div className="gx-page">
      <div className="gx-head">
        <h1 className="gx-title">Setting Akun</h1>
        <p className="gx-lead">Kelola akun dan preferensimu. Data akun di bawah berasal dari akun yang sedang login.</p>
      </div>
      {loading && <Loading />}
      <ErrorBox error={error} />

      <section className="gx-setting" aria-labelledby="account-heading">
        <div className="gx-setting-label">
          <h2 id="account-heading">Akun saya</h2>
          <p className="muted">Data dari akun yang sedang login. Bagian ini masih read-only karena /api/v2 belum punya endpoint ubah profil.</p>
        </div>
        <div className="gx-setting-panel">
        {user && !loading ? (
          <>
            <p className="gx-hero-num" style={{ margin: "8px 0" }}><b style={{ fontSize: "clamp(36px, 5vw, 52px)" }}>{user.name || "—"}</b></p>
            <dl className="gx-dl">
              <div><dt>Email</dt><dd>{user.email || "—"}</dd></div>
              <div><dt>Role</dt><dd>{user.role || "—"}</dd></div>
              <div><dt>Status</dt><dd>{user.status || "—"}</dd></div>
            </dl>
            <p className="muted">Ubah nama, email, dan ganti password belum tersedia di /api/v2. Kalau perlu diubah, hubungi admin.</p>
          </>
        ) : !loading && (
          <p>Belum masuk. <Link href="/login">Masuk</Link></p>
        )}
        </div>
      </section>

      <section className="gx-setting" aria-labelledby="prefs-heading">
        <div className="gx-setting-label">
          <h2 id="prefs-heading">Preferensi</h2>
          <p className="muted">Hanya tersimpan di browser ini, bukan di server.</p>
        </div>
        <div className="gx-setting-panel">
        <div className="ed-switch-row">
          <div>
            <strong>Ingatkan saya untuk scan berkala</strong>
            <p className="muted">Pengingat scan rutin di browser ini.</p>
          </div>
          <button type="button" className="ed-switch" role="switch" aria-checked={reminder} aria-label="Ingatkan saya untuk scan berkala" onClick={() => toggleReminder(!reminder)} />
        </div>
        <div className="ed-switch-row">
          <div>
            <strong>Tampilkan skor dalam persen</strong>
            <p className="muted">Skor tampil dengan tanda persen.</p>
          </div>
          <button type="button" className="ed-switch" role="switch" aria-checked={showPercent} aria-label="Tampilkan skor dalam persen" onClick={() => togglePercent(!showPercent)} />
        </div>
        <p className="muted">Bahasa antarmuka: Indonesia.</p>
        </div>
      </section>

      <section className="gx-setting" aria-labelledby="security-heading">
        <div className="gx-setting-label">
          <h2 id="security-heading">Keamanan dan keluar</h2>
          <p className="muted">Keluar akan mengakhiri sesi di browser ini.</p>
        </div>
        <div className="gx-setting-panel">
        <button className="btn secondary" onClick={onLogout}>Keluar</button>
        <p><Link href="/dashboard">Kembali ke dashboard</Link></p>
        <p><Link href="/history">Riwayat</Link></p>
        </div>
      </section>
    </div>
  );
}
