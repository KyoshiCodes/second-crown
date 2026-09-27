import React from "react";

export type OmenVariant = "comet" | "raven" | "harvest";

export interface OmenPipProps {
  /** Omen variant: "comet", "raven", or "harvest" */
  variant?: OmenVariant;
  /** Size in pixels (default: 24) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Resolves an event to one of the 3 omen pip variants:
 * - "harvest": bountiful harvest, crop abundance, timber windfall, economic wealth
 * - "raven": ominous portents, levies of war, spoilage/pestilence, military muster
 * - "comet": celestial portents, starry omens, merchant tributes, cosmic wonders
 */
export function resolveOmenVariant(eventId?: string, text?: string): OmenVariant {
  const s = `${eventId ?? ""} ${text ?? ""}`.toLowerCase();
  if (/harvest|crop|grain|timber|wood|bounty|plenty|feast|farm|bread|field/i.test(s)) {
    return "harvest";
  }
  if (/raven|crow|levy|militia|army|war|scout|spoil|rot|plague|famine|shadow|dark|peril|blood/i.test(s)) {
    return "raven";
  }
  if (/comet|star|meteor|sky|celestial|eclipse|omen|wonder|magic|tribute/i.test(s)) {
    return "comet";
  }
  if (eventId === "harvest" || eventId === "timber") return "harvest";
  if (eventId === "spoil" || eventId === "levy") return "raven";
  if (eventId === "tribute") return "comet";
  return "comet";
}

/**
 * 24px Omen Pip:
 * - "comet": blazing celestial firestar with streaking astral tail and spark embers
 * - "raven": ominous perched prophetic raven with gleaming sharp eye and obsidian plumage
 * - "harvest": golden wheat sheaf tied with crimson ribbon and radiating harvest glints
 *
 * GUARANTEE: strictly pointer-events: none so clicks on event cards are never blocked!
 */
export function OmenPip({
  variant = "comet",
  size = 24,
  className = "",
  style,
}: OmenPipProps) {
  return (
    <span
      className={`sc-omen-pip-wrapper sc-omen-${variant} ${className}`}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        ...style,
      }}
      aria-hidden="true"
      data-omen={variant}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`sc-omen-pip sc-omen-${variant}`}
        style={{ pointerEvents: "none" }}
        data-omen={variant}
      >
        {variant === "comet" && (
          <g className="sc-omen-comet-art" style={{ pointerEvents: "none" }}>
            {/* Diffuse astral dust trail */}
            <path
              d="M5 19 C7 16 11 11 20 4 C17 8 13 13 8 20 Z"
              fill="#ea580c"
              opacity="0.35"
            />
            {/* Secondary warm flame streak */}
            <path
              d="M6 18 C9 15 13 10 21 5 C17 9 12 14 7 19 Z"
              fill="#f97316"
              opacity="0.65"
            />
            {/* Core golden fire trail */}
            <path
              d="M6.5 17.5 C9 14.5 13.5 9.5 21 5 C16 9.5 11 15 7.5 18.5 Z"
              fill="#facc15"
            />
            {/* Blazing inner incandescent flame */}
            <path
              d="M7 17 C9.5 14 13 9 19.5 5 C15 9.5 10.5 14.5 8 18 Z"
              fill="#fef08a"
            />
            {/* Drifting star dust embers */}
            <circle cx="16" cy="8" r="0.8" fill="#fef08a" />
            <circle cx="12" cy="11.5" r="0.7" fill="#fde047" />
            <circle cx="18.5" cy="5.5" r="0.6" fill="#ffffff" />
            <circle cx="14" cy="15" r="0.6" fill="#ea580c" />
            {/* Comet fiery head & core */}
            <circle cx="6.5" cy="17.5" r="3.2" fill="#ea580c" opacity="0.4" />
            <circle
              cx="6.5"
              cy="17.5"
              r="2.5"
              fill="#f59e0b"
              stroke="#dc2626"
              strokeWidth="0.5"
            />
            <circle cx="6.5" cy="17.5" r="1.6" fill="#fef08a" />
            <circle cx="6.5" cy="17.5" r="0.9" fill="#ffffff" />
            {/* Celestial star glint cross */}
            <line
              x1="6.5"
              y1="14.5"
              x2="6.5"
              y2="20.5"
              stroke="#ffffff"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
            <line
              x1="3.5"
              y1="17.5"
              x2="9.5"
              y2="17.5"
              stroke="#ffffff"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
          </g>
        )}

        {variant === "raven" && (
          <g className="sc-omen-raven-art" style={{ pointerEvents: "none" }}>
            {/* Perched branch */}
            <path
              d="M2 19.5 C7 19 14 19.5 22 20.5"
              stroke="#475569"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M10 20 L8 22 M14 20.2 L16 22"
              stroke="#334155"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {/* Claws grasping perch */}
            <path
              d="M10 18.5 L9.5 20 M11 18.5 L11 20 M12.5 18.5 L13 20"
              stroke="#94a3b8"
              strokeWidth="0.7"
              strokeLinecap="round"
            />
            {/* Tail feathers */}
            <polygon
              points="8,17 4,21 7.5,18.5 6,23 9.5,18"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="0.4"
            />
            {/* Raven body & chest */}
            <path
              d="M8.5 17.5 C7.5 15 8 12 10 10 C10.5 8 12 6.5 14 6 C15.5 5.5 17.2 6.2 18 7.5 C18.8 8.8 18 10 16.5 11 C15.5 12 15 13.5 14.5 17 C13 18.5 10 18.5 8.5 17.5 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="0.6"
            />
            {/* Folded wing feathers */}
            <path
              d="M10 10.5 C12 11.5 13.5 13.5 13 17 C11.5 17 9.5 15 9 12 Z"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="0.5"
            />
            <path
              d="M10.8 11.8 C12.2 13 12.8 14.5 12.2 16.5"
              stroke="#64748b"
              strokeWidth="0.5"
              strokeLinecap="round"
            />
            {/* Sharp beak */}
            <polygon
              points="17.8,7.2 22,8.8 17.5,9.8"
              fill="#cbd5e1"
              stroke="#64748b"
              strokeWidth="0.4"
            />
            <line
              x1="17.8"
              y1="8.5"
              x2="21.5"
              y2="8.8"
              stroke="#334155"
              strokeWidth="0.4"
            />
            {/* Piercing glowing eye */}
            <circle cx="15.8" cy="7.8" r="1.1" fill="#38bdf8" />
            <circle cx="15.8" cy="7.8" r="0.6" fill="#0f172a" />
            <circle cx="15.5" cy="7.5" r="0.3" fill="#ffffff" />
            {/* Ominous crest crown glint */}
            <path
              d="M13.5 5.8 L12.5 4.5 M15 5.5 L14.5 4"
              stroke="#818cf8"
              strokeWidth="0.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {variant === "harvest" && (
          <g className="sc-omen-harvest-art" style={{ pointerEvents: "none" }}>
            {/* Stems at base */}
            <path
              d="M10 21.5 L11.5 16 M12 22 L12 16 M14 21.5 L12.5 16"
              stroke="#ca8a04"
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Crimson tie ribbon */}
            <rect
              x="9.5"
              y="15"
              width="5"
              height="2.2"
              rx="0.6"
              fill="#b91c1c"
              stroke="#991b1b"
              strokeWidth="0.5"
            />
            <path
              d="M10.5 17.2 L9 20 M13.5 17.2 L14.5 19.5"
              stroke="#dc2626"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {/* Center wheat stem */}
            <path
              d="M12 15 L12 4"
              stroke="#ca8a04"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            {/* Center wheat grains */}
            <ellipse
              cx="10.8"
              cy="12"
              rx="1.1"
              ry="1.6"
              transform="rotate(-20 10.8 12)"
              fill="#fde047"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="13.2"
              cy="12"
              rx="1.1"
              ry="1.6"
              transform="rotate(20 13.2 12)"
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="10.8"
              cy="8.5"
              rx="1.1"
              ry="1.6"
              transform="rotate(-20 10.8 8.5)"
              fill="#fde047"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="13.2"
              cy="8.5"
              rx="1.1"
              ry="1.6"
              transform="rotate(20 13.2 8.5)"
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="10.8"
              cy="5.5"
              rx="1"
              ry="1.5"
              transform="rotate(-15 10.8 5.5)"
              fill="#fef08a"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="13.2"
              cy="5.5"
              rx="1"
              ry="1.5"
              transform="rotate(15 13.2 5.5)"
              fill="#fde047"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="12"
              cy="3.5"
              rx="0.9"
              ry="1.4"
              fill="#fffbeb"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            {/* Center awns */}
            <line
              x1="12"
              y1="3"
              x2="12"
              y2="1"
              stroke="#eab308"
              strokeWidth="0.5"
              strokeLinecap="round"
            />
            <line
              x1="11.5"
              y1="3"
              x2="9.5"
              y2="1.5"
              stroke="#eab308"
              strokeWidth="0.5"
              strokeLinecap="round"
            />
            <line
              x1="12.5"
              y1="3"
              x2="14.5"
              y2="1.5"
              stroke="#eab308"
              strokeWidth="0.5"
              strokeLinecap="round"
            />

            {/* Left fanning wheat ear */}
            <path
              d="M11.5 15 C10.5 12 8 10 5.5 8"
              stroke="#ca8a04"
              strokeWidth="0.7"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse
              cx="5"
              cy="7.5"
              rx="1.1"
              ry="1.6"
              transform="rotate(-50 5 7.5)"
              fill="#fde047"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="7"
              cy="9.5"
              rx="1.1"
              ry="1.6"
              transform="rotate(-40 7 9.5)"
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="9"
              cy="12"
              rx="1.1"
              ry="1.6"
              transform="rotate(-30 9 12)"
              fill="#eab308"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <line
              x1="4.5"
              y1="7"
              x2="2.5"
              y2="5.5"
              stroke="#eab308"
              strokeWidth="0.5"
              strokeLinecap="round"
            />

            {/* Right fanning wheat ear */}
            <path
              d="M12.5 15 C13.5 12 16 10 18.5 8"
              stroke="#ca8a04"
              strokeWidth="0.7"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse
              cx="19"
              cy="7.5"
              rx="1.1"
              ry="1.6"
              transform="rotate(50 19 7.5)"
              fill="#fde047"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="17"
              cy="9.5"
              rx="1.1"
              ry="1.6"
              transform="rotate(40 17 9.5)"
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <ellipse
              cx="15"
              cy="12"
              rx="1.1"
              ry="1.6"
              transform="rotate(30 15 12)"
              fill="#eab308"
              stroke="#ca8a04"
              strokeWidth="0.4"
            />
            <line
              x1="19.5"
              y1="7"
              x2="21.5"
              y2="5.5"
              stroke="#eab308"
              strokeWidth="0.5"
              strokeLinecap="round"
            />

            {/* Golden harvest sparkles */}
            <circle cx="12" cy="10" r="0.6" fill="#ffffff" />
            <circle cx="6" cy="15" r="0.5" fill="#fef08a" />
            <circle cx="18" cy="15" r="0.5" fill="#fef08a" />
          </g>
        )}
      </svg>
    </span>
  );
}
