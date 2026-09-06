import type { GameState } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";

export interface Achievement {
  id: string;
  name: string;
  hint: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "ach_farm", name: "First Furrow", hint: "Build a farm." },
  { id: "ach_war", name: "War Horn", hint: "Declare or suffer a war." },
  { id: "ach_win", name: "Field Crown", hint: "Win a battle." },
  { id: "ach_guild", name: "Raised Banner", hint: "Found a guild." },
  { id: "ach_gift", name: "Open Hand", hint: "Send 3 tributes." },
  { id: "ach_ascend", name: "Second Dawn", hint: "Ascend once." },
  { id: "ach_craft", name: "Forge Hand", hint: "Craft one relic." },
  { id: "ach_shield", name: "Iron Veil", hint: "Buy an offline shield." },
];

export const CRAFTS = [
  { id: "harvest_charm", name: "Harvest Charm", cost: { iron: 8 }, flag: "craft_income", value: 2, blurb: "+2 production bonus" },
  { id: "drill_manual", name: "Drill Manual", cost: { banners: 6 }, flag: "craft_train", value: 1, blurb: "Cheaper training" },
  { id: "silk_seal", name: "Silk Seal", cost: { relics: 4 }, flag: "craft_opinion", value: 1, blurb: "Gifts land harder" },
] as const;

export const KINGDOM_OFFERS: Record<string, { id: string; give: Record<string, string>; get: Record<string, string>; label: string }[]> = {
  rival: [{ id: "rival_iron", give: { gold: "20" }, get: { iron: "3" }, label: "20 gold for 3 iron" }],
  k_silk: [{ id: "silk_banner", give: { gold: "18" }, get: { banners: "2" }, label: "18 gold for 2 banners" }],
  k_ash: [{ id: "ash_iron", give: { food: "40" }, get: { iron: "2" }, label: "40 food for 2 iron" }],
  k_veil: [{ id: "veil_relic", give: { gold: "30" }, get: { relics: "1" }, label: "30 gold for 1 relic" }],
  k_glass: [{ id: "glass_relic", give: { stone: "35" }, get: { relics: "1" }, label: "35 stone for 1 relic" }],
  k_frost: [{ id: "frost_iron", give: { wood: "30" }, get: { iron: "2" }, label: "30 wood for 2 iron" }],
  k_tide: [{ id: "tide_banner", give: { food: "25" }, get: { banners: "2" }, label: "25 food for 2 banners" }],
  k_ember: [{ id: "ember_relic", give: { gold: "28" }, get: { relics: "1" }, label: "28 gold for 1 relic" }],
  k_bronze: [{ id: "bronze_iron", give: { gold: "16" }, get: { iron: "2" }, label: "16 gold for 2 iron" }],
};

export const GUILD_CRESTS = ["sun", "keep", "ship", "stag", "eye", "helm"];

export function flagNum(state: GameState, key: string): number {
  const v = state.flags[key];
  return typeof v === "number" ? v : Number(v ?? 0) || 0;
}

export function addSpoils(state: GameState, iron: number, banners: number, relics: number): void {
  state.flags.spoils_iron = flagNum(state, "spoils_iron") + iron;
  state.flags.spoils_banners = flagNum(state, "spoils_banners") + banners;
  state.flags.spoils_relics = flagNum(state, "spoils_relics") + relics;
}

export function grantVictorySpoils(state: GameState): void {
  addSpoils(state, 3, 2, 1);
  state.flags.wars_won = flagNum(state, "wars_won") + 1;
  unlock(state, "ach_win");
}

export function shieldTicksLeft(state: GameState): number {
  return Math.max(0, flagNum(state, "shield_until") - state.meta.tick);
}

export function isShielded(state: GameState): boolean {
  return shieldTicksLeft(state) > 0;
}

export function tryBuyShield(state: GameState, costGold = 250, durationTicks = 2000): boolean {
  if (D(state.resources.gold ?? "0").lt(costGold)) return false;
  state.resources.gold = toDecimalString(D(state.resources.gold ?? "0").sub(costGold));
  state.flags.shield_until = state.meta.tick + durationTicks;
  unlock(state, "ach_shield");
  return true;
}

export function tryCraft(state: GameState, craftId: string): boolean {
  const craft = CRAFTS.find((c) => c.id === craftId);
  if (!craft) return false;
  if (flagNum(state, craft.flag)) return false;
  for (const [k, n] of Object.entries(craft.cost)) {
    const key = `spoils_${k}`;
    if (flagNum(state, key) < n) return false;
  }
  for (const [k, n] of Object.entries(craft.cost)) {
    state.flags[`spoils_${k}`] = flagNum(state, `spoils_${k}`) - n;
  }
  state.flags[craft.flag] = craft.value;
  unlock(state, "ach_craft");
  return true;
}

export function tryKingdomTrade(state: GameState, realmId: string, offerId: string): boolean {
  const offer = (KINGDOM_OFFERS[realmId] ?? []).find((o) => o.id === offerId);
  if (!offer) return false;
  for (const [res, amt] of Object.entries(offer.give)) {
    if (res === "iron" || res === "banners" || res === "relics") {
      if (flagNum(state, `spoils_${res}`) < Number(amt)) return false;
    } else if (D(state.resources[res] ?? "0").lt(D(amt))) return false;
  }
  for (const [res, amt] of Object.entries(offer.give)) {
    if (res === "iron" || res === "banners" || res === "relics") {
      state.flags[`spoils_${res}`] = flagNum(state, `spoils_${res}`) - Number(amt);
    } else {
      state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").sub(D(amt)));
    }
  }
  for (const [res, amt] of Object.entries(offer.get)) {
    if (res === "iron" || res === "banners" || res === "relics") {
      state.flags[`spoils_${res}`] = flagNum(state, `spoils_${res}`) + Number(amt);
    } else {
      state.resources[res] = toDecimalString(D(state.resources[res] ?? "0").add(D(amt)));
    }
  }
  return true;
}

export function tryRenameGuild(state: GameState, name: string): boolean {
  const n = name.trim().slice(0, 32);
  if (!n) return false;
  const f = state.factions?.find((x) => x.leaderRealmId === "player");
  if (!f) return false;
  f.name = n;
  return true;
}

export function trySetGuildCrest(state: GameState, crest: string): boolean {
  if (!GUILD_CRESTS.includes(crest)) return false;
  const f = state.factions?.find((x) => x.leaderRealmId === "player");
  if (!f) return false;
  state.flags.guild_crest = crest;
  return true;
}

export function playerGuild(state: GameState) {
  return state.factions?.find((x) => x.leaderRealmId === "player") ?? null;
}

export function listAchievements(state: GameState): { def: Achievement; done: boolean }[] {
  return ACHIEVEMENTS.map((def) => ({ def, done: Boolean(state.flags[def.id]) }));
}

export function unlock(state: GameState, id: string): void {
  if (state.flags[id]) return;
  state.flags[id] = 1;
  state.flags.last_event = ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;
  state.flags.last_event_tick = state.meta.tick;
}

export function noteGift(state: GameState): void {
  state.flags.gifts_sent = flagNum(state, "gifts_sent") + 1;
  if (flagNum(state, "gifts_sent") >= 3) unlock(state, "ach_gift");
}

export function noteWar(state: GameState): void {
  unlock(state, "ach_war");
}

export function giftOpinionBonus(state: GameState): number {
  return flagNum(state, "craft_opinion") ? 4 : 0;
}
