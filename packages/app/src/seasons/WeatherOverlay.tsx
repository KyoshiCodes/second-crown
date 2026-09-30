import React from "react";
import { resolveWeatherKind, type WeatherKind } from "@second-crown/render";
import { type HolidayId, getHolidayMeta } from "./holidays";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  kind: "rain" | "snow";
}

export function WeatherOverlay(props: {
  season: "Spring" | "Summer" | "Autumn" | "Winter";
  holiday: HolidayId;
}) {
  const { season, holiday } = props;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const holidayMeta = getHolidayMeta(holiday);
  const weatherKind: WeatherKind = resolveWeatherKind(season, holiday);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Weather particles: rain in autumn-ish wet seasons, snow in winter, clear otherwise
    const count = weatherKind === "clear" ? 0 : weatherKind === "snow" ? 50 : 45;
    const particles: Particle[] = [];

    const initParticle = (): Particle => {
      if (weatherKind === "snow") {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: 0.8 + Math.random() * 1.2,
          size: 1.5 + Math.random() * 2.8,
          alpha: 0.35 + Math.random() * 0.55,
          color: Math.random() > 0.3 ? "#ffffff" : "#bae6fd",
          kind: "snow",
        };
      }
      // Rain in autumn-ish wet seasons
      return {
        x: Math.random() * (width + 60),
        y: Math.random() * height,
        vx: -1.2 + (Math.random() - 0.5) * 0.8,
        vy: 7.0 + Math.random() * 4.0,
        size: 2.0 + Math.random() * 2.0,
        alpha: 0.3 + Math.random() * 0.45,
        color: "#93c5fd",
        kind: "rain",
      };
    };

    for (let i = 0; i < count; i++) {
      particles.push(initParticle());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (weatherKind === "clear" || particles.length === 0) {
        return;
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.kind === "snow") {
          if (p.y > height + 15) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          if (p.x > width + 10) p.x = -10;
          else if (p.x < -10) p.x = width + 10;

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.restore();
        } else if (p.kind === "rain") {
          if (p.y > height + 25) {
            p.y = -15;
            p.x = Math.random() * (width + 60);
          }
          if (p.x < -20) p.x = width + 20;
          else if (p.x > width + 20) p.x = -20;

          ctx.save();
          const len = p.size * 3.5 + 6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.8, p.y + len);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.0;
          ctx.globalAlpha = p.alpha;
          ctx.stroke();

          // Delicate ripple on bottom ground
          if (p.y > height * 0.8) {
            const groundProgress = (p.y - height * 0.8) / (height * 0.2);
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + len, 2.5 * groundProgress, 0.9 * groundProgress, 0, 0, Math.PI * 2);
            ctx.strokeStyle = "#60a5fa";
            ctx.lineWidth = 0.75;
            ctx.globalAlpha = p.alpha * 0.4 * (1 - groundProgress * 0.5);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    if (count > 0) {
      render();
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [season, holiday, weatherKind]);

  return (
    <div
      className={`sc-weather-container weather-${weatherKind} season-${season.toLowerCase()} ${holiday !== "none" ? `holiday-${holiday}` : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
      {holiday !== "none" && (
        <div
          className="sc-holiday-banner"
          style={{
            position: "fixed",
            top: 52,
            right: 16,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 10px",
            background: "rgba(18, 14, 10, 0.94)",
            border: `1px solid ${holidayMeta.accentColor}`,
            boxShadow: `0 0 12px ${holidayMeta.glowColor}`,
            borderRadius: 6,
            fontSize: 12,
            color: "#f8fafc",
            zIndex: 90,
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 16 }}>{holidayMeta.propEmoji}</span>
          <div>
            <div style={{ fontWeight: 700, color: holidayMeta.accentColor }}>{holidayMeta.name}</div>
            <div style={{ fontSize: 10.5, opacity: 0.75 }}>{holidayMeta.propName}</div>
          </div>
        </div>
      )}
    </div>
  );
}
