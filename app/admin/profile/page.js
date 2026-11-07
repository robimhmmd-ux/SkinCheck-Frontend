"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "../../../components/Notice";

export default function AdminProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Alihkan navigasi langsung ke bilah konfigurasi akun administrator
    router.replace("/admin/settings?tab=admin");
  }, [router]);

  return (
    <div className="page-shell-wrap">
      <div className="glass-panel" style={{ padding: "48px", textAlign: "center" }}>
        <Loading label="Mengalihkan ke Bilah Konfigurasi Akun Admin…" />
      </div>
    </div>
  );
}
