import { Playfair_Display, Fraunces, Instrument_Sans } from "next/font/google";
import SiteHeader from "../components/SiteHeader";
import FloatingChatWidget from "../components/FloatingChatWidget";
import { ToastProvider } from "../components/Toast";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-playfair" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: "Laomera — Deteksi Kesehatan Kulit Wajah & Rekomendasi AI",
  description: "Aplikasi web cerdas untuk menganalisis 5 kondisi kulit wajah dan rekomendasi perawatan terpersonalisasi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${playfair.variable} ${fraunces.variable} ${instrument.variable}`}>
      <body>
        <ToastProvider>
          <a
            className="gx-skip"
            href="#main"
            style={{
              position: "absolute",
              top: "-9999px",
              left: "-9999px",
            }}
          >
            Lewati ke konten
          </a>
          <SiteHeader />
          <main id="main" className="app-main-viewport">
            {children}
          </main>
          <FloatingChatWidget />
          <footer className="site-footer-bar">
            <div className="content-canvas footer-inner">
              <p className="footer-brand-title">Laomera</p>
              <p className="footer-tagline">
                Sistem Evaluasi Kesehatan Kulit Wajah Berbasis Kecerdasan Buatan & Rekomendasi Formulasi Terkurasi.
              </p>
              <div className="footer-meta-row">
                <span>© 2026 Laomera Platform. Seluruh hak cipta dilindungi.</span>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
