// Halaman /output sudah digabung ke /history ("Riwayat & Diagnosis").
// File ini hanya mengalihkan supaya tautan lama (mis. dari dashboard
// atau bookmark) tetap mendarat di tempat yang benar.
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loading } from "../../components/Notice";

export default function OutputPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/history");
  }, [router]);

  return (
    <div className="page-shell-wrap">
      <div className="glass-panel" style={{ padding: "48px 32px", textAlign: "center" }}>
        <Loading label="Diagnosis kini menyatu dengan Riwayat — mengalihkan…" />
        <p className="muted" style={{ marginTop: "16px" }}>
          Kalau tidak otomatis pindah,{" "}
          <Link href="/history" style={{ fontWeight: 600 }}>
            buka Riwayat &amp; Diagnosis
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
