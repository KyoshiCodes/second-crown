import React from "react";
import "./omen-pip.css";

export type OmenVariant = "comet" | "raven" | "harvest";

export type SpecificEventType = "harvest" | "timber" | "spoil" | "levy" | "tribute" | "other";

export interface OmenPipProps {
  /** Omen variant: "comet", "raven", or "harvest" */
  variant?: OmenVariant;
  /** Size in pixels (default: 24) */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Optional specific event id to trigger specialized heraldic artwork */
  eventId?: string;
  /** Optional event description text */
  text?: string;
  /** Optional normalized progress (0.0 to 1.0) for active event progress ring */
  progress?: number;
  /** Optional state of the event */
  state?: "latest" | "pending" | "loss" | "settled";
}

/**
 * Resolves an event to one of the 3 canonical omen pip variants:
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
 * Resolves a specific event type for richer living visual flair:
 * - "harvest": bountiful golden wheat grain
 * - "timber": oak acorn & timber foliage
 * - "spoil": blighted grain & rot miasma
 * - "levy": martial standard & muster spear
 * - "tribute": radiant celestial merchant coin & star
 */
export function resolveSpecificEventType(eventId?: string, text?: string): SpecificEventType {
  const id = (eventId ?? "").toLowerCase();
  if (id === "harvest") return "harvest";
  if (id === "timber") return "timber";
  if (id === "spoil") return "spoil";
  if (id === "levy") return "levy";
  if (id === "tribute") return "tribute";

  const s = `${eventId ?? ""} ${text ?? ""}`.toLowerCase();
  if (/timber|wood|forest|lumber/i.test(s)) return "timber";
  if (/spoil|rot|blight|plague|famine/i.test(s)) return "spoil";
  if (/levy|militia|muster|army|soldier/i.test(s)) return "levy";
  if (/tribute|coin|merchant|gold|tax/i.test(s)) return "tribute";
  if (/harvest|grain|crop|bread|field/i.test(s)) return "harvest";
  return "other";
}

/**
 * Living Omen Pip (24px or customizable):
 * Upgraded with animated living vector groups, dynamic aura breathing, event-specific heraldry,
 * and circular progress ring indicating resolution state.
 *
 * GUARANTEE: strictly pointer-events: none so clicks on event cards are never blocked!
 */
export function OmenPip({
  variant: propVariant,
  size = 24,
  className = "",
  style,
  eventId,
  text,
  progress,
  state,
}: OmenPipProps) {
  const variant = propVariant ?? resolveOmenVariant(eventId, text);
  const specificType = resolveSpecificEventType(eventId, text);

  // Normalize progress between 0 and 1 if supplied
  const hasProgress = typeof progress === "number" && Number.isFinite(progress);
  const normProgress = hasProgress ? Math.max(0, Math.min(1, progress!)) : undefined;

  // Perimeter ring dimensions
  const strokeW = 1.4;
  const radius = 10.8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = normProgress !== undefined ? circumference * (1 - normProgress) : 0;

  const ringClass = state ? `is-${state}` : normProgress === 1 ? "is-done" : normProgress !== undefined && normProgress > 0 ? "is-pending" : "";

  return (
    <span
      className={`sc-omen-pip-wrapper sc-omen-${variant} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
      data-omen={variant}
      data-omen-type={specificType}
      data-omen-state={state}
      data-progress={normProgress}
    >
      {/* Ambient living atmosphere glow */}
      <span className="sc-omen-aura" style={{ pointerEvents: "none" }} />

      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`sc-omen-pip sc-omen-${variant}`}
        style={{ pointerEvents: "none" }}
        data-omen={variant}
      >
        {/* Optional Progress Ring */}
        {normProgress !== undefined && (
          <g className="sc-omen-progress-group" style={{ pointerEvents: "none" }}>
            <circle
              cx="12"
              cy="12"
              r={radius}
              fill="none"
              strokeWidth={strokeW}
              className="sc-omen-progress-ring-bg"
            />
            <circle
              cx="12"
              cy="12"
              r={radius}
              fill="none"
              strokeWidth={strokeW}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 12 12)"
              className={`sc-omen-progress-ring-fill ${ringClass}`.trim()}
            />
          </g>
        )}

        {/* --- COMET / CELESTIAL TRIBUTE VARIANT --- */}
        {variant === "comet" && (
          <g className="sc-omen-comet-art" style={{ pointerEvents: "none" }}>
            {/* Diffuse astral dust trail */}
            <path
              d="M5 19 C7 16 11 11 20 4 C17 8 13 13 8 20 Z"
              fill="#ea580c"
              className="sc-omen-comet-tail-diffuse"
            />
            {/* Secondary warm flame streak */}
            <path
              d="M6 18 C9 15 13 10 21 5 C17 9 12 14 7 19 Z"
              fill="#f97316"
              opacity="0.75"
            />
            {/* Core golden fire trail */}
            <path
              d="M6.5 17.5 C9 14.5 13.5 9.5 21 5 C16 9.5 11 15 7.5 18.5 Z"
              fill="#facc15"
              className="sc-omen-comet-core-flame"
            />
            {/* Blazing inner incandescent flame */}
            <path
              d="M7 17 C9.5 14 13 9 19.5 5 C15 9.5 10.5 14.5 8 18 Z"
              fill="#fef08a"
            />
            {/* Drifting star dust embers */}
            <circle cx="9.5" cy="12.5" r="0.7" fill="#fbbf24" className="sc-omen-comet-spark-1" />
            <circle cx="12" cy="10" r="0.8" fill="#fde047" className="sc-omen-comet-spark-2" />
            <circle cx="14.5" cy="7.5" r="0.6" fill="#fef08a" className="sc-omen-comet-spark-3" />
            {/* Outer halo at comet head */}
            <circle cx="6.5" cy="17.5" r="3.2" fill="#f97316" opacity="0.35" />
            {/* Middle fiery glow at head */}
            <circle cx="6.5" cy="17.5" r="2.2" fill="#facc15" opacity="0.7" />
            {/* White-hot nucleus */}
            <circle cx="6.5" cy="17.5" r="1.4" fill="#ffffff" />
            {/* 4-point celestial starburst glint */}
            <path
              d="M6.5 14.5 L6.8 17.2 L9.5 17.5 L6.8 17.8 L6.5 20.5 L6.2 17.8 L3.5 17.5 L6.2 17.2 Z"
              fill="#ffffff"
              className="sc-omen-comet-head-gleam"
            />

            {/* Specialized Tribute Merchant Coin Charm */}
            {specificType === "tribute" && (
              <g className="sc-omen-tribute-coin-charm">
                <circle cx="17.5" cy="15.5" r="3.0" fill="#78350f" stroke="#facc15" strokeWidth="0.6" />
                <circle cx="17.5" cy="15.5" r="2.0" fill="#fbbf24" />
                <path d="M17.5 14 L17.5 17 M16.5 15.5 L18.5 15.5" stroke="#78350f" strokeWidth="0.5" strokeLinecap="round" />
              </g>
            )}
          </g>
        )}

        {/* --- RAVEN / SPOIL / LEVY VARIANT --- */}
        {variant === "raven" && (
          <g className="sc-omen-raven-art" style={{ pointerEvents: "none" }}>
            {/* Perched stone outcrop / branch */}
            <path
              d="M2 19.5 C5 19 8 19.5 13 20.5 C16 21 19 20 22 19"
              stroke="#475569"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Talons grasping perch */}
            <path
              d="M9 19.5 L9.5 20.8 M11 19.8 L11.5 21 M13 20 L13.5 21.2"
              stroke="#94a3b8"
              strokeWidth="0.7"
              strokeLinecap="round"
            />
            {/* Tail feathers descending */}
            <polygon points="12,18 10,23 13.5,23.5 14,18" fill="#090d16" />
            <polygon points="12.5,18 11.5,23.8 13,23.8 13.5,18" fill="#1e1b4b" opacity="0.7" />
            {/* Back plumage bulk */}
            <ellipse
              cx="13"
              cy="14"
              rx="4"
              ry="5.5"
              transform="rotate(18 13 14)"
              fill="#0f172a"
              className="sc-omen-raven-wing-fold"
            />
            {/* Folded wing sheen & feather layers */}
            <path
              d="M10 11.5 C11 10.5 14 11 15 13.5 C15.8 15.5 14.5 18 11.5 18.5 C10 17 9.5 14 10 11.5 Z"
              fill="#1e1b4b"
              className="sc-omen-raven-wing-fold"
            />
            <path
              d="M11 13 C12 12.5 13.5 13 14 14.5 C14.5 16 13.5 17.5 11.8 17.8"
              stroke="#4338ca"
              strokeWidth="0.6"
              fill="none"
              strokeLinecap="round"
              className="sc-omen-raven-feather-ruffle"
            />
            <path
              d="M11.5 14.5 C12.2 14.2 13 14.5 13.5 15.5"
              stroke="#6366f1"
              strokeWidth="0.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Breast & throat feathers */}
            <path
              d="M8.5 10 C9.5 12 9.5 15 11 17 C9.5 17 8 15 8 13 C8 11.5 8.2 10.5 8.5 10 Z"
              fill="#090d16"
            />
            {/* Neck hackles */}
            <path
              d="M8.5 9.5 L8 11 L9 10.5 L8.5 12 L9.5 11.5 L9 13"
              stroke="#312e81"
              strokeWidth="0.5"
              fill="none"
            />
            {/* Head silhouette */}
            <ellipse cx="9.5" cy="8.2" rx="2.5" ry="2.2" fill="#0f172a" />
            <circle cx="9.8" cy="8" r="1.8" fill="#1e1b4b" />
            {/* Sharp raven beak */}
            <polygon points="8.2,7.2 4.2,9 8,9.5" fill="#334155" />
            <polygon points="8,7.4 4.5,8.9 7.8,8.8" fill="#475569" />
            {/* Piercing prophetic eye */}
            <circle cx="8.8" cy="8" r="0.9" fill="#facc15" />
            <circle cx="8.8" cy="8" r="0.5" fill="#090d16" />
            <circle cx="8.6" cy="7.8" r="0.3" fill="#ffffff" className="sc-omen-raven-eye-gleam" />

            {/* Specialized Spoilage Miasma / Spores */}
            {specificType === "spoil" && (
              <g className="sc-omen-spoil-miasma" style={{ pointerEvents: "none" }}>
                <circle cx="16" cy="8" r="1.0" fill="#ef4444" opacity="0.65" className="sc-omen-spoil-miasma-mote" />
                <circle cx="18" cy="11" r="0.8" fill="#b91c1c" opacity="0.75" className="sc-omen-spoil-miasma-mote" />
                <circle cx="15" cy="5" r="0.7" fill="#f87171" opacity="0.55" className="sc-omen-spoil-miasma-mote" />
                <path d="M15 9 Q17 7 18 10" stroke="#ef4444" strokeWidth="0.5" fill="none" opacity="0.6" />
              </g>
            )}

            {/* Specialized Levy Martial Spear / Pennant */}
            {specificType === "levy" && (
              <g className="sc-omen-levy-spear" style={{ pointerEvents: "none" }}>
                <line x1="17" y1="4" x2="17" y2="21" stroke="#cbd5e1" strokeWidth="0.8" />
                <polygon points="17,3 15.8,5.5 17,5 18.2,5.5" fill="#94a3b8" />
                <path d="M17 5.5 L20.5 7 L17 8.5 Z" fill="#4f46e5" className="sc-omen-levy-banner-flutter" />
              </g>
            )}
          </g>
        )}

        {/* --- HARVEST / TIMBER VARIANT --- */}
        {variant === "harvest" && (
          <g className="sc-omen-harvest-art" style={{ pointerEvents: "none" }}>
            {/* Straw tie / ribbon wrapper */}
            <rect
              x="9.5"
              y="14"
              width="5"
              height="2.2"
              rx="0.5"
              fill="#dc2626"
              stroke="#991b1b"
              strokeWidth="0.4"
            />
            {/* Ribbon tail dangling down */}
            <path
              d="M10.5 16.2 C10 18 9.5 19 8.5 20 M13.5 16.2 C14 18 14.5 19 15.5 20"
              stroke="#dc2626"
              strokeWidth="0.7"
              strokeLinecap="round"
              fill="none"
            />

            {/* Lower stalks / bundled stems */}
            <line x1="10" y1="16.2" x2="8.5" y2="21.5" stroke="#ca8a04" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="11" y1="16.2" x2="10.2" y2="22" stroke="#eab308" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="12" y1="16.2" x2="12" y2="22.2" stroke="#ca8a04" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="13" y1="16.2" x2="13.8" y2="22" stroke="#eab308" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="14" y1="16.2" x2="15.5" y2="21.5" stroke="#ca8a04" strokeWidth="0.7" strokeLinecap="round" />

            {/* Center upright wheat ear */}
            <g className="sc-omen-harvest-sheaf-sway">
              <path d="M12 14 L12 6" stroke="#ca8a04" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              <ellipse cx="12" cy="5.5" rx="1.2" ry="1.8" fill="#fde047" stroke="#ca8a04" strokeWidth="0.4" />
              <ellipse cx="12" cy="7.5" rx="1.2" ry="1.8" fill="#facc15" stroke="#ca8a04" strokeWidth="0.4" />
              <ellipse cx="12" cy="9.8" rx="1.2" ry="1.8" fill="#fde047" stroke="#ca8a04" strokeWidth="0.4" />
              <ellipse cx="12" cy="12" rx="1.2" ry="1.8" fill="#eab308" stroke="#ca8a04" strokeWidth="0.4" />
              <line x1="12" y1="5.5" x2="12" y2="3.2" stroke="#eab308" strokeWidth="0.5" strokeLinecap="round" />
            </g>

            {/* Left fanning wheat ear */}
            <g className="sc-omen-harvest-sheaf-sway">
              <path d="M11.5 15 C10.5 12 8 10 5.5 8" stroke="#ca8a04" strokeWidth="0.7" fill="none" strokeLinecap="round" />
              <ellipse cx="5" cy="7.5" rx="1.1" ry="1.6" transform="rotate(-50 5 7.5)" fill="#fde047" stroke="#ca8a04" strokeWidth="0.4" />
              <ellipse cx="7" cy="9.5" rx="1.1" ry="1.6" transform="rotate(-40 7 9.5)" fill="#facc15" stroke="#ca8a04" strokeWidth="0.4" />
              <ellipse cx="9" cy="12" rx="1.1" ry="1.6" transform="rotate(-30 9 12)" fill="#eab308" stroke="#ca8a04" strokeWidth="0.4" />
              <line x1="4.5" y1="7" x2="2.5" y2="5.5" stroke="#eab308" strokeWidth="0.5" strokeLinecap="round" />
            </g>

            {/* Right fanning wheat ear */}
            <g className="sc-omen-harvest-sheaf-sway-alt">
              <path d="M12.5 15 C13.5 12 16 10 18.5 8" stroke="#ca8a04" strokeWidth="0.7" fill="none" strokeLinecap="round" />
              <ellipse cx="19" cy="7.5" rx="1.1" ry="1.6" transform="rotate(50 19 7.5)" fill="#fde047" stroke="#ca8a04" strokeWidth="0.4" />
              <ellipse cx="17" cy="9.5" rx="1.1" ry="1.6" transform="rotate(40 17 9.5)" fill="#facc15" stroke="#ca8a04" strokeWidth="0.4" />
              <ellipse cx="15" cy="12" rx="1.1" ry="1.6" transform="rotate(30 15 12)" fill="#eab308" stroke="#ca8a04" strokeWidth="0.4" />
              <line x1="19.5" y1="7" x2="21.5" y2="5.5" stroke="#eab308" strokeWidth="0.5" strokeLinecap="round" />
            </g>

            {/* Golden harvest sparkles */}
            <circle cx="12" cy="10" r="0.6" fill="#ffffff" className="sc-omen-harvest-sparkle-1" />
            <circle cx="6" cy="15" r="0.5" fill="#fef08a" className="sc-omen-harvest-sparkle-2" />
            <circle cx="18" cy="15" r="0.5" fill="#fef08a" className="sc-omen-harvest-sparkle-1" />

            {/* Specialized Timber Windfall Oak Leaf & Acorn */}
            {specificType === "timber" && (
              <g className="sc-omen-timber-charm" style={{ pointerEvents: "none" }}>
                {/* Oak leaf */}
                <path
                  d="M17 12 C18 10 20 9 21 11 C22 12.5 21 14 19 14.5 C18 15 17 13.5 17 12 Z"
                  fill="#65a30d"
                  stroke="#365314"
                  strokeWidth="0.5"
                  className="sc-omen-timber-leaf-flutter"
                />
                {/* Acorn cap & nut */}
                <ellipse cx="6" cy="12.5" rx="1.4" ry="1.8" fill="#b45309" stroke="#78350f" strokeWidth="0.4" />
                <path d="M4.6 12 C4.6 10.8 7.4 10.8 7.4 12 Z" fill="#78350f" />
                <line x1="6" y1="10.8" x2="6" y2="9.8" stroke="#78350f" strokeWidth="0.5" strokeLinecap="round" />
              </g>
            )}
          </g>
        )}
      </svg>
    </span>
  );
}

/** Drop-in living alias */
export const LivingOmenPip = OmenPip;
export const EventOmenPip = OmenPip;
export const OmenLivingPip = OmenPip;
