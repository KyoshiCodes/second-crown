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
];

export function getCulture(id: string | undefined): CultureDef {
  return CULTURES.find((c) => c.id === id) ?? CULTURES[0];
}
