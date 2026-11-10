"use client";

import { useEffect, useState, useRef } from "react";

export default function WorkspaceLoadingScreen({
  caption = "Memuat Data…",
  active = true,
  skeleton = true,
  variant = "standalone", // "standalone" | "overlay" | "inline"
  children = null,
}) {
  const [visible, setVisible] = useState(active);
  const [isExiting, setIsExiting] = useState(false);
  const [displayCaption, setDisplayCaption] = useState(caption);
  const [captionFade, setCaptionFade] = useState("caption-visible");
  const exitTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  // Tangani transisi keluar secara perlahan (Smooth Fade-Out Exit)
  useEffect(() => {
    if (active) {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setVisible(true);
      setIsExiting(false);
    } else if (visible) {
      setIsExiting(true);
      exitTimerRef.current = setTimeout(() => {
        setVisible(false);
        setIsExiting(false);
      }, 400); // Sinkron dengan transition CSS 0.4s
    }

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [active, visible]);

  // Tangani pergantian teks caption secara continue tanpa mereset spinner
  useEffect(() => {
    if (caption && caption !== displayCaption) {
      setCaptionFade("caption-fading");
      fadeTimerRef.current = setTimeout(() => {
        setDisplayCaption(caption);
        setCaptionFade("caption-visible");
      }, 160);
    }

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [caption, displayCaption]);

  // Dengarkan event eksternal laomera-loading-caption untuk memperbarui caption dinamis
  useEffect(() => {
    function handleCaptionChange(e) {
      if (e.detail && typeof e.detail === "string" && e.detail !== displayCaption) {
        setCaptionFade("caption-fading");
        setTimeout(() => {
          setDisplayCaption(e.detail);
          setCaptionFade("caption-visible");
        }, 160);
      }
    }

    window.addEventListener("laomera-loading-caption", handleCaptionChange);
    return () => window.removeEventListener("laomera-loading-caption", handleCaptionChange);
  }, [displayCaption]);

  // Jika sudah tidak aktif dan transisi selesai, kembalikan konten anak (jika ada)
  if (!visible && !active) {
    return children || null;
  }

  const isOverlay = variant === "overlay";
  const canvasClasses = [
    "workspace-loading-canvas",
    isOverlay ? "loading-overlay" : "",
    isExiting ? "fading-out" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      {children}
      <div className={canvasClasses} aria-busy="true" aria-live="polite">
        {/* ── SKELETON CARDS GLASSMORPHISM (Latar Belakang Loading) ── */}
        {skeleton && (
          <div className="glass-skeleton-stage" aria-hidden="true">
            {/* Header Stage Skeleton */}
            <div className="glass-skeleton-topbar">
              <div className="glass-skeleton-col">
                <div className="glass-skeleton-shimmer glass-skeleton-title" />
                <div className="glass-skeleton-shimmer glass-skeleton-subtitle" />
              </div>
              <div className="glass-skeleton-row">
                <div className="glass-skeleton-shimmer glass-skeleton-pill" />
                <div className="glass-skeleton-shimmer glass-skeleton-btn" />
              </div>
            </div>

            {/* 4 Bento KPI Metric Cards Skeleton */}
            <div className="glass-skeleton-bento-grid">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="glass-skeleton-card glass-skeleton-kpi">
                  <div className="glass-skeleton-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div className="glass-skeleton-shimmer glass-skeleton-icon" />
                    <div className="glass-skeleton-shimmer glass-skeleton-badge" />
                  </div>
                  <div className="glass-skeleton-shimmer glass-skeleton-metric" />
                  <div className="glass-skeleton-shimmer glass-skeleton-line" style={{ width: "65%" }} />
                </div>
              ))}
            </div>

            {/* Main Content Bento Grid (Large Chart + Side List) */}
            <div className="glass-skeleton-main-grid">
              <div className="glass-skeleton-card glass-skeleton-large">
                <div className="glass-skeleton-row" style={{ justifyContent: "space-between", marginBottom: "12px" }}>
                  <div className="glass-skeleton-shimmer glass-skeleton-heading" />
                  <div className="glass-skeleton-shimmer glass-skeleton-pill" />
                </div>
                <div className="glass-skeleton-chart-placeholder">
                  <div className="glass-skeleton-chart-bar" style={{ height: "48%" }} />
                  <div className="glass-skeleton-chart-bar" style={{ height: "78%" }} />
                  <div className="glass-skeleton-chart-bar" style={{ height: "56%" }} />
                  <div className="glass-skeleton-chart-bar" style={{ height: "92%" }} />
                  <div className="glass-skeleton-chart-bar" style={{ height: "64%" }} />
                  <div className="glass-skeleton-chart-bar" style={{ height: "82%" }} />
                  <div className="glass-skeleton-chart-bar" style={{ height: "70%" }} />
                </div>
              </div>

              <div className="glass-skeleton-card glass-skeleton-side">
                <div className="glass-skeleton-shimmer glass-skeleton-heading" style={{ marginBottom: "10px" }} />
                {[0, 1, 2, 3].map((rowIdx) => (
                  <div key={rowIdx} className="glass-skeleton-row-item">
                    <div className="glass-skeleton-shimmer glass-skeleton-avatar" />
                    <div className="glass-skeleton-col" style={{ flex: 1, gap: "6px" }}>
                      <div className="glass-skeleton-shimmer glass-skeleton-line" style={{ width: "85%" }} />
                      <div className="glass-skeleton-shimmer glass-skeleton-line" style={{ width: "50%" }} />
                    </div>
                    <div className="glass-skeleton-shimmer glass-skeleton-pill" style={{ width: "55px", height: "24px" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 3D SPINNER STAGE TERPUSAT (CARDLESS) ── */}
        <div className="workspace-spinner-center">
          <div className="spinner" aria-hidden="true" />
          {displayCaption && (
            <div className={`spinner-caption ${captionFade}`}>
              {displayCaption}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
