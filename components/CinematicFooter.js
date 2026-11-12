"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Camera, Bot, Sparkles, ArrowUp, ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger safely for Next.js SSR/client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. INLINE STYLES ADAPTIF SESUAI SISTEM DESAIN LAOMERA
// Base: #acc8ec | Midnight Navy: #071236 | Sunflower Yellow: #FFC20D
// -------------------------------------------------------------------------
const STYLES = `
.cinematic-footer-wrapper {
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
  background: #071236;
  color: #ffffff;
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.9; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(255, 194, 13, 0.6)); }
  15%, 45% { transform: scale(1.22); filter: drop-shadow(0 0 12px rgba(255, 194, 13, 0.95)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 32s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Grid Latar Halus */
.footer-bg-grid {
  background-size: 54px 54px;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  mask-image: radial-gradient(circle at center, black 40%, transparent 85%);
  -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 85%);
}

/* Aurora Glow Sesuai Warna Project: Navy & Kuning Keemasan */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(255, 194, 13, 0.16) 0%, 
    rgba(172, 200, 236, 0.14) 35%, 
    transparent 70%
  );
}

/* Glass Pill Styling (Glassmorphism Laomera) */
.footer-glass-pill {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 
      0 10px 30px -10px rgba(0, 0, 0, 0.45), 
      inset 0 1px 1px rgba(255, 255, 255, 0.25), 
      inset 0 -1px 2px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  color: #ffffff;
}

.footer-glass-pill:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 194, 13, 0.65);
  box-shadow: 
      0 16px 36px -10px rgba(0, 0, 0, 0.6), 
      0 0 18px rgba(255, 194, 13, 0.25),
      inset 0 1px 1px rgba(255, 255, 255, 0.4);
  color: #FFC20D;
}

/* Pill Utama (Aksen Kuning) */
.footer-glass-pill-primary {
  background: linear-gradient(135deg, #FFC20D 0%, #e5ac07 100%);
  color: #071236 !important;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 10px 28px rgba(255, 194, 13, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.6);
}

.footer-glass-pill-primary:hover {
  background: linear-gradient(135deg, #ffd034 0%, #FFC20D 100%);
  box-shadow: 0 14px 36px rgba(255, 194, 13, 0.55), 0 0 20px rgba(255, 194, 13, 0.4);
  transform: translateY(-2px);
  color: #030a21 !important;
}

/* Teks Raksasa Latar Belakang (LAOMERA) */
.footer-giant-bg-text {
  font-family: var(--font-display), "Playfair Display", Georgia, serif;
  font-size: clamp(80px, 22vw, 320px);
  line-height: 0.72;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 194, 13, 0.2);
  background: linear-gradient(180deg, rgba(255, 194, 13, 0.32) 0%, rgba(172, 200, 236, 0.08) 55%, transparent 95%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Teks Glow Judul */
.footer-text-glow {
  background: linear-gradient(180deg, #ffffff 40%, #acc8ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 2px 24px rgba(172, 200, 236, 0.35));
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON WRAPPER (GSAP Mouse Spring)
// -------------------------------------------------------------------------
function MagneticButton({ children, className = "", as = "button", ...props }) {
  const localRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const element = localRef.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      const handleMouseMove = (e) => {
        const rect = element.getBoundingClientRect();
        const h = rect.width / 2;
        const w = rect.height / 2;
        const x = e.clientX - rect.left - h;
        const y = e.clientY - rect.top - w;

        gsap.to(element, {
          x: x * 0.35,
          y: y * 0.35,
          rotationX: -y * 0.12,
          rotationY: x * 0.12,
          scale: 1.04,
          ease: "power2.out",
          duration: 0.35,
        });
      };

      const handleMouseLeave = () => {
        gsap.to(element, {
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          ease: "elastic.out(1, 0.35)",
          duration: 1.1,
        });
      };

      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, element);

    return () => ctx.revert();
  }, []);

  const Component = as;
  return (
    <Component
      ref={localRef}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

// -------------------------------------------------------------------------
// 3. MARQUEE BANNER CONTENT
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: "28px", padding: "0 20px" }}>
    <span>VISI KOMPUTER DEEP LEARNING</span> <span style={{ color: "var(--sunflower-yellow, #FFC20D)" }}>✦</span>
    <span>DETEKSI 5 PILAR KULIT WAJAH</span> <span style={{ color: "#acc8ec" }}>✦</span>
    <span>ANALISIS STRATUM KORNEUM OBJEKTIF</span> <span style={{ color: "var(--sunflower-yellow, #FFC20D)" }}>✦</span>
    <span>ASISTEN DERMATOLOGI AI REAL-TIME</span> <span style={{ color: "#acc8ec" }}>✦</span>
    <span>REKOMENDASI FORMULASI TERKONTROL</span> <span style={{ color: "var(--sunflower-yellow, #FFC20D)" }}>✦</span>
    <span>PRIVASI BIOMETRIK TERJAGA</span> <span style={{ color: "var(--sunflower-yellow, #FFC20D)" }}>✦</span>
  </div>
);

// -------------------------------------------------------------------------
// 4. MAIN CINEMATIC FOOTER COMPONENT
// -------------------------------------------------------------------------
export default function CinematicFooter() {
  const wrapperRef = useRef(null);
  const giantTextRef = useRef(null);
  const headingRef = useRef(null);
  const linksRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      // Background Parallax for Giant LAOMERA Text
      if (giantTextRef.current) {
        gsap.fromTo(
          giantTextRef.current,
          { y: "12vh", scale: 0.82, opacity: 0 },
          {
            y: "0vh",
            scale: 1,
            opacity: 1,
            ease: "power1.out",
            scrollTrigger: {
              trigger: wrapperRef.current,
              start: "top 85%",
              end: "bottom bottom",
              scrub: 1,
            },
          }
        );
      }

      // Staggered Content Reveal
      if (headingRef.current && linksRef.current) {
        gsap.fromTo(
          [headingRef.current, linksRef.current],
          { y: 55, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.16,
            ease: "power3.out",
            scrollTrigger: {
              trigger: wrapperRef.current,
              start: "top 45%",
              end: "bottom bottom",
              scrub: 1,
            },
          }
        );
      }
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* 
        The "Curtain Reveal" Wrapper:
        Sits in standard flow. Because it has clipPath, its contents
        are ONLY visible within its bounding box, revealing the fixed
        cinematic footer underneath as the user scrolls to the bottom.
      */}
      <div
        ref={wrapperRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)",
        }}
      >
        <footer
          className="cinematic-footer-wrapper"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          {/* Ambient Light */}
          <div
            className="footer-aurora animate-footer-breathe"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "min(85vw, 1100px)",
              height: "65vh",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              filter: "blur(90px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
            aria-hidden="true"
          />

          {/* Giant Background Text Masking */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text"
            style={{
              position: "absolute",
              bottom: "-4vh",
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              zIndex: 0,
              pointerEvents: "none",
              userSelect: "none",
            }}
            aria-hidden="true"
          >
            LAOMERA
          </div>

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              left: 0,
              width: "100%",
              overflow: "hidden",
              borderTop: "1px solid rgba(255, 194, 13, 0.25)",
              borderBottom: "1px solid rgba(255, 194, 13, 0.25)",
              background: "rgba(4, 10, 32, 0.72)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              padding: "14px 0",
              zIndex: 10,
              transform: "rotate(-1.8deg) scale(1.08)",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div
              className="animate-footer-scroll-marquee"
              style={{
                display: "flex",
                width: "max-content",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "rgba(255, 255, 255, 0.8)",
                textTransform: "uppercase",
              }}
            >
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* 2. Main Center Content */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              flex: 1,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 20px",
              marginTop: "80px",
              width: "100%",
              maxWidth: "1020px",
              margin: "80px auto 0",
              textAlign: "center",
            }}
          >
            <h2
              ref={headingRef}
              className="footer-text-glow"
              style={{
                fontFamily: 'var(--font-display), "Playfair Display", Georgia, serif',
                fontSize: "clamp(32px, 5.2vw, 68px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.12,
                marginBottom: "20px",
              }}
            >
              Siap Mentransformasi<br />Kesehatan Kulitmu?
            </h2>

            <p
              style={{
                color: "rgba(226, 232, 240, 0.85)",
                fontSize: "clamp(14px, 1.4vw, 16.5px)",
                maxWidth: "620px",
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              Dapatkan evaluasi 5 pilar kesehatan kulit secara objektif dengan visi komputer deep learning, dipandu formulasi terverifikasi.
            </p>

            {/* Interactive Magnetic Pills Layout */}
            <div
              ref={linksRef}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                width: "100%",
              }}
            >
              {/* Primary Action Buttons */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "14px",
                  width: "100%",
                }}
              >
                <MagneticButton
                  as={Link}
                  href="/scan"
                  className="footer-glass-pill footer-glass-pill-primary"
                  style={{
                    padding: "14px 28px",
                    borderRadius: "9999px",
                    fontSize: "15px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: "none",
                  }}
                >
                  <Camera size={19} aria-hidden="true" />
                  <span>Mulai Scan Wajah</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </MagneticButton>

                <MagneticButton
                  as={Link}
                  href="/assistant"
                  className="footer-glass-pill"
                  style={{
                    padding: "14px 28px",
                    borderRadius: "9999px",
                    fontSize: "15px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: "none",
                  }}
                >
                  <Bot size={19} color="var(--sunflower-yellow, #FFC20D)" aria-hidden="true" />
                  <span>Konsultasi Asisten AI</span>
                </MagneticButton>
              </div>

              {/* Secondary Quick Nav Pills */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  marginTop: "6px",
                }}
              >
                <MagneticButton
                  as="a"
                  href="#tentang"
                  className="footer-glass-pill"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    color: "rgba(255, 255, 255, 0.75)",
                    textDecoration: "none",
                  }}
                >
                  Teknologi Orbital
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href="#visi"
                  className="footer-glass-pill"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    color: "rgba(255, 255, 255, 0.75)",
                    textDecoration: "none",
                  }}
                >
                  5 Output AI (VGG)
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href="#fitur"
                  className="footer-glass-pill"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    color: "rgba(255, 255, 255, 0.75)",
                    textDecoration: "none",
                  }}
                >
                  Keunggulan Sistem
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar / Credits */}
          <div
            style={{
              position: "relative",
              zIndex: 20,
              width: "100%",
              padding: "18px 32px 28px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Copyright */}
            <div
              style={{
                color: "rgba(226, 232, 240, 0.6)",
                fontSize: "11.5px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              © 2026 Laomera Platform. Seluruh hak cipta dilindungi.
            </div>

            {/* "Crafted with Love" Badge */}
            <div
              className="footer-glass-pill"
              style={{
                padding: "8px 18px",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                cursor: "default",
              }}
            >
              <span style={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>Crafted with</span>
              <span className="animate-footer-heartbeat" style={{ color: "#FFC20D", fontSize: "14px" }}>✦</span>
              <span style={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>for</span>
              <span style={{ color: "#ffffff", fontWeight: 800 }}>Smart Healthcare AI</span>
            </div>

            {/* Back to top Button */}
            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="footer-glass-pill"
              aria-label="Kembali ke atas"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <ArrowUp size={18} />
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}
