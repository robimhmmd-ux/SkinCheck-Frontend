import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "SkinCheck — Deteksi Kesehatan Kulit Wajah",
  description: "SkinCheck: aplikasi web untuk mendeteksi kondisi kulit wajah dan rekomendasi perawatan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <Link className="brand" href="/">SkinCheck</Link>
          <nav className="nav">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/scan">Scan</Link>
            <Link href="/history">Riwayat</Link>
            <Link href="/assistant">Asisten</Link>
            <Link href="/profile">Profil</Link>
            <Link href="/login">Masuk</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          SkinCheck — frontend Next.js. Backend Python (FastAPI) dikonfigurasi lewat NEXT_PUBLIC_API_URL.
        </footer>
      </body>
    </html>
  );
}
