export const REALM_CREST: Record<string, { glyph: string; color: string; label: string }> = {
  player: { glyph: "♕", color: "#d4a72c", label: "Your Crown" },
  rival: { glyph: "⚔", color: "#8b1e1e", label: "Iron March" },
  k_silk: { glyph: "⚓", color: "#c9a227", label: "Silk Coast" },
  k_ash: { glyph: "▲", color: "#b85c38", label: "Ash Nomads" },
  k_veil: { glyph: "✦", color: "#6b5b95", label: "Veil Theocracy" },
  k_glass: { glyph: "◇", color: "#5b8fa8", label: "Glass Cities" },
};

export const UNIT_VIS: Record<string, { glyph: string; color: string; name: string }> = {
  militia: { glyph: "⚐", color: "#7a8b6f", name: "Militia" },
  spearman: { glyph: "†", color: "#4a6fa5", name: "Spearman" },
  archer: { glyph: "↻", color: "#3d8b6e", name: "Archer" },
  knight: { glyph: "♞", color: "#8b6914", name: "Knight" },
};

export function crestFor(id: string) {
  return REALM_CREST[id] ?? { glyph: "✦", color: "#666", label: id };
}

export function unitVis(id: string) {
  return UNIT_VIS[id] ?? { glyph: "?", color: "#555", name: id };
}
