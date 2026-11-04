import { Playfair_Display } from "next/font/google";
import SiteHeader from "../components/SiteHeader";
import { ToastProvider } from "../components/Toast";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });

export const metadata = {
  title: "SkinCheck — Deteksi Kesehatan Kulit Wajah",
  description: "SkinCheck: aplikasi web untuk mendeteksi kondisi kulit wajah dan rekomendasi perawatan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={playfair.variable}>
      <body>
        <ToastProvider>
          <a className="gx-skip" href="#main">Lewati ke konten</a>
          <SiteHeader />
          <main id="main" className="container">{children}</main>
          <footer className="footer">
            SkinCheck — deteksi kesehatan kulit wajah.
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
