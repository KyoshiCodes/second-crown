export const REALM_CREST: Record<string, { glyph: string; color: string; label: string }> = {
  player: { glyph: "\u2655", color: "#d4a72c", label: "Your Crown" },
  rival: { glyph: "\u2694", color: "#8b1e1e", label: "Iron March" },
  k_silk: { glyph: "\u2693", color: "#c9a227", label: "Silk Coast" },
  k_ash: { glyph: "\u25b2", color: "#b85c38", label: "Ash Nomads" },
  k_veil: { glyph: "\u2726", color: "#6b5b95", label: "Veil Theocracy" },
  k_glass: { glyph: "\u25c7", color: "#5b8fa8", label: "Glass Cities" },
  k_frost: { glyph: "\u2744", color: "#7ec8e3", label: "Frost Holds" },
  k_tide: { glyph: "\u2248", color: "#1f6f8b", label: "Tide Princes" },
  k_ember: { glyph: "\u2604", color: "#c45c26", label: "Ember Concord" },
  k_bronze: { glyph: "\u03a9", color: "#b08d57", label: "Bronze League" },
};

export const UNIT_VIS: Record<string, { glyph: string; color: string; name: string }> = {
  militia: { glyph: "\u2690", color: "#7a8b6f", name: "Militia" },
  spearman: { glyph: "\u2020", color: "#4a6fa5", name: "Spearman" },
  archer: { glyph: "\u21bb", color: "#3d8b6e", name: "Archer" },
  knight: { glyph: "\u265e", color: "#8b6914", name: "Knight" },
};

export function crestFor(id: string) {
  return REALM_CREST[id] ?? { glyph: "\u2726", color: "#666", label: id };
}

export function unitVis(id: string) {
  return UNIT_VIS[id] ?? { glyph: "?", color: "#555", name: id };
}
