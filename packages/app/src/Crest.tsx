import React from "react";
import { crestFor } from "./crests";

function Shield(props: { fill: string; field: string; charge: string; size: number }) {
  const { fill, field, charge, size } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 64 72" aria-hidden="true">
      <defs>
        <linearGradient id={`g${fill.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="55%" stopColor={fill} />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 L56 12 V34 C56 52 44 64 32 70 C20 64 8 52 8 34 V12 Z"
        fill={`url(#g${fill.replace("#", "")})`}
        stroke="#1a1208"
        strokeWidth="2"
      />
      <path d="M32 10 L50 16 V34 C50 48 40 58 32 63 C24 58 14 48 14 34 V16 Z" fill={field} opacity="0.92" />
      <text x="32" y="40" textAnchor="middle" fontSize="22" fill={charge} fontFamily="Georgia, serif">
        {props.charge.length === 1 ? "" : ""}
      </text>
    </svg>
  );
}

const CHARGE: Record<string, string> = {
  player: "M32 22 L36 34 H48 L38 41 L42 54 L32 46 L22 54 L26 41 L16 34 H28 Z",
  rival: "M22 24 L32 20 L42 24 L40 48 L32 56 L24 48 Z",
  k_silk: "M20 36 Q32 18 44 36 Q32 30 20 36 M24 40 H40",
  k_ash: "M32 20 L44 48 H20 Z",
  k_veil: "M32 20 L36 32 L48 32 L38 40 L42 52 L32 44 L22 52 L26 40 L16 32 L28 32 Z",
  k_glass: "M32 18 L46 32 L32 54 L18 32 Z",
  k_frost: "M32 18 V54 M20 28 L44 44 M44 28 L20 44",
  k_tide: "M16 34 Q24 28 32 34 Q40 40 48 34 M16 42 Q24 36 32 42 Q40 48 48 42",
  k_ember: "M32 20 C40 32 40 40 32 54 C24 40 24 32 32 20 Z",
  k_bronze: "M22 28 H42 V36 H22 Z M28 36 V50 H36 V36",
};

export function Crest(props: { realmId: string; size?: number }) {
  const c = crestFor(props.realmId);
  const size = props.size ?? 28;
  const charge = CHARGE[props.realmId] ?? CHARGE.k_veil;
  const ink = "#f4e6c3";
  return (
    <span title={c.label} style={{ display: "inline-flex", alignItems: "center", marginRight: 6, verticalAlign: "middle" }}>
      <svg width={size} height={size * 1.12} viewBox="0 0 64 72">
        <defs>
          <linearGradient id={`rim${props.realmId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#efe4c4" />
            <stop offset="100%" stopColor="#6a5428" />
          </linearGradient>
        </defs>
        <path d="M32 4 L56 12 V34 C56 52 44 64 32 70 C20 64 8 52 8 34 V12 Z" fill={`url(#rim${props.realmId})`} />
        <path d="M32 8 L52 14 V34 C52 49 42 59 32 64 C22 59 12 49 12 34 V14 Z" fill={c.color} />
        <path d={charge} fill={ink} stroke="#1a1008" strokeWidth="1.2" />
      </svg>
    </span>
  );
}
