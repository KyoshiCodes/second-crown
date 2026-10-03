export interface CultureDef {
  id: string;
  name: string;
  blurb: string;
  palette: { tabard: string; timber: string; stone: string };
}

export const CULTURES: CultureDef[] = [
  {
    id: "western",
    name: "Crown Marches",
    blurb: "Keep, levy, and heater shield. The default host.",
    palette: { tabard: "#1e40af", timber: "#5c3818", stone: "#64748b" },
  },
  {
    id: "woodland",
    name: "Cedar Kin",
    blurb: "Longhouse timber, cedar posts, and hide-and-bead companies.",
    palette: { tabard: "#14532d", timber: "#854d0e", stone: "#78716c" },
  },
  {
    id: "desert",
    name: "Sand Banner",
    blurb: "Courtyard halls, pale stone, and lance-and-bow hosts.",
    palette: { tabard: "#b45309", timber: "#a16207", stone: "#d6c7a1" },
  },
  {
    id: "steppe",
    name: "Wind Host",
    blurb: "Felt halls, horse banners, and wide-sky riders.",
    palette: { tabard: "#9f1239", timber: "#7c2d12", stone: "#57534e" },
  },
  {
    id: "tide",
    name: "Tide Clans",
    blurb: "Stilt halls, salt timber, and sea-green sails.",
    palette: { tabard: "#0e7490", timber: "#44403c", stone: "#94a3b8" },
  },
  {
    id: "mist",
    name: "Mist Reach",
    blurb: "Western halls on wet ground. Farms feed +1.",
    palette: { tabard: "#475569", timber: "#5c3818", stone: "#64748b" },
  },
  {
    id: "glen",
    name: "Glen Holds",
    blurb: "Western halls in stony glens. Quarries cut +1.",
    palette: { tabard: "#4d7c0f", timber: "#5c3818", stone: "#78716c" },
  },
  {
    id: "salt",
    name: "Salt Reaches",
    blurb: "Western halls on the salt flats. Woodcutters fell +1.",
    palette: { tabard: "#a8a29e", timber: "#5c3818", stone: "#d6d3d1" },
  },
  {
    id: "fen",
    name: "Fen Steads",
    blurb: "Western halls on the fens. Cottages hold +1.",
    palette: { tabard: "#3f6212", timber: "#5c3818", stone: "#6b7280" },
  },
];

/** Cultures an NPC crown can be seeded with. Mist, glen, salt, and fen are player-pick only, so old seeds do not shift. */
export const NPC_CULTURE_IDS = ["western", "woodland", "desert", "steppe", "tide"] as const;

/** Mist builds as western. Its one difference: each finished farm feeds a flat +1 food per tick, after multipliers. */
export const MIST_FARM_BONUS = 1;

/** Glen builds as western. Its one difference: each finished quarry cuts a flat +1 stone per tick, after multipliers. */
export const GLEN_QUARRY_BONUS = 1;

/** Salt builds as western. Its one difference: each finished lumber camp fells a flat +1 wood per tick, after multipliers. */
export const SALT_WOOD_BONUS = 1;

/** Fen builds as western. Its one difference: each finished cottage holds +1 citizen. */
export const FEN_COTTAGE_BONUS = 1;

export function getCulture(id: string | undefined): CultureDef {
  return CULTURES.find((c) => c.id === id) ?? CULTURES[0];
}
