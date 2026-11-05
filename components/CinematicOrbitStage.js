"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Cinematic 3D Orbit Stage
 * Smooth continuous parametric rotation along an elliptical orbit.
 * Nodes seamlessly fade to opacity 0 as they approach the transparent gradient
 * edges of the orbit, and fade back in as they sweep into the luminous front arc.
 */
export default function CinematicOrbitStage({ nodes }) {
  const [isHovered, setIsHovered] = useState(false);
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

      // Screen percentage positions relative to the 1400x460 orbital stage
      const left = 50 + 44.5 * x;
      const top = 50 + 35 * y;

      // Opacity calculation based on orbit gradient transparency:
      // Front center (y >= 0.45) is fully solid (opacity = 1.0).
      // Approaching edges (y between 0.45 and 0.06) fades out smoothly to 0.
      // Back arc and extreme edges (y <= 0.06) are completely invisible (opacity = 0).
      let opacity = 0;
      if (y > 0.06) {
        const t = Math.min(1, Math.max(0, (y - 0.06) / 0.39));
        // Smooth Hermite interpolation (ease-in-out)
        opacity = t * t * (3 - 2 * t);
      }

      // 3D perspective scale: 0.86 at fade boundary to 1.05 at front center
      const scale = 0.86 + 0.16 * Math.max(0, y);

      // Depth z-index: front arc sits in front of the character photo
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
    // Initial static positioning
    setNodePositions(calculatePositions(0));

    let lastTime = performance.now();
    // Rotation speed: ~32 seconds per full revolution (smooth cinematic glide)
    const SPEED = (2 * Math.PI) / 32000;

    const tick = (now) => {
      const delta = now - lastTime;
      lastTime = now;

      // Pause or slow down slightly on hover for reading ease
      if (!isHovered) {
        angleRef.current = (angleRef.current + SPEED * delta) % (2 * Math.PI);
        setNodePositions(calculatePositions(angleRef.current));
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isHovered, nodes]);

  return (
    <div
      className="hero-stage-canvas"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Interaktif 3D Orbital Laomera"
    >
      <div className="hero-glow-backplate" aria-hidden="true" />

      {/* SVG Orbital Track (Back Arc & Front Arc with Gradient & Streaming Flow) */}
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
            <stop offset="30%" stopColor="#cbd5e1" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#cbd5e1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 40 220 A 660 180 0 0 1 1360 220"
          stroke="url(#orbitBackGrad)"
          strokeWidth="1.2"
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

      {/* Front Arc: Crisp in the front, smoothly fading to transparent at the left & right extremities */}
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
            <stop offset="12%" stopColor="#cbd5e1" stopOpacity="0.35" />
            <stop offset="30%" stopColor="#cbd5e1" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#d9882a" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#cbd5e1" stopOpacity="0.85" />
            <stop offset="88%" stopColor="#cbd5e1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbitStreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(217, 136, 42, 0)" />
            <stop offset="25%" stopColor="rgba(217, 136, 42, 0.4)" />
            <stop offset="50%" stopColor="rgba(233, 149, 125, 0.9)" />
            <stop offset="75%" stopColor="rgba(217, 136, 42, 0.4)" />
            <stop offset="100%" stopColor="rgba(217, 136, 42, 0)" />
          </linearGradient>
        </defs>

        {/* Base Gradient Track */}
        <path
          d="M 1360 220 A 660 180 0 0 1 40 220"
          stroke="url(#orbitFrontGrad)"
          strokeWidth="1.25"
        />

        {/* Animated Rotating Particle Stream along the Front Arc */}
        <path
          className="orbit-stream-flow-line"
          d="M 1360 220 A 660 180 0 0 1 40 220"
          stroke="url(#orbitStreamGrad)"
          strokeWidth="1.75"
          strokeDasharray="14 36"
        />
      </svg>

      {/* Orbiting Tethered Nodes (Desktop & Tablet) */}
      <div className="orbit-docked-nodes-desktop" aria-hidden="true">
        {nodePositions.map((pos) => (
          <div
            key={pos.id}
            className="orbit-tethered-node orbit-dynamic-node"
            style={{
              left: pos.left,
              top: pos.top,
              opacity: pos.opacity,
              transform: `translate(-50%, -50%) scale(${pos.scale})`,
              zIndex: pos.zIndex,
              pointerEvents: pos.opacity > 0.35 ? "auto" : "none",
              visibility: pos.opacity === 0 ? "hidden" : "visible",
              willChange: "transform, opacity, left, top",
              transition: isHovered ? "transform 0.25s ease, opacity 0.25s ease" : "none",
            }}
          >
            <div className="orbit-dock-pin">
              <div className="orbit-dock-glyph">{pos.icon}</div>
            </div>
            <div className="orbit-dock-hanging-text">
              <span className="dock-node-title">{pos.title}</span>
              <span className="dock-node-subtitle">{pos.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
