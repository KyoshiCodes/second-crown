import React from "react";
import { ITEMS, type ITEM_TIERS } from "@second-crown/sim";

export type ItemTier = (typeof ITEM_TIERS)[number];

export interface ItemDef {
  id: string;
  name: string;
  tier: ItemTier;
  spoils: "iron" | "banners" | "relics";
  desc?: string;
}

export const ITEM_TIER_CONFIG: Record<
  ItemTier,
  {
    label: string;
    border: string;
    bg: string;
    text: string;
    glow: string;
  }
> = {
  common: {
    label: "Common",
    border: "#6e7681",
    bg: "rgba(110, 118, 129, 0.16)",
    text: "#c9d1d9",
    glow: "rgba(110, 118, 129, 0.25)",
  },
  uncommon: {
    label: "Uncommon",
    border: "#3fb950",
    bg: "rgba(63, 185, 80, 0.14)",
    text: "#56d364",
    glow: "rgba(63, 185, 80, 0.35)",
  },
  rare: {
    label: "Rare",
    border: "#388bfd",
    bg: "rgba(56, 139, 253, 0.15)",
    text: "#58a6ff",
    glow: "rgba(56, 139, 253, 0.4)",
  },
  epic: {
    label: "Epic",
    border: "#a371f7",
    bg: "rgba(163, 113, 247, 0.18)",
    text: "#d2a8ff",
    glow: "rgba(163, 113, 247, 0.45)",
  },
};

export function ItemIcon(props: { id: string; size?: number }) {
  const size = props.size ?? 20;
  if (props.id === "iron_shard") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
        <polygon points="12,2 18,14 14,22 8,18 6,8" fill="#8b949e" stroke="#c9d1d9" strokeWidth="1.5" />
        <polygon points="12,2 14,14 8,18" fill="#c9d1d9" opacity="0.6" />
        <line x1="12" y1="2" x2="14" y2="14" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
      </svg>
    );
  }
  if (props.id === "war_banner") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
        <line x1="5" y1="2" x2="5" y2="22" stroke="#8b5a2b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M5,4 Q14,2 19,7 Q14,12 5,14 Z" fill="#2f6f4e" stroke="#3fb950" strokeWidth="1.2" />
        <polygon points="11,6 13,8 10,10" fill="#e3b341" />
        <circle cx="5" cy="3" r="1.5" fill="#e3b341" />
      </svg>
    );
  }
  if (props.id === "ash_relic") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
        <ellipse cx="12" cy="17" rx="6" ry="3" fill="#1f2937" stroke="#388bfd" strokeWidth="1.5" />
        <path d="M6,17 Q6,10 12,9 Q18,10 18,17 Z" fill="#1e3a5f" stroke="#58a6ff" strokeWidth="1.5" />
        <circle cx="12" cy="7" r="2.5" fill="#58a6ff" />
        <path d="M10,6 Q12,2 14,6" stroke="#79c0ff" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="12" cy="13" r="1.5" fill="#79c0ff" opacity="0.9" />
      </svg>
    );
  }
  if (props.id === "crown_splinter") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
        <polygon points="12,3 15,10 21,9 17,16 19,22 12,18 5,22 7,16 3,9 9,10" fill="#e3b341" stroke="#bc8cff" strokeWidth="1.2" />
        <polygon points="12,3 15,10 12,18 9,10" fill="#fef08a" opacity="0.75" />
        <circle cx="12" cy="12" r="2" fill="#bc8cff" />
      </svg>
    );
  }
  // Generic material
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="8" fill="#4a5568" stroke="#cbd5e1" strokeWidth="1.5" />
    </svg>
  );
}

export function ItemChip(props: {
  itemId: string;
  count?: number | string;
  label?: string;
  showTier?: boolean;
}) {
  const item = ITEMS.find((i) => i.id === props.itemId);
  const tier = (item?.tier ?? "common") as ItemTier;
  const cfg = ITEM_TIER_CONFIG[tier];
  const displayName = props.label ?? item?.name ?? props.itemId;

  return (
    <span
      className={`sc-item-chip tier-${tier}`}
      title={`${displayName} (${cfg.label})`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        borderRadius: 6,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        color: cfg.text,
        fontSize: 12.5,
        fontWeight: 500,
        boxShadow: `0 1px 4px ${cfg.glow}`,
        lineHeight: 1.2,
      }}
    >
      <ItemIcon id={props.itemId} size={16} />
      <span>{displayName}</span>
      {props.showTier ? (
        <span
          style={{
            fontSize: 10,
            opacity: 0.75,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {cfg.label}
        </span>
      ) : null}
      {props.count !== undefined ? (
        <strong
          style={{
            marginLeft: 2,
            padding: "1px 5px",
            borderRadius: 4,
            background: "rgba(0, 0, 0, 0.35)",
            color: "#fff",
            fontSize: 11.5,
          }}
        >
          {props.count}
        </strong>
      ) : null}
    </span>
  );
}
