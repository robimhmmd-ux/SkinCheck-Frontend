"use client";

import React, { useEffect, useRef } from "react";

/**
 * HairAuroraWaves
 * Merender gelombang aurora bercahaya halus yang mengalir secara organik
 * dari area rambut karakter wanita ke arah kanan.
 * Bergelombang dinamis seperti sutra kosmik dan berangsur-angsur menghilang
 * (fade-out) di ujung kanan kanvas.
 */
export default function HairAuroraWaves({
  className = "",
  style = {},
  opacity = 1.0,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth || 1200;
      height = canvas.offsetHeight || 600;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // 6 pita gelombang aurora yang presisi mengalir keluar dari helai rambut wanita
    const ribbons = [
      {
        yRatio: 0.08, // Puncak mahkota rambut paling atas
        amp: 28,
        freq: 0.010,
        speed: 0.0022,
        phase: 0,
        thickness: 18,
        colorStart: "rgba(0, 242, 254, 0.90)",
        colorMid: "rgba(79, 172, 254, 0.65)",
        colorEnd: "rgba(0, 82, 212, 0)",
      },
      {
        yRatio: 0.13, // Rambut bagian atas / kening atas
        amp: 36,
        freq: 0.0095,
        speed: 0.0028,
        phase: 1.4,
        thickness: 24,
        colorStart: "rgba(79, 172, 254, 0.85)",
        colorMid: "rgba(0, 242, 254, 0.70)",
        colorEnd: "rgba(7, 18, 54, 0)",
      },
      {
        yRatio: 0.18, // Aliran rambut pelipis belakang
        amp: 42,
        freq: 0.0115,
        speed: 0.0020,
        phase: 2.8,
        thickness: 26,
        colorStart: "rgba(0, 250, 210, 0.90)", // Sentuhan aqua emerald aurora
        colorMid: "rgba(0, 242, 254, 0.65)",
        colorEnd: "rgba(0, 82, 212, 0)",
      },
      {
        yRatio: 0.24, // Aliran rambut lateral di belakang telinga
        amp: 38,
        freq: 0.0105,
        speed: 0.0025,
        phase: 4.1,
        thickness: 22,
        colorStart: "rgba(79, 172, 254, 0.80)",
        colorMid: "rgba(112, 0, 255, 0.45)", // Sentuhan violet celestial
        colorEnd: "rgba(7, 18, 54, 0)",
      },
      {
        yRatio: 0.30, // Aliran rambut tengkuk belakang
        amp: 30,
        freq: 0.0125,
        speed: 0.0018,
        phase: 5.5,
        thickness: 16,
        colorStart: "rgba(0, 242, 254, 0.75)",
        colorMid: "rgba(79, 172, 254, 0.50)",
        colorEnd: "rgba(0, 82, 212, 0)",
      },
      {
        yRatio: 0.16, // Filamen inti berkilau tajam di tengah gelombang rambut
        amp: 40,
        freq: 0.011,
        speed: 0.0031,
        phase: 0.7,
        thickness: 5,
        colorStart: "rgba(255, 255, 255, 0.95)", // Putih kilau aurora
        colorMid: "rgba(0, 242, 254, 0.80)",
        colorEnd: "rgba(0, 82, 212, 0)",
      },
    ];

    let time = 0;

    const render = () => {
      animRef.current = requestAnimationFrame(render);
      if (!isVisibleRef.current) return;

      time += 16;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "screen";

      // Titik mulai pas di helai rambut wanita (sekitar 28% - 30% dari kiri, di belakang wajah)
      const startX = width * 0.29;
      const endX = width * 0.95;
      const waveLength = endX - startX;

      ribbons.forEach((ribbon) => {
        const centerY = height * ribbon.yRatio;

        // Gradient linier horizontal yang berangsur memudar di ujung kanan
        const grad = ctx.createLinearGradient(startX, 0, endX, 0);
        grad.addColorStop(0, "rgba(0, 242, 254, 0)");              // Akar rambut
        grad.addColorStop(0.06, ribbon.colorStart);                 // Berpendar terang di rambut
        grad.addColorStop(0.35, ribbon.colorMid);                   // Gelombang utama
        grad.addColorStop(0.68, "rgba(0, 82, 212, 0.30)");         // Mulai meluruh
        grad.addColorStop(0.92, "rgba(7, 18, 54, 0)");             // Hilang total di ujung
        grad.addColorStop(1, "rgba(7, 18, 54, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();

        const step = 5;
        let first = true;

        // 1. Gambar Batas Atas Pita Gelombang
        for (let x = startX; x <= endX; x += step) {
          const progress = (x - startX) / waveLength; // 0 hingga 1

          // Amplop: Muncul cepat di rambut (0 - 0.15), lalu berangsur mengecil dan memudar ke 0
          const fadeIn = Math.min(1, progress / 0.12);
          const fadeOut = Math.pow(Math.max(0, 1 - progress), 1.35);
          const envelope = fadeIn * fadeOut;

          // Pergerakan gelombang sinus harmonik ganda yang mengalir ke arah kanan
          const w1 = Math.sin(x * ribbon.freq - time * ribbon.speed + ribbon.phase);
          const w2 = Math.cos(x * (ribbon.freq * 0.6) - time * (ribbon.speed * 0.7) + ribbon.phase);
          const waveOffset = (w1 * 0.7 + w2 * 0.3) * ribbon.amp * envelope;

          const currentThickness = ribbon.thickness * Math.max(0.05, 1 - progress * 0.85);
          const y = centerY + waveOffset - currentThickness * 0.5;

          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }

        // 2. Gambar Batas Bawah Pita Gelombang (Arah Mundur)
        for (let x = endX; x >= startX; x -= step) {
          const progress = (x - startX) / waveLength;
          const fadeIn = Math.min(1, progress / 0.12);
          const fadeOut = Math.pow(Math.max(0, 1 - progress), 1.35);
          const envelope = fadeIn * fadeOut;

          const w1 = Math.sin(x * ribbon.freq - time * ribbon.speed + ribbon.phase);
          const w2 = Math.cos(x * (ribbon.freq * 0.6) - time * (ribbon.speed * 0.7) + ribbon.phase);
          const waveOffset = (w1 * 0.7 + w2 * 0.3) * ribbon.amp * envelope;

          const currentThickness = ribbon.thickness * Math.max(0.05, 1 - progress * 0.85);
          const y = centerY + waveOffset + currentThickness * 0.5;

          ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();

        // 3. Garis Filamen Bercahaya di Tengah Gelombang
        ctx.strokeStyle = grad;
        ctx.lineWidth = ribbon.thickness <= 8 ? 2.0 : 1.2;
        ctx.beginPath();
        let firstCore = true;

        for (let x = startX; x <= endX; x += step) {
          const progress = (x - startX) / waveLength;
          const fadeIn = Math.min(1, progress / 0.12);
          const fadeOut = Math.pow(Math.max(0, 1 - progress), 1.45);
          const envelope = fadeIn * fadeOut;

          const w1 = Math.sin(x * ribbon.freq - time * ribbon.speed + ribbon.phase);
          const w2 = Math.cos(x * (ribbon.freq * 0.6) - time * (ribbon.speed * 0.7) + ribbon.phase);
          const waveOffset = (w1 * 0.7 + w2 * 0.3) * ribbon.amp * envelope;
          const y = centerY + waveOffset;

          if (firstCore) {
            ctx.moveTo(x, y);
            firstCore = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={`hair-aurora-canvas-wrap ${className}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 3,
        overflow: "hidden",
        opacity,
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          filter: "blur(4px)",
        }}
      />
    </div>
  );
}
