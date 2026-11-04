"use client";
import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";

// Shell: di landing ("/") tampilkan header pill lama + container lama
// agar landing tidak bergeser sama sekali; di halaman aplikasi pakai
// sidebar + container-side. Keputusan ini yang melindungi landing dari
// rombak tema, tanpa duplikasi markup halaman.
export default function Shell({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  return (
    <>
      <a className="gx-skip" href="#main">Lewati ke konten</a>
      <SiteHeader variant={isLanding ? "top" : "side"} />
      <main id="main" className={isLanding ? "container" : "container container-side"}>{children}</main>
      <footer className={isLanding ? "footer" : "footer footer-side"}>
        SkinCheck — deteksi kesehatan kulit wajah.
      </footer>
    </>
  );
}
