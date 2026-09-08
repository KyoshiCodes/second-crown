import React from "react";
import { type HolidayId, getHolidayMeta } from "./holidays";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
  color: string;
  type: "snow" | "leaf" | "pollen" | "spark" | "petal" | "firefly" | "wisp" | "dust" | "ripple" | "spray" | "pine_pollen";
  pulse?: number;
}

export function WeatherOverlay(props: {
  season: "Spring" | "Summer" | "Autumn" | "Winter";
  holiday: HolidayId;
  culture?: string;
}) {
  const { season, holiday, culture = "western" } = props;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const holidayMeta = getHolidayMeta(holiday);

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

    const baseCount = season === "Winter" || holiday === "midwinter" ? 50 : 35;
    const isNonWestern = culture !== "western";
    const count = isNonWestern ? baseCount + 16 : baseCount;
    const particles: Particle[] = [];

    const initParticle = (isCultureSpecial = false): Particle => {
      if (isCultureSpecial && isNonWestern) {
        if (culture === "cedar") {
          return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0.2 + (Math.random() - 0.5) * 0.4,
            vy: 0.3 + Math.random() * 0.5,
            size: 1.5 + Math.random() * 1.8,
            alpha: 0.25 + Math.random() * 0.45,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.03,
            color: Math.random() > 0.4 ? "#a3e635" : "#bef264",
            type: "pine_pollen",
            pulse: Math.random() * Math.PI * 2,
          };
        }
        if (culture === "sand") {
          return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -(0.2 + Math.random() * 0.5),
            size: 1.8 + Math.random() * 2.2,
            alpha: 0.2 + Math.random() * 0.5,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.04,
            color: Math.random() > 0.5 ? "#f59e0b" : "#fbbf24",
            type: "dust",
            pulse: Math.random() * Math.PI * 2,
          };
        }
        if (culture === "steppe") {
          return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 1.5 + Math.random() * 1.8,
            vy: (Math.random() - 0.5) * 0.3,
            size: 2.0 + Math.random() * 2.4,
            alpha: 0.2 + Math.random() * 0.4,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.05,
            color: Math.random() > 0.5 ? "#fef08a" : "#f1f5f9",
            type: "ripple",
            pulse: Math.random() * Math.PI * 2,
          };
        }
        if (culture === "islands") {
          return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0.6 + Math.random() * 0.7,
            vy: 0.4 + Math.random() * 0.6,
            size: 1.6 + Math.random() * 2.0,
            alpha: 0.25 + Math.random() * 0.5,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.03,
            color: Math.random() > 0.4 ? "#bae6fd" : "#e0f2fe",
            type: "spray",
            pulse: Math.random() * Math.PI * 2,
          };
        }
      }

      const isWinter = season === "Winter" || holiday === "midwinter";
      const isAutumn = season === "Autumn" || holiday === "harvest";
      const isSpring = season === "Spring" || holiday === "easter";
      const isSummer = season === "Summer" || holiday === "midsummer";
      const isHalloween = holiday === "halloween";

      let type: Particle["type"] = "pollen";
      let color = "#eab308";
      let vy = 0.5 + Math.random() * 0.8;
      let vx = (Math.random() - 0.5) * 0.6;
      let size = 2 + Math.random() * 2.5;

      if (isHalloween) {
        type = Math.random() > 0.4 ? "wisp" : "spark";
        color = type === "wisp" ? "#c084fc" : "#ea580c";
        vy = -(0.4 + Math.random() * 0.8);
        vx = (Math.random() - 0.5) * 0.8;
        size = 3 + Math.random() * 4;
      } else if (isWinter) {
        type = "snow";
        color = Math.random() > 0.3 ? "#ffffff" : "#bae6fd";
        vy = 0.8 + Math.random() * 1.2;
        vx = (Math.random() - 0.5) * 0.5;
        size = 1.5 + Math.random() * 3;
      } else if (isAutumn) {
        type = "leaf";
        const leafColors = ["#b45309", "#d97706", "#dc2626", "#ea580c", "#78350f"];
        color = leafColors[Math.floor(Math.random() * leafColors.length)];
        vy = 0.9 + Math.random() * 1.2;
        vx = 0.4 + Math.random() * 1.0;
        size = 4 + Math.random() * 4;
      } else if (isSpring) {
        type = Math.random() > 0.5 ? "petal" : "pollen";
        color = type === "petal" ? "#fbcfe8" : "#fef08a";
        vy = 0.5 + Math.random() * 0.8;
        vx = 0.3 + Math.random() * 0.8;
        size = type === "petal" ? 3.5 + Math.random() * 3 : 1.5 + Math.random() * 2;
      } else if (isSummer) {
        type = Math.random() > 0.5 ? "firefly" : "spark";
        color = type === "firefly" ? "#fef08a" : "#fbbf24";
        vy = (Math.random() - 0.5) * 0.6;
        vx = (Math.random() - 0.5) * 0.6;
        size = 2 + Math.random() * 2.5;
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy,
        size,
        alpha: 0.2 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.04,
        color,
        type,
        pulse: Math.random() * Math.PI * 2,
      };
    };

    for (let i = 0; i < count; i++) {
      particles.push(initParticle(i >= baseCount));
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        if (p.pulse !== undefined) p.pulse += 0.04;
        if (p.y > height + 20) {
          p.y = -10;
          p.x = Math.random() * width;
        } else if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -10;
        else if (p.x < -20) p.x = width + 10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        let currentAlpha = p.alpha;
        if (p.type === "firefly" || p.type === "wisp" || p.type === "dust") {
          currentAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse || 0));
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        if (p.type === "snow") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "leaf") {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "petal") {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "ripple") {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 2.2, p.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "wisp") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
        } else if (p.type === "spray") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.shadowBlur = 4;
          ctx.shadowColor = "#38bdf8";
          ctx.fill();
        } else if (p.type === "pine_pollen") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.shadowBlur = 3;
          ctx.shadowColor = "#84cc16";
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      animId = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [season, holiday, culture]);

  return (
    <div
      className={`sc-weather-container season-${season.toLowerCase()} ${holiday !== "none" ? `holiday-${holiday}` : ""} culture-${culture || "western"}`}
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
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      {culture === "cedar" && (
        <div
          className="sc-climate-cedar"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 1200px 800px at 50% 20%, rgba(34, 197, 94, 0.035), transparent 75%)",
            pointerEvents: "none",
          }}
        />
      )}
      {culture === "sand" && (
        <div
          className="sc-climate-sand"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 1400px 900px at 50% -10%, rgba(245, 158, 11, 0.04), transparent 70%), linear-gradient(180deg, transparent 60%, rgba(180, 83, 9, 0.025) 100%)",
            pointerEvents: "none",
          }}
        />
      )}
      {culture === "steppe" && (
        <div
          className="sc-climate-steppe"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(56, 189, 248, 0.035) 0%, transparent 55%), radial-gradient(ellipse 1000px 600px at 50% 100%, rgba(163, 230, 53, 0.02), transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}
      {culture === "islands" && (
        <div
          className="sc-climate-islands"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 1400px 800px at 50% 0%, rgba(14, 165, 233, 0.035), transparent 65%), linear-gradient(180deg, transparent 70%, rgba(6, 182, 212, 0.025) 100%)",
            pointerEvents: "none",
          }}
        />
      )}
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
