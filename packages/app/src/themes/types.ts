export type ThemePackId =
  | "halloween"
  | "midwinter"
  | "easter"
  | "harvest"
  | "midsummer"
  | "spring"
  | "summer"
  | "autumn"
  | "winter";

export interface ThemeChrome {
  accentColor: string;
  borderColor: string;
  cardBg: string;
  glowColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  tabActiveBorder: string;
  tabActiveBg: string;
}

export interface MapAmbientConfig {
  groundA: number;
  groundB: number;
  gridColor: number;
  roadColor: number;
  roadCobble: number;
  cliffColor: number;
  cliffDark: number;
  skyTint: number;
  skyTintAlpha: number;
  decorations: "none" | "halloween" | "midwinter" | "easter" | "harvest" | "midsummer" | "spring" | "summer" | "autumn" | "winter";
}

export interface ThemePack {
  id: ThemePackId;
  name: string;
  subtitle: string;
  isHoliday: boolean;
  musicSrc: string;
  battleSrc?: string;
  backgroundCss: string;
  chrome: ThemeChrome;
  mapAmbient: MapAmbientConfig;
  propEmoji: string;
  blurb: string;
}
