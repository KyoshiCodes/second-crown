import React from "react";

export type AtlasTerrainKind = "plain" | "wood" | "hill" | "waste" | "shore" | "peak" | "fog";

export interface AtlasTerrainDescriptor {
  kind: AtlasTerrainKind;
  label: string;
  flair: string;
  color: string;
  motion: "drift" | "pulse" | "calm";
}

export function resolveAtlasTerrainLiving(params: {
  terrain?: string;
  node?: string;
  seen: boolean;
  isHome?: boolean;
}): AtlasTerrainDescriptor {
  const { terrain, node, seen, isHome } = params;

  if (!seen) {
    return {
      kind: "fog",
      label: "Uncharted",
      flair: "Veiled in mist · unexplored territory",
      color: "#94a3b8",
      motion: "drift",
    };
  }

  const t = terrain ?? "plain";
  let flair: string;
  let color: string;
  let motion: "drift" | "pulse" | "calm" = "drift";

  switch (t) {
    case "wood":
      color = "#16a34a";
      motion = "drift";
      if (node === "woodcut") flair = "Timber stand · seasoned heartwood";
      else if (isHome) flair = "Home timber · sheltering woods";
      else flair = "Deep woods · shaded timberland";
      break;

    case "hill":
      color = "#ca8a04";
      motion = "pulse";
      if (node === "quarry") flair = "Stone quarry · granite outcrop";
      else if (isHome) flair = "Home slopes · terraced highlands";
      else flair = "Highland slopes · mineral knolls";
      break;

    case "waste":
      color = "#a8a29e";
      motion = "pulse";
      if (node === "ruins") flair = "Ancient ruins · weathered basalt";
      else if (node === "camp") flair = "Hostile camp · smoldering watch";
      else flair = "Scorched crags · geothermal ash";
      break;

    case "shore":
      color = "#38bdf8";
      motion = "drift";
      if (isHome) flair = "Home haven · tidal waters";
      else flair = "Coastal shoreline · oceanic tides";
      break;

    case "peak":
      color = "#e2e8f0";
      motion = "pulse";
      if (isHome) flair = "Home summit · alpine vantage";
      else flair = "Alpine summit · frozen precipice";
      break;

    case "plain":
    default:
      color = "#22c55e";
      motion = "drift";
      if (node === "field") flair = "Forage pasture · meadow harvest";
      else if (isHome) flair = "Home pastures · fertile meadow";
      else flair = "Fertile grassland · open pasture";
      break;
  }

  return {
    kind: (t in { plain: 1, wood: 1, hill: 1, waste: 1, shore: 1, peak: 1 } ? t : "plain") as AtlasTerrainKind,
    label: t.charAt(0).toUpperCase() + t.slice(1),
    flair,
    color,
    motion,
  };
}

function TerrainSvgPaths(props: { kind: AtlasTerrainKind; color: string }) {
  const { kind, color } = props;

  switch (kind) {
    case "wood":
      return (
        <>
          {/* Woodland pines & leaf canopy */}
          <path d="M7 2 L10 6 L8.5 6 L11 9 L3 9 L5.5 6 L4 6 Z" fill={color} />
          <rect x="6.25" y="9" width="1.5" height="4" fill="#854d0e" />
          {/* Drifting leaf particle */}
          <circle cx="11" cy="4" r="1" fill="#4ade80" className="sc-atlas-pulse-layer" />
          <path d="M1 11 Q7 10 13 11" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" />
        </>
      );

    case "hill":
      return (
        <>
          {/* Rolling highland knolls and quarry stone */}
          <path d="M1 12 Q4 6 7 7 Q10 4 13 12 Z" fill={color} />
          <circle cx="7" cy="8" r="1.2" fill="#fef08a" className="sc-atlas-pulse-layer" />
          <path d="M4 10 L6 8 L8 10" stroke="#fef08a" strokeWidth="0.8" fill="none" opacity="0.6" />
        </>
      );

    case "waste":
      return (
        <>
          {/* Scorched basalt crags & ember spark */}
          <path d="M2 13 L5 4 L8 9 L11 5 L13 13 Z" fill={color} />
          <circle cx="8" cy="4" r="1" fill="#f97316" className="sc-atlas-pulse-layer" />
          <circle cx="5" cy="2" r="0.75" fill="#ef4444" className="sc-atlas-drift-layer" />
          <path d="M4 9 L7 12 L10 8" stroke="#1c1917" strokeWidth="0.8" fill="none" />
        </>
      );

    case "shore":
      return (
        <>
          {/* Ocean breakers & wave crests */}
          <path d="M1 6 Q4 3 7 6 Q10 9 13 6 L13 12 L1 12 Z" fill={color} opacity="0.8" />
          <path d="M1 9 Q4 7 7 9 Q10 11 13 9" stroke="#bae6fd" strokeWidth="0.9" fill="none" className="sc-atlas-drift-layer" />
          <circle cx="10" cy="5" r="0.8" fill="#e0f2fe" className="sc-atlas-pulse-layer" />
        </>
      );

    case "peak":
      return (
        <>
          {/* Alpine summit & glacial ice star */}
          <polygon points="7,2 12,12 2,12" fill={color} />
          <polygon points="7,2 9,6 7,5 5,6" fill="#ffffff" />
          <circle cx="7" cy="2" r="1" fill="#93c5fd" className="sc-atlas-pulse-layer" />
          <path d="M4 12 L7 8 L10 12" stroke="#64748b" strokeWidth="0.8" fill="none" />
        </>
      );

    case "fog":
      return (
        <>
          {/* Swirling mist veil & obscure star */}
          <ellipse cx="6" cy="8" rx="4" ry="2.5" fill={color} opacity="0.5" className="sc-atlas-drift-layer" />
          <ellipse cx="9" cy="6" rx="3.5" ry="2" fill={color} opacity="0.4" className="sc-atlas-pulse-layer" />
          <circle cx="7" cy="6.5" r="1" fill="#cbd5e1" className="sc-atlas-pulse-layer" />
        </>
      );

    case "plain":
    default:
      return (
        <>
          {/* Meadow grass blades and blossom spark */}
          <path d="M2 12 Q5 5 7 12 Q9 4 12 12 Z" fill={color} />
          <circle cx="7" cy="4.5" r="1.1" fill="#facc15" className="sc-atlas-pulse-layer" />
          <path d="M1 12 L13 12" stroke={color} strokeWidth="1" />
        </>
      );
  }
}

export function AtlasTerrainUnderlay(props: {
  terrain?: string;
  node?: string;
  seen: boolean;
  isHome?: boolean;
}) {
  const desc = resolveAtlasTerrainLiving(props);

  return (
    <span
      className={`sc-atlas-terrain-underlay terrain-${desc.kind} motion-${desc.motion}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 14 14"
        width="34"
        height="34"
        className="sc-atlas-underlay-svg"
        aria-hidden="true"
      >
        <g className="sc-atlas-glow-layer">
          <TerrainSvgPaths kind={desc.kind} color={desc.color} />
        </g>
      </svg>
    </span>
  );
}

export function AtlasTerrainLivingGlyph(props: {
  terrain?: string;
  node?: string;
  seen: boolean;
  isHome?: boolean;
}) {
  const desc = resolveAtlasTerrainLiving(props);

  return (
    <div
      className={`sc-atlas-terrain-glyph terrain-${desc.kind} motion-${desc.motion}`}
      aria-hidden="true"
    >
      <span className="sc-atlas-terrain-icon" style={{ color: desc.color }}>
        <svg
          viewBox="0 0 14 14"
          width="14"
          height="14"
          className="sc-atlas-glyph-svg"
          aria-hidden="true"
        >
          <g className="sc-atlas-glow-layer">
            <TerrainSvgPaths kind={desc.kind} color={desc.color} />
          </g>
        </svg>
      </span>
      <span className="sc-atlas-terrain-flair">{desc.flair}</span>
    </div>
  );
}
