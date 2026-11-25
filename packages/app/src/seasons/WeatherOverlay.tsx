import React from "react";
import { resolveWeatherKind, type WeatherKind } from "@second-crown/render";
import { useNowPlaying, type MusicSource, type NowPlaying } from "../nowPlaying";
import { type HolidayId, getHolidayMeta } from "./holidays";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  kind: "rain" | "snow" | "mote";
}

export interface MusicWeatherResponse {
  countMultiplier: number;
  alphaMultiplier: number;
  speedMultiplier: number;
  moteCount: number;
  moteColor: string;
}

const SEASON_MOTE_COLORS: Record<"Spring" | "Summer" | "Autumn" | "Winter", string> = {
  Spring: "#86efac",
  Summer: "#fef08a",
  Autumn: "#fdba74",
  Winter: "#bae6fd",
};

/** Computes lightweight weather/mote boost while music is playing. */
export function resolveMusicWeatherResponse(
  playing: boolean,
  source: MusicSource,
  season: "Spring" | "Summer" | "Autumn" | "Winter",
  weatherKind: WeatherKind,
): MusicWeatherResponse {
  if (!playing) {
    return {
      countMultiplier: 1,
      alphaMultiplier: 1,
      speedMultiplier: 1,
      moteCount: 0,
      moteColor: "",
    };
  }
  const moteColor =
    source === "travis"
      ? "#fde68a"
      : source === "lofi"
        ? "#b8c7e8"
        : SEASON_MOTE_COLORS[season];

  if (weatherKind === "clear") {
    return {
      countMultiplier: 1,
      alphaMultiplier: 1,
      speedMultiplier: 1,
      moteCount: 14,
      moteColor,
    };
  }
  return {
    countMultiplier: 1.25,
    alphaMultiplier: 1.12,
    speedMultiplier: 1.06,
    moteCount: 0,
    moteColor,
  };
}

export function WeatherOverlay(props: {
  season: "Spring" | "Summer" | "Autumn" | "Winter";
  holiday: HolidayId;
  nowPlayingOverride?: Pick<NowPlaying, "source" | "playing">;
}) {
  const { season, holiday, nowPlayingOverride } = props;
  const liveNp = useNowPlaying();
  const np = nowPlayingOverride ?? liveNp;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const holidayMeta = getHolidayMeta(holiday);
  const weatherKind: WeatherKind = resolveWeatherKind(season, holiday);
  const musicBoost = resolveMusicWeatherResponse(np.playing, np.source, season, weatherKind);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const reducedMotion =
      typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    const activeBoost = reducedMotion
      ? resolveMusicWeatherResponse(false, np.source, season, weatherKind)
      : musicBoost;

    // Weather particles: rain in autumn-ish wet seasons, snow in winter, light motes on clear playing skies
    const baseCount = weatherKind === "clear" ? 0 : weatherKind === "snow" ? 50 : 45;
    const count = Math.round(baseCount * activeBoost.countMultiplier);
    const particles: Particle[] = [];

    const initParticle = (): Particle => {
      if (weatherKind === "snow") {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6 * activeBoost.speedMultiplier,
          vy: (0.8 + Math.random() * 1.2) * activeBoost.speedMultiplier,
          size: 1.5 + Math.random() * 2.8,
          alpha: Math.min(0.95, (0.35 + Math.random() * 0.55) * activeBoost.alphaMultiplier),
          color: Math.random() > 0.3 ? "#ffffff" : "#bae6fd",
          kind: "snow",
        };
      }
      // Rain in autumn-ish wet seasons
      return {
        x: Math.random() * (width + 60),
        y: Math.random() * height,
        vx: (-1.2 + (Math.random() - 0.5) * 0.8) * activeBoost.speedMultiplier,
        vy: (7.0 + Math.random() * 4.0) * activeBoost.speedMultiplier,
        size: 2.0 + Math.random() * 2.0,
        alpha: Math.min(0.9, (0.3 + Math.random() * 0.45) * activeBoost.alphaMultiplier),
        color: "#93c5fd",
        kind: "rain",
      };
    };

    for (let i = 0; i < count; i++) {
      particles.push(initParticle());
    }

    for (let i = 0; i < activeBoost.moteCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(0.18 + Math.random() * 0.28),
        size: 1.1 + Math.random() * 1.3,
        alpha: 0.12 + Math.random() * 0.16,
        color: activeBoost.moteColor || "#fde68a",
        kind: "mote",
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (particles.length === 0) {
        return;
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.kind === "mote") {
          if (p.y < -8) {
            p.y = height + 8;
            p.x = Math.random() * width;
          }
          if (p.x > width + 8) p.x = -8;
          else if (p.x < -8) p.x = width + 8;

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.restore();
        } else if (p.kind === "snow") {
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

    if (particles.length > 0) {
      render();
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [season, holiday, weatherKind, np.playing, np.source]);

  return (
    <div
      className={`sc-weather-container weather-${weatherKind} season-${season.toLowerCase()} ${holiday !== "none" ? `holiday-${holiday}` : ""}`}
      data-music-playing={np.playing ? "true" : "false"}
      data-music-source={np.source}
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
