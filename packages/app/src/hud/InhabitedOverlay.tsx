import React from "react";

interface InhabitedOverlayProps {
  /** Number of faint drifting dust motes (default 18) */
  motesCount?: number;
  /** Candle glow anchor position */
  candleAnchor?: "top-right" | "top-left" | "center";
  /** Optional extra class */
  className?: string;
}

interface DustMote {
  x: number;
  y: number;
  r: number;
  alpha: number;
  baseAlpha: number;
  vx: number;
  vy: number;
  pulsePhase: number;
  pulseSpeed: number;
}

/**
 * InhabitedOverlay: Ambient medieval scriptorium atmosphere.
 * Renders faint golden dust motes drifting in the air and warm idle candle flicker.
 * GUARANTEE: strictly `pointer-events: none` so all clicks pass straight through!
 */
export function InhabitedOverlay({
  motesCount = 16,
  candleAnchor = "top-right",
  className = "",
}: InhabitedOverlayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth || 400);
    let height = (canvas.height = canvas.offsetHeight || 120);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 400;
      height = canvas.height = canvas.offsetHeight || 120;
    };
    window.addEventListener("resize", onResize);

    // Initialize dust motes
    const motes: DustMote[] = Array.from({ length: motesCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 1.2,
      baseAlpha: 0.08 + Math.random() * 0.22,
      alpha: 0.1,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.12 - Math.random() * 0.22, // Lazy upward drift
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    }));

    let candleFlickerPhase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      candleFlickerPhase += 0.035;
      // Organic multi-sine candle flicker
      const flickerIntensity =
        0.06 +
        Math.sin(candleFlickerPhase * 1.7) * 0.015 +
        Math.cos(candleFlickerPhase * 3.1) * 0.012 +
        Math.sin(candleFlickerPhase * 7.9) * 0.008;

      // Candle glow anchor coordinates
      const cx =
        candleAnchor === "top-right"
          ? width * 0.88
          : candleAnchor === "top-left"
          ? width * 0.12
          : width * 0.5;
      const cy = candleAnchor === "center" ? height * 0.5 : height * 0.18;
      const radius = Math.max(160, width * 0.45);

      // Warm candle radial gradient
      const candleGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      candleGlow.addColorStop(0, `rgba(251, 191, 36, ${flickerIntensity.toFixed(3)})`);
      candleGlow.addColorStop(0.35, `rgba(245, 158, 11, ${(flickerIntensity * 0.55).toFixed(3)})`);
      candleGlow.addColorStop(0.7, `rgba(180, 83, 9, ${(flickerIntensity * 0.2).toFixed(3)})`);
      candleGlow.addColorStop(1, "transparent");

      ctx.fillStyle = candleGlow;
      ctx.fillRect(0, 0, width, height);

      // Render faint drifting dust motes
      for (const m of motes) {
        m.x += m.vx + Math.sin(m.pulsePhase) * 0.12;
        m.y += m.vy;
        m.pulsePhase += m.pulseSpeed;

        // Wrap around boundaries
        if (m.y < -4) {
          m.y = height + 4;
          m.x = Math.random() * width;
        }
        if (m.x < -4) m.x = width + 4;
        if (m.x > width + 4) m.x = -4;

        // Twinkle as motes catch the candle light
        const distToCandle = Math.hypot(m.x - cx, m.y - cy);
        const candleCatch = Math.max(0, 1 - distToCandle / (radius * 0.85));
        const currentAlpha =
          (m.baseAlpha + Math.sin(m.pulsePhase) * 0.08 + candleCatch * 0.22);
        const clampedAlpha = Math.max(0.04, Math.min(0.48, currentAlpha));

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254, 240, 138, ${clampedAlpha.toFixed(3)})`;
        ctx.shadowColor = "rgba(250, 204, 21, 0.4)";
        ctx.shadowBlur = 3;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, [motesCount, candleAnchor]);

  return (
    <canvas
      ref={canvasRef}
      className={`sc-inhabited-overlay ${className}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        borderRadius: "inherit",
      }}
      aria-hidden="true"
    />
  );
}
