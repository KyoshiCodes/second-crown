export interface CrestMeta {
  glyph: string;
  color: string;
  fieldAccent: string;
  rim: { from: string; to: string };
  ink: string;
  accent: string;
  label: string;
  chargeName: string;
  chargeDesc: string;
}

export const REALM_CREST: Record<string, CrestMeta> = {
  player: { glyph: "\u2655", color: "#9a7412", fieldAccent: "#5e4304", rim: { from: "#ffe898", to: "#875f14" }, ink: "#fdf3cd", accent: "#f59e0b", label: "Your Crown", chargeName: "Imperial Solar Crown", chargeDesc: "Sovereign crown with solar rays" },
  rival: { glyph: "\u2694", color: "#6b1414", fieldAccent: "#380808", rim: { from: "#b0bcc8", to: "#2d3748" }, ink: "#d8dee9", accent: "#e74c3c", label: "Iron March", chargeName: "Crossed Greatswords & Iron Keep", chargeDesc: "Blades and keep" },
  k_silk: { glyph: "\u2693", color: "#1a5b66", fieldAccent: "#0e353c", rim: { from: "#fad961", to: "#b8860b" }, ink: "#fce79a", accent: "#f1c40f", label: "Silk Coast", chargeName: "Gilded Caravel & Balance Scales", chargeDesc: "Merchant ship" },
  k_ash: { glyph: "\u25b2", color: "#6b2c15", fieldAccent: "#2b1007", rim: { from: "#c98a58", to: "#4a2411" }, ink: "#f3d5b5", accent: "#e67e22", label: "Ash Nomads", chargeName: "Horned Steppe Skull & Recurve Bow", chargeDesc: "Skull and bow" },
  k_veil: { glyph: "\u2726", color: "#3d2b63", fieldAccent: "#1f1435", rim: { from: "#e2e8f0", to: "#64748b" }, ink: "#ede9fe", accent: "#a78bfa", label: "Veil Theocracy", chargeName: "Radiant Eye of Providence & Eightfold Star", chargeDesc: "Sacred eye" },
  k_glass: { glyph: "\u25c7", color: "#1e4e61", fieldAccent: "#0c2833", rim: { from: "#bae6fd", to: "#0284c7" }, ink: "#e0f2fe", accent: "#06b6d4", label: "Glass Cities", chargeName: "Faceted Astrolabe & Prism Spire", chargeDesc: "Prism" },
  k_frost: { glyph: "\u2744", color: "#1c3d5a", fieldAccent: "#091c2b", rim: { from: "#e0f2fe", to: "#38bdf8" }, ink: "#f0f9ff", accent: "#7dd3fc", label: "Frost Holds", chargeName: "Twin Bearded Waraxes & Runic Stag", chargeDesc: "Axes and stag" },
  k_tide: { glyph: "\u2248", color: "#0c4052", fieldAccent: "#041e27", rim: { from: "#6ee7b7", to: "#0f766e" }, ink: "#ccfbf1", accent: "#2dd4bf", label: "Tide Princes", chargeName: "Abyssal Trident & Breaker Waves", chargeDesc: "Trident" },
  k_ember: { glyph: "\u2604", color: "#5a180c", fieldAccent: "#2d0b05", rim: { from: "#fdba74", to: "#c2410c" }, ink: "#ffedd5", accent: "#ea580c", label: "Ember Concord", chargeName: "Rising Fire-Phoenix & Arcane Flame", chargeDesc: "Phoenix" },
  k_bronze: { glyph: "\u03a9", color: "#4a3512", fieldAccent: "#211604", rim: { from: "#fde68a", to: "#92400e" }, ink: "#fef3c7", accent: "#d97706", label: "Bronze League", chargeName: "Corinthian Hoplite Helm & Laurel Wreath", chargeDesc: "Helm" },
};

export const UNIT_VIS: Record<string, { glyph: string; color: string; name: string }> = {
  militia: { glyph: "\u2690", color: "#7a8b6f", name: "Militia" },
  spearman: { glyph: "\u2020", color: "#4a6fa5", name: "Spearman" },
  archer: { glyph: "\u21bb", color: "#3d8b6e", name: "Archer" },
  knight: { glyph: "\u265e", color: "#8b6914", name: "Knight" },
};

export function crestFor(id: string): CrestMeta {
  return REALM_CREST[id] ?? {
    glyph: "\u2726", color: "#333", fieldAccent: "#111", rim: { from: "#888", to: "#444" }, ink: "#eee", accent: "#aaa", label: id, chargeName: "Heater Shield", chargeDesc: "Plain field",
  };
}

export function unitVis(id: string) {
  return UNIT_VIS[id] ?? { glyph: "?", color: "#555", name: id };
}
