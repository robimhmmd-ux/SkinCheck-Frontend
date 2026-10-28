"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminSummary, pickObject } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/Notice";

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getAdminSummary()
      .then((d) => { if (alive) setData(pickObject(d)); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="card">
      <h1>Admin</h1>
      {loading && <Loading />}
      <ErrorBox error={error} />
      {error && (error.status === 401 || error.status === 403) && (
        <p className="notice">Halaman ini hanya untuk admin. Jika kamu bukan admin, backend akan menolak akses. <Link href="/login">Masuk sebagai admin</Link> atau kembali ke <Link href="/dashboard">dashboard</Link>.</p>
      )}
      {data && !error && (
        <>
          <div className="grid">
            <div className="card"><h3>Total pengguna</h3><b>{data.total_users ?? data.users ?? "—"}</b></div>
            <div className="card"><h3>Total scan</h3><b>{data.total_scans ?? data.scans ?? "—"}</b></div>
            <div className="card"><h3>Total produk</h3><b>{data.total_products ?? data.products ?? "—"}</b></div>
          </div>
          <details><summary>Data mentah (debug)</summary><pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(data, null, 2)}</pre></details>
        </>
      )}
    </div>
  );
}
