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
  player: {
    glyph: "\u2655",
    color: "#9a7412",
    fieldAccent: "#5e4304",
    rim: { from: "#ffe898", to: "#875f14" },
    ink: "#fdf3cd",
    accent: "#f59e0b",
    label: "Your Crown",
    chargeName: "Imperial Solar Crown",
    chargeDesc: "A triple-peaked sovereign crown adorned with radiant solar rays and imperial jewels",
  },
  rival: {
    glyph: "\u2694",
    color: "#6b1414",
    fieldAccent: "#380808",
    rim: { from: "#b0bcc8", to: "#2d3748" },
    ink: "#d8dee9",
    accent: "#e74c3c",
    label: "Iron March",
    chargeName: "Crossed Greatswords & Iron Keep",
    chargeDesc: "Two broad war-blades crossed behind a crenellated iron bastion keep",
  },
  k_silk: {
    glyph: "\u2693",
    color: "#1a5b66",
    fieldAccent: "#0e353c",
    rim: { from: "#fad961", to: "#b8860b" },
    ink: "#fce79a",
    accent: "#f1c40f",
    label: "Silk Coast",
    chargeName: "Gilded Caravel & Balance Scales",
    chargeDesc: "A full-rigged merchant caravel riding ocean crests framed by commerce scales",
  },
  k_ash: {
    glyph: "\u25b2",
    color: "#6b2c15",
    fieldAccent: "#2b1007",
    rim: { from: "#c98a58", to: "#4a2411" },
    ink: "#f3d5b5",
    accent: "#e67e22",
    label: "Ash Nomads",
    chargeName: "Horned Steppe Skull & Recurve Bow",
    chargeDesc: "A great-horned nomad beast skull superimposed over a composite recurve war-bow",
  },
  k_veil: {
    glyph: "\u2726",
    color: "#3d2b63",
    fieldAccent: "#1f1435",
    rim: { from: "#e2e8f0", to: "#64748b" },
    ink: "#ede9fe",
    accent: "#a78bfa",
    label: "Veil Theocracy",
    chargeName: "Radiant Eye of Providence & Eightfold Star",
    chargeDesc: "The sacred celestial eye encircled by eight piercing rays of the dawn star",
  },
  k_glass: {
    glyph: "\u25c7",
    color: "#1e4e61",
    fieldAccent: "#0c2833",
    rim: { from: "#bae6fd", to: "#0284c7" },
    ink: "#e0f2fe",
    accent: "#06b6d4",
    label: "Glass Cities",
    chargeName: "Faceted Astrolabe & Prism Spire",
    chargeDesc: "A multifaceted diamond prism intersected by astronomical armillary rings",
  },
  k_frost: {
    glyph: "\u2744",
    color: "#1c3d5a",
    fieldAccent: "#091c2b",
    rim: { from: "#e0f2fe", to: "#38bdf8" },
    ink: "#f0f9ff",
    accent: "#7dd3fc",
    label: "Frost Holds",
    chargeName: "Twin Bearded Waraxes & Runic Stag",
    chargeDesc: "Crossed heavy Nordic bearded axes surmounted by a horned runic frost-stag",
  },
  k_tide: {
    glyph: "\u2248",
    color: "#0c4052",
    fieldAccent: "#041e27",
    rim: { from: "#6ee7b7", to: "#0f766e" },
    ink: "#ccfbf1",
    accent: "#2dd4bf",
    label: "Tide Princes",
    chargeName: "Abyssal Trident & Breaker Waves",
    chargeDesc: "A barbed sea-king trident gripped by coiled leviathan tentacles above tidal waves",
  },
  k_ember: {
    glyph: "\u2604",
    color: "#5a180c",
    fieldAccent: "#2d0b05",
    rim: { from: "#fdba74", to: "#c2410c" },
    ink: "#ffedd5",
    accent: "#ea580c",
    label: "Ember Concord",
    chargeName: "Rising Fire-Phoenix & Arcane Flame",
    chargeDesc: "An immortal fire-phoenix with spread wings ascending from an arcane brazier flame",
  },
  k_bronze: {
    glyph: "\u03a9",
    color: "#4a3512",
    fieldAccent: "#211604",
    rim: { from: "#fde68a", to: "#92400e" },
    ink: "#fef3c7",
    accent: "#d97706",
    label: "Bronze League",
    chargeName: "Corinthian Hoplite Helm & Laurel Wreath",
    chargeDesc: "An ancient crested Corinthian bronze war-helmet flanked by victor's laurel branches",
  },
};

export const UNIT_VIS: Record<string, { glyph: string; color: string; name: string }> = {
  militia: { glyph: "\u2690", color: "#7a8b6f", name: "Militia" },
  spearman: { glyph: "\u2020", color: "#4a6fa5", name: "Spearman" },
  archer: { glyph: "\u21bb", color: "#3d8b6e", name: "Archer" },
  knight: { glyph: "\u265e", color: "#8b6914", name: "Knight" },
};

export function crestFor(id: string): CrestMeta {
  return (
    REALM_CREST[id] ?? {
      glyph: "\u2726",
      color: "#333333",
      fieldAccent: "#1a1a1a",
      rim: { from: "#888888", to: "#444444" },
      ink: "#e5e5e5",
      accent: "#aaaaaa",
      label: id,
      chargeName: "Standard Heater Shield",
      chargeDesc: "An unadorned heraldic field",
    }
  );
}

export function unitVis(id: string) {
  return UNIT_VIS[id] ?? { glyph: "?", color: "#555", name: id };
}
