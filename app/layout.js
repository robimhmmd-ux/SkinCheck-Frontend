import { Playfair_Display, Fraunces, Instrument_Sans } from "next/font/google";
import Shell from "../components/Shell";
import { ToastProvider } from "../components/Toast";
import "./globals.css";

// Playfair dipertahankan HANYA untuk landing (via --font-playfair dan
// override pelindung di globals.css). Halaman aplikasi memakai Fraunces
// sebagai --font-display dan Instrument Sans sebagai --font-sans.
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-playfair" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

export const metadata = {
  title: "SkinCheck — Deteksi Kesehatan Kulit Wajah",
  description: "SkinCheck: aplikasi web untuk mendeteksi kondisi kulit wajah dan rekomendasi perawatan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${playfair.variable} ${fraunces.variable} ${instrument.variable}`}>
      <body>
        <ToastProvider>
          <Shell>{children}</Shell>
        </ToastProvider>
      </body>
    </html>
  );
}
