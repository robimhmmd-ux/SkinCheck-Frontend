"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, logout, pickUser } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    getMe()
      .then((d) => { if (alive) setUser(pickUser(d)); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  async function onLogout() {
    try { await logout(); setMsg("Berhasil keluar."); setUser(null); }
    catch (e) { setError(e); }
  }

  return (
    <div className="card">
      <h1>Profil</h1>
      {loading && <Loading />}
      <ErrorBox error={error} />
      {msg && <div className="ok">{msg}</div>}
      {user && !loading && (
        <>
          <p><strong>Nama:</strong> {user.name || "—"}</p>
          <p><strong>Email:</strong> {user.email || "—"}</p>
          <p><strong>Role:</strong> {user.role || "—"}</p>
          <p><strong>Status:</strong> {user.status || "—"}</p>
          <button className="btn secondary" onClick={onLogout}>Keluar</button>
        </>
      )}
      {error && error.status === 401 && <p>Belum masuk. <Link href="/login">Masuk</Link></p>}
    </div>
  );
}
