"use client";

import { useRef, useEffect } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";

const vertex = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uGlow;
uniform float uTheme; // 0 = dark (navy #071236), 1 = light

// Smooth multi-chromatic Aurora Palettes
vec3 paletteA(float t) {
    // Ethereal cyan to electric violet/magenta
    return mix(
        vec3(0.12, 0.42, 0.88), // luminous electric sapphire
        vec3(0.84, 0.32, 0.94), // vivid aurora magenta
        0.5 + 0.5 * sin(t)
    );
}

vec3 paletteB(float t) {
    // Ethereal cyan-teal to soft amethyst
    return mix(
        vec3(0.08, 0.72, 0.82), // celestial cyan
        vec3(0.68, 0.32, 0.96), // deep lavender-violet
        0.5 + 0.5 * cos(t)
    );
}

void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    vec2 uv = st * 2.0 - 1.0;
    float aspect = uResolution.x / uResolution.y;
    uv.x *= aspect;

    float t = uTime * uSpeed;

    // --- Wave Ribbon 1 (Left & Center primary flowing ribbon) ---
    float w1_a = 0.32 * sin(uv.x * 2.2 + t * 0.85);
    float w1_b = 0.18 * sin(uv.x * 3.8 - t * 0.65 + 1.2);
    float line1 = w1_a + w1_b + 0.18;
    float dist1 = abs(uv.y - line1);
    float g1 = exp(-pow(dist1, 2.0) * (uGlow * 1.25));

    // --- Wave Ribbon 2 (Active across Center & Right Corner) ---
    // Crest actively illuminates the right half and right corner (uv.x > 0.4)
    float w2_a = 0.28 * sin(uv.x * 1.7 - t * 0.75 + 2.7);
    float w2_b = 0.16 * cos(uv.x * 3.4 + t * 0.55 + 0.8);
    float line2 = w2_a + w2_b + 0.08;
    float dist2 = abs(uv.y - line2);
    float g2 = exp(-pow(dist2, 2.0) * (uGlow * 1.15));

    // --- Wave Ribbon 3 (Ethereal High-Sweep covering extreme right edge) ---
    float w3_a = 0.26 * cos(uv.x * 1.9 + t * 0.60 + 4.1);
    float w3_b = 0.14 * sin(uv.x * 4.6 - t * 0.80 + 2.0);
    float line3 = w3_a + w3_b + 0.26;
    float dist3 = abs(uv.y - line3);
    float g3 = exp(-pow(dist3, 2.0) * (uGlow * 1.05));

    // Dynamic wave-derived colors
    vec3 col1 = paletteA(line1 * 2.4 + uv.x * 0.7 + t * 0.35);
    vec3 col2 = paletteB(line2 * 2.1 - uv.x * 0.5 + t * 0.25);
    vec3 col3 = mix(vec3(0.18, 0.62, 0.98), vec3(0.88, 0.38, 0.82), 0.5 + 0.5 * sin(uv.x * 1.6 + t * 0.45));

    // Ethereal atmospheric aurora curtain across the entire width
    float ambientMask = exp(-pow(uv.y - 0.02, 2.0) * 1.6);
    vec3 ambientAurora = mix(vec3(0.10, 0.28, 0.62), vec3(0.36, 0.16, 0.58), 0.5 + 0.5 * sin(uv.x * 0.75 + t * 0.2)) * ambientMask * 0.38;

    // Combined multi-layered aurora radiance
    vec3 aurora = col1 * g1 * 1.45 + col2 * g2 * 1.35 + col3 * g3 * 1.15 + ambientAurora;

    // Exact Laomera Midnight Navy: #071236 -> rgb(7, 18, 54) -> vec3(0.0275, 0.0706, 0.2118)
    vec3 bgNavy = vec3(0.0275, 0.0706, 0.2118);
    vec3 bg = mix(bgNavy, vec3(1.0), uTheme);

    // Smoothstep vertical edge attenuation: softly eases to pure background at the very top and bottom
    float verticalFade = smoothstep(0.0, 0.20, st.y) * smoothstep(1.0, 0.80, st.y);

    vec3 finalColor = bg + aurora * clamp(verticalFade, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export default function AuroraWaves({
  speed = 0.85,
  glow = 15.0,
  theme = "dark",
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    if (!container) return;

    // Fresh canvas element for clean WebGL lifecycle
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "0";
    container.appendChild(canvas);

    let renderer;
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        canvas,
        alpha: true,
        antialias: true,
      });
    } catch {
      if (canvas.parentElement) container.removeChild(canvas);
      return;
    }

    const gl = renderer.gl;
    if (!gl || gl.isContextLost()) {
      if (canvas.parentElement) container.removeChild(canvas);
      return;
    }

    let mesh;
    let program;

    try {
      const geometry = new Triangle(gl);

      program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new Vec2() },
          uSpeed: { value: speed },
          uGlow: { value: glow },
          uTheme: { value: theme === "light" ? 1.0 : 0.0 },
        },
      });

      if (!program.uniformLocations) {
        throw new Error("Program uniforms linking incomplete");
      }

      mesh = new Mesh(gl, { geometry, program });
    } catch {
      if (canvas.parentElement) container.removeChild(canvas);
      return;
    }

    const resize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 800;
      // Exact pixel size without downscaling CSS box
      renderer.setSize(w, h);
      // Guarantee canvas CSS width and height stay 100% full bleed
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      if (program?.uniforms?.uResolution) {
        program.uniforms.uResolution.value.set(w, h);
      }
    };

    window.addEventListener("resize", resize);
    resize();

    const start = performance.now();
    let frameId;

    const loop = () => {
      if (program?.uniforms?.uTime) {
        program.uniforms.uTime.value = (performance.now() - start) / 1000;
      }
      try {
        renderer.render({ scene: mesh });
        frameId = requestAnimationFrame(loop);
      } catch {
        // Stop gracefully on context loss
      }
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      if (canvas.parentElement) {
        container.removeChild(canvas);
      }
    };
  }, [speed, glow, theme]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
      aria-hidden="true"
    />
  );
}
