"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminSummary, pickObject } from "../../lib/api";
import { ErrorBox } from "../../components/Notice";

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

  if (loading) {
    return (
      <div className="dash" aria-busy="true" aria-label="Memuat ringkasan admin">
        <div className="dash-skeleton-title" />
        <div className="dash-skeleton-line" />
        <div className="dash-kpis">
          <div className="dash-skeleton-kpi" />
          <div className="dash-skeleton-kpi" />
          <div className="dash-skeleton-kpi" />
          <div className="dash-skeleton-kpi" />
        </div>
      </div>
    );
  }

  if (error && (error.status === 401 || error.status === 403)) {
    return (
      <div className="dash">
        <h1 className="dash-title">Admin</h1>
        <p className="dash-lead">Halaman ini hanya untuk admin.</p>
        <p className="dash-note">Jika kamu bukan admin, backend akan menolak akses. <Link href="/login">Masuk sebagai admin</Link> atau kembali ke <Link href="/dashboard">dashboard</Link>.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dash">
        <h1 className="dash-title">Admin</h1>
        <p className="dash-lead">Ringkasan admin tidak bisa dimuat saat ini.</p>
        <ErrorBox error={error} />
        <p><button type="button" className="dash-cta" onClick={() => window.location.reload()}>Coba lagi</button></p>
      </div>
    );
  }

  // Bentuk respons backend /api/v2/admin/summary apa adanya:
  // users, scans, products, active_products. Tidak ada daftar
  // pengguna atau scan di endpoint ini, jadi halaman ini tidak
  // menampilkan tabel kelola — tabel itu butuh endpoint backend baru.
  const users = data.users ?? "—";
  const scans = data.scans ?? "—";
  const products = data.products ?? "—";
  const activeProducts = data.active_products ?? "—";

  return (
    <div className="dash">
      <h1 className="dash-title">Admin</h1>
      <p className="dash-lead">Ringkasan akun, scan, dan katalog dari backend.</p>

      <dl className="dash-kpis">
        <div>
          <dt>Total pengguna</dt>
          <dd>{users}</dd>
        </div>
        <div>
          <dt>Total scan</dt>
          <dd>{scans}</dd>
        </div>
        <div>
          <dt>Total produk</dt>
          <dd>{products}</dd>
        </div>
        <div>
          <dt>Produk aktif</dt>
          <dd>{activeProducts}</dd>
        </div>
      </dl>

      <p className="dash-note">
        Endpoint admin saat ini hanya menyediakan angka ringkasan di atas — belum ada daftar
        pengguna atau scan, jadi belum ada yang bisa dikelola dari halaman ini.
        Katalog produk bisa dilihat di <Link href="/marketplace">marketplace</Link>.
      </p>
    </div>
  );
}
