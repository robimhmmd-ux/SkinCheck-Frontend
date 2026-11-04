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
      <div className="ed-page" aria-busy="true" aria-label="Memuat ringkasan admin">
        <div className="ed-skeleton-title" />
        <div className="ed-skeleton-line" />
        <div className="ed-kpis">
          <div className="ed-skeleton-kpi" />
          <div className="ed-skeleton-kpi" />
          <div className="ed-skeleton-kpi" />
          <div className="ed-skeleton-kpi" />
        </div>
      </div>
    );
  }

  if (error && (error.status === 401 || error.status === 403)) {
    return (
      <div className="ed-page">
        <div className="ed-mast">
          <h1>Admin</h1>
          <p className="ed-lead">Halaman ini hanya untuk admin.</p>
        </div>
        <p className="muted">Jika kamu bukan admin, backend akan menolak akses. <Link href="/login">Masuk sebagai admin</Link> atau kembali ke <Link href="/dashboard">dashboard</Link>.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="ed-page">
        <div className="ed-mast">
          <h1>Admin</h1>
          <p className="ed-lead">Ringkasan admin tidak bisa dimuat saat ini.</p>
        </div>
        <ErrorBox error={error} />
        <p><button type="button" className="btn" onClick={() => window.location.reload()}>Coba lagi</button></p>
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
    <div className="ed-page">
      <div className="ed-mast">
        <h1>Admin</h1>
        <p className="ed-lead">Ringkasan akun, scan, dan katalog dari backend.</p>
      </div>

      <dl className="ed-kpis">
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

      <p className="muted">
        Endpoint admin saat ini hanya menyediakan angka ringkasan di atas — belum ada daftar
        pengguna atau scan, jadi belum ada yang bisa dikelola dari halaman ini.
        Katalog produk bisa dilihat di <Link href="/marketplace">marketplace</Link>.
      </p>
    </div>
  );
}
