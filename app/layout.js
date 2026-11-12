import { Cormorant_Garamond, Inter } from "next/font/google";
import AppShell from "../components/AppShell";
import FloatingChatWidget from "../components/FloatingChatWidget";
import { ToastProvider } from "../components/Toast";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="id" className={`${cormorant.variable} ${inter.variable}`}>
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
          <AppShell>{children}</AppShell>
          <FloatingChatWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
