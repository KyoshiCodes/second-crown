export type HolidayId = "none" | "halloween" | "midwinter" | "easter" | "harvest" | "midsummer";

export interface HolidayMeta {
  id: HolidayId;
  name: string;
  subtitle: string;
  propName: string;
  propEmoji: string;
  blurb: string;
  accentColor: string;
  glowColor: string;
  themeClass: string;
}

export const HOLIDAYS: Record<HolidayId, HolidayMeta> = {
  none: {
    id: "none",
    name: "Common Days",
    subtitle: "Regular Season",
    propName: "Standard Realm",
    propEmoji: "⚔️",
    blurb: "The everyday march of seasons through the realm.",
    accentColor: "#d4a72c",
    glowColor: "rgba(212, 167, 44, 0.25)",
    themeClass: "",
  },
  halloween: {
    id: "halloween",
    name: "All Hallows Eve",
    subtitle: "Night of the Pale Riders",
    propName: "Jack-o'-Lanterns & Ghost Wisps",
    propEmoji: "🎃",
    blurb: "Veils between worlds grow razor-thin. Carved gourds flicker with witchfire along the ramparts as spectral riders pass.",
    accentColor: "#f97316",
    glowColor: "rgba(249, 115, 22, 0.4)",
    themeClass: "holiday-halloween",
  },
  midwinter: {
    id: "midwinter",
    name: "Midwinter Tide",
    subtitle: "Feast of the Evergreen & Star",
    propName: "Holly Wreaths & Golden Bells",
    propEmoji: "🎄",
    blurb: "Crisp snow blankets the hold. Holly boughs, pine-scented braziers, and golden carillons celebrate the return of the sun.",
    accentColor: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.4)",
    themeClass: "holiday-midwinter",
  },
  easter: {
    id: "easter",
    name: "Dawn Feast",
    subtitle: "Rites of Spring Awakening",
    propName: "Painted Eggs & White Lilies",
    propEmoji: "🪺",
    blurb: "Ancient renewal rites herald the dawn. Baskets of gem-painted eggs and blooming lilies deck the hall as young crops push through the loam.",
    accentColor: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    themeClass: "holiday-easter",
  },
  harvest: {
    id: "harvest",
    name: "Harvest Moon",
    subtitle: "The Great Ingathering",
    propName: "Golden Sheaves & Cider Casks",
    propEmoji: "🌕",
    blurb: "A giant copper moon rises over heavily laden wagons. The grain stores overflow, and farmers drink mulled cider around great timber tables.",
    accentColor: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.4)",
    themeClass: "holiday-harvest",
  },
  midsummer: {
    id: "midsummer",
    name: "Midsummer Solstice",
    subtitle: "Sunburst Vigils",
    propName: "Solstice Bonfire & Sunburst",
    propEmoji: "☀️",
    blurb: "The sun refuses to set. Hilltop bonfires blaze through the twilight, dancing fireflies light the orchards, and the sovereign court keeps vigil.",
    accentColor: "#fb923c",
    glowColor: "rgba(251, 146, 60, 0.4)",
    themeClass: "holiday-midsummer",
  },
};

const STORAGE_KEY = "sc-preview-holiday";

/**
 * Returns holiday from real-world date.
 */
export function getCalendarHoliday(now = new Date()): HolidayId {
  const month = now.getMonth(); // 0 = Jan, 9 = Oct, 11 = Dec
  const day = now.getDate();

  // All Hallows / Halloween: Oct 20 - Nov 2
  if ((month === 9 && day >= 20) || (month === 10 && day <= 2)) {
    return "halloween";
  }

  // Midwinter / Christmas-tide: Dec 18 - Jan 6
  if ((month === 11 && day >= 18) || (month === 0 && day <= 6)) {
    return "midwinter";
  }

  // Dawn Feast / Easter-tide: March 22 - April 25
  if ((month === 2 && day >= 22) || (month === 3 && day <= 25)) {
    return "easter";
  }

  // Midsummer: June 18 - June 26
  if (month === 5 && day >= 18 && day <= 26) {
    return "midsummer";
  }

  // Harvest Moon: Sept 15 - Sept 26
  if (month === 8 && day >= 15 && day <= 26) {
    return "harvest";
  }

  return "none";
}

export function getHolidayOverride(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "auto";
  } catch {
    return "auto";
  }
}

export function setHolidayOverride(val: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, val);
    window.dispatchEvent(new CustomEvent("sc-holiday-change", { detail: val }));
  } catch {
    /* ignore */
  }
}

export function detectCurrentHoliday(): HolidayId {
  const override = getHolidayOverride();
  if (override && override !== "auto" && override in HOLIDAYS) {
    return override as HolidayId;
  }
  return getCalendarHoliday();
}

export function getHolidayMeta(id: HolidayId): HolidayMeta {
  return HOLIDAYS[id] ?? HOLIDAYS.none;
}

