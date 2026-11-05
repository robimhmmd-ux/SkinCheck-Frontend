// Kartu penolakan bersama untuk semua halaman /admin/* ketika pengunjung
// bukan admin (401 belum login / 403 role customer). Bukan halaman kosong:
// pengguna selalu diberi tahu kenapa dan ke mana harus pergi.
"use client";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AdminDenied() {
  return (
    <div className="page-shell-wrap">
      <div className="glass-panel admin-denied-card">
        <div className="admin-denied-icon">
          <ShieldAlert size={36} />
        </div>
        <h2>Otoritas Terbatas</h2>
        <p className="muted">
          Halaman konsol ini dikhususkan untuk akun dengan hak akses administrator sistem Laomera.
        </p>
        <div className="admin-denied-actions">
          <Link href="/login" className="btn btn-primary btn-sm">
            Masuk sebagai Administrator
          </Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
