"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Cinematic 3D Orbit Stage
 * Smooth continuous parametric rotation along an elliptical orbit.
 * Never stops on hover (continues rotating smoothly with interactive cursor flare).
 * Displays 5 compact VGG output cards rotating dynamically around the central avatar.
 */
export default function CinematicOrbitStage({ nodes }) {
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50, active: false });
  const animFrameRef = useRef(null);
  const angleRef = useRef(0);
  const [nodePositions, setNodePositions] = useState([]);

  // Calculate positions and opacities for all nodes
  const calculatePositions = (baseAngle) => {
    const total = nodes.length;
    return nodes.map((node, i) => {
      // Evenly distribute nodes along the 360-degree orbit
      const theta = baseAngle + (i * (2 * Math.PI)) / total;
      const x = Math.cos(theta); // -1 (left) to +1 (right)
      const y = Math.sin(theta); // +1 (front/lower) to -1 (back/upper)

      // Screen percentage positions relative to orbital stage
      const left = 50 + 44.5 * x;
      const top = 50 + 35 * y;

      // Opacity calculation based on orbit gradient transparency
      let opacity = 0;
      if (y > 0.04) {
        const t = Math.min(1, Math.max(0, (y - 0.04) / 0.40));
        opacity = t * t * (3 - 2 * t);
      }

      // 3D perspective scale: 0.88 to 1.08
      const scale = 0.88 + 0.18 * Math.max(0, y);
      const zIndex = y > 0 ? 5 : 2;

      return {
        ...node,
        left: `${left.toFixed(2)}%`,
        top: `${top.toFixed(2)}%`,
        opacity: Number(opacity.toFixed(3)),
        scale: Number(scale.toFixed(3)),
        zIndex,
        isFront: y > 0,
      };
    });
  };

  useEffect(() => {
    setNodePositions(calculatePositions(0));

    let lastTime = performance.now();
    // Smooth cinematic rotation speed
    const SPEED = (2 * Math.PI) / 30000;

    const tick = (now) => {
      const delta = now - lastTime;
      lastTime = now;

      // NEVER stop rotating when hovered; maintain continuous fluid glide
      const speedMultiplier = isHovered ? 1.15 : 1.0;
      angleRef.current = (angleRef.current + SPEED * speedMultiplier * delta) % (2 * Math.PI);
      setNodePositions(calculatePositions(angleRef.current));

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isHovered, nodes]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x, y, active: true });
  };

  return (
    <div
      className="hero-stage-canvas"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCursorPos((prev) => ({ ...prev, active: false }));
      }}
      onMouseMove={handleMouseMove}
      aria-label="Interaktif 3D Orbital Laomera"
    >
      {/* Efek Aurora Ethereal di Tengah Karakter Utama (Paling Atas Landing Page) */}
      <div className="hero-aurora-centerpiece" aria-hidden="true">
        <div className="hero-aurora-blob hero-blob-1" />
        <div className="hero-aurora-blob hero-blob-2" />
        <div className="hero-aurora-blob hero-blob-3" />
      </div>

      {/* Dynamic Cursor Flare Spotlight when hovering near orbital stage */}
      {cursorPos.active && (
        <div
          className="hero-cursor-orbital-glow"
          style={{
            position: "absolute",
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
            width: "360px",
            height: "360px",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(172, 200, 236, 0.45) 0%, rgba(255, 194, 13, 0.15) 35%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(28px)",
            pointerEvents: "none",
            zIndex: 1,
            transition: "opacity 0.25s ease",
          }}
          aria-hidden="true"
        />
      )}

      {/* SVG Orbital Track (Back Arc) */}
      <svg
        className="hero-orbital-svg hero-orbital-back"
        viewBox="0 0 1400 460"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="orbitBackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0" />
            <stop offset="30%" stopColor="#cbd5e1" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#cbd5e1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 40 220 A 660 180 0 0 1 1360 220"
          stroke="url(#orbitBackGrad)"
          strokeWidth="1.25"
        />
      </svg>

      {/* Character Center Frame with Soft Neck Blur */}
      <div className="hero-character-frame">
        <img
          src="/hero-face.png"
          alt="Karakter wanita dengan kulit sehat terawat dan pencahayaan iridesen halus"
          className="hero-character-photo"
        />
        <div className="hero-neck-blur-overlay" aria-hidden="true" />
      </div>

      {/* Front Arc: Streaming Particle Flow */}
      <svg
        className="hero-orbital-svg hero-orbital-front"
        viewBox="0 0 1400 460"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="orbitFrontGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0" />
            <stop offset="12%" stopColor="#cbd5e1" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#cbd5e1" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#d9882a" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#cbd5e1" stopOpacity="0.9" />
            <stop offset="88%" stopColor="#cbd5e1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbitStreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(217, 136, 42, 0)" />
            <stop offset="25%" stopColor="rgba(217, 136, 42, 0.45)" />
            <stop offset="50%" stopColor="rgba(233, 149, 125, 0.95)" />
            <stop offset="75%" stopColor="rgba(217, 136, 42, 0.45)" />
            <stop offset="100%" stopColor="rgba(217, 136, 42, 0)" />
          </linearGradient>
        </defs>

        <path
          d="M 1360 220 A 660 180 0 0 1 40 220"
          stroke="url(#orbitFrontGrad)"
          strokeWidth="1.3"
        />

        <path
          className="orbit-stream-flow-line"
          d="M 1360 220 A 660 180 0 0 1 40 220"
          stroke="url(#orbitStreamGrad)"
          strokeWidth="1.8"
          strokeDasharray="14 36"
        />
      </svg>

      {/* Orbiting Tethered Cards - 5 Output Klasifikasi VGG */}
      <div className="orbit-docked-nodes-desktop" aria-hidden="true">
        {nodePositions.map((pos) => (
          <div
            key={pos.id}
            className="orbit-vgg-compact-node"
            style={{
              left: pos.left,
              top: pos.top,
              opacity: pos.opacity,
              transform: `translate(-50%, -50%) scale(${pos.scale})`,
              zIndex: pos.zIndex,
              pointerEvents: pos.opacity > 0.35 ? "auto" : "none",
              visibility: pos.opacity === 0 ? "hidden" : "visible",
              willChange: "transform, opacity, left, top",
            }}
          >
            <div className="orbit-vgg-card-glass">
              <div className="orbit-vgg-card-top-row">
                <span
                  className="orbit-vgg-tag-badge"
                  style={{
                    backgroundColor: `${pos.color || "#071236"}18`,
                    color: pos.color || "#071236",
                    borderColor: `${pos.color || "#071236"}33`,
                  }}
                >
                  <span
                    className="orbit-vgg-live-dot"
                    style={{ backgroundColor: pos.color || "#071236" }}
                  />
                  VGG #{pos.outputIndex}
                </span>
                <span className="orbit-vgg-conf-pill">{pos.subtitle}</span>
              </div>
              <div className="orbit-vgg-card-title-row">
                <span className="orbit-vgg-title-text">{pos.title}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
