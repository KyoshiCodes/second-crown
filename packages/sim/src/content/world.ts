import type { Character, Faction, GameState, Realm } from "@second-crown/shared";
import { D, toDecimalString } from "../core/decimal.js";
import { pushWorldLog } from "../systems/events.js";

export interface KingdomArchetype {
  key: string;
  realmName: string;
  rulerName: string;
  era: string;
  lifestyle: string;
  traits: string[];
  ambition: string;
  startMilitia: number;
  growth: number;
  declareEdge: number;
  fickle: number;
}

export const ARCHETYPES: KingdomArchetype[] = [
  {
    key: "iron",
    realmName: "Iron March",
    rulerName: "Lord Varric",
    era: "high medieval",
    lifestyle: "warhost",
    traits: ["ruthless"],
    ambition: "conquer",
    startMilitia: 12,
    growth: 1,
    declareEdge: 5,
    fickle: 1,
  },
  {
    key: "silk",
    realmName: "Silk Coast",
    rulerName: "Sera Valin",
    era: "merchant republic",
    lifestyle: "trade",
    traits: ["greedy", "clever"],
    ambition: "wealth",
    startMilitia: 6,
    growth: 1,
    declareEdge: 12,
    fickle: 3,
  },
  {
    key: "ash",
    realmName: "Ash Nomads",
    rulerName: "Khal Duran",
    era: "steppe",
    lifestyle: "raider",
    traits: ["restless"],
    ambition: "raid",
    startMilitia: 10,
    growth: 2,
    declareEdge: 0,
    fickle: 4,
  },
  {
    key: "veil",
    realmName: "Veil Theocracy",
    rulerName: "Hierophant Ime",
    era: "temple age",
    lifestyle: "faith",
    traits: ["zealous"],
    ambition: "convert",
    startMilitia: 8,
    growth: 1,
    declareEdge: 8,
    fickle: 2,
  },
  {
    key: "glass",
    realmName: "Glass Cities",
    rulerName: "Archon Nima",
    era: "late antique",
    lifestyle: "scholar",
    traits: ["cautious"],
    ambition: "survive",
    startMilitia: 5,
    growth: 1,
    declareEdge: 18,
    fickle: 2,
  },
  {
    key: "frost",
    realmName: "Frost Holds",
    rulerName: "Jarl Signe",
    era: "north age",
    lifestyle: "clan",
    traits: ["proud", "harsh"],
    ambition: "glory",
    startMilitia: 9,
    growth: 1,
    declareEdge: 6,
    fickle: 2,
  },
  {
    key: "tide",
    realmName: "Tide Princes",
    rulerName: "Admiral Kesh",
    era: "age of sail",
    lifestyle: "corsair",
    traits: ["greedy", "restless"],
    ambition: "plunder",
    startMilitia: 7,
    growth: 2,
    declareEdge: 4,
    fickle: 3,
  },
  {
    key: "ember",
    realmName: "Ember Concord",
    rulerName: "Magister Rho",
    era: "arcane renaissance",
    lifestyle: "mage-court",
    traits: ["clever", "aloof"],
    ambition: "knowledge",
    startMilitia: 4,
    growth: 1,
    declareEdge: 14,
    fickle: 5,
  },
  {
    key: "bronze",
    realmName: "Bronze League",
    rulerName: "Strategos Helia",
    era: "city-state",
    lifestyle: "phalanx",
    traits: ["disciplined"],
    ambition: "order",
    startMilitia: 11,
    growth: 1,
    declareEdge: 7,
    fickle: 1,
  },
];

function pick(seed: number, salt: number, mod: number): number {
  let x = (seed ^ Math.imul(salt, 1597334677)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 2246822507) >>> 0;
  return (x >>> 0) % mod;
}

export function extraArchetypes(seed: number): KingdomArchetype[] {
  const pool = ARCHETYPES.filter((a) => a.key !== "iron");
  const n = 3 + pick(seed, 11, 3);
  const out: KingdomArchetype[] = [];
  const used = new Set<string>();
  let salt = 3;
  while (out.length < n && used.size < pool.length) {
    const a = pool[pick(seed, salt, pool.length)];
    salt += 17;
    if (used.has(a.key)) continue;
    used.add(a.key);
    out.push(a);
  }
  return out;
}

export function seedWorldActors(state: GameState): void {
  const extras = extraArchetypes(state.meta.seed);
  for (const a of extras) {
    const realmId = `k_${a.key}`;
    const charId = `char_${a.key}`;
    if (!state.realms.some((r) => r.id === realmId)) {
      state.realms.push({
        id: realmId,
        name: a.realmName,
        rulerId: charId,
        era: a.era,
        lifestyle: a.lifestyle,
        aiProfile: a.key,
      } satisfies Realm);
    }
    if (!state.characters.some((c) => c.id === charId)) {
      state.characters.push({
        id: charId,
        name: a.rulerName,
        role: "ruler",
        realmId,
        traits: [...a.traits],
        ambition: a.ambition,
      } satisfies Character);
    }
    if (!state.opinions.some((o) => o.from === charId && o.to === "char_player")) {
      const v = pick(state.meta.seed, a.key.length * 13, 61) - 30;
      state.opinions.push({ from: charId, to: "char_player", value: v, expiresTick: null });
      state.opinions.push({ from: "char_player", to: charId, value: Math.floor(v / 2), expiresTick: null });
    }
    if (!state.units.some((u) => u.realmId === realmId)) {
      state.units.push({
        id: `u_${realmId}_0`,
        typeId: "militia",
        realmId,
        count: toDecimalString(a.startMilitia),
        armyId: null,
      });
    }
  }

  if (!Array.isArray(state.factions)) state.factions = [];
  if (!state.factions.some((f) => f.id === "order_amber")) {
    const fac: Faction = {
      id: "order_amber",
      name: "Amber Compact",
      kind: "order",
      leaderRealmId: null,
      memberRealmIds: extras.slice(0, 1).map((a) => `k_${a.key}`),
      stance: pick(state.meta.seed, 99, 40) - 10,
    };
    state.factions.push(fac);
  }
  if (!state.factions.some((f) => f.id === "order_salt")) {
    state.factions.push({
      id: "order_salt",
      name: "Salt Road Pact",
      kind: "order",
      leaderRealmId: extras[1] ? `k_${extras[1].key}` : null,
      memberRealmIds: extras.slice(1, 3).map((a) => `k_${a.key}`),
      stance: pick(state.meta.seed, 77, 30) - 5,
    });
  }
}

export function playerTitle(state: GameState): string {
  const prestige = Number(state.flags["prestige_level"] ?? 0);
  const wins = state.wars.filter(
    (w) =>
      (w.attackerRealmId === "player" && w.status === "attacker_won") ||
      (w.defenderRealmId === "player" && w.status === "defender_won")
  ).length;
  if (prestige >= 3 || wins >= 8) return "High Sovereign";
  if (prestige >= 1 || wins >= 4) return "Crown-Claimant";
  if (wins >= 1) return "War-Duke";
  return "Petty Lord";
}

export function archetypeForRealm(realmId: string): KingdomArchetype | undefined {
  if (realmId === "rival") return ARCHETYPES.find((a) => a.key === "iron");
  const key = realmId.replace(/^k_/, "");
  return ARCHETYPES.find((a) => a.key === key);
}

export function driftOpinions(state: GameState): void {
  for (const o of state.opinions) {
    if (o.from === "char_player") continue;
    const realm = state.characters.find((c) => c.id === o.from)?.realmId;
    const arch = realm ? archetypeForRealm(realm) : undefined;
    const fickle = arch?.fickle ?? 1;
    const nudge = ((state.meta.tick + o.value * 7) % 7) - 3;
    if (Math.abs(nudge) >= 2) {
      o.value = Math.max(-100, Math.min(100, o.value + Math.sign(nudge) * fickle));
    }
  }
  for (const f of state.factions ?? []) {
    if (!f.memberRealmIds.includes("player")) continue;
    if (state.meta.tick % 300 !== 0) continue;
    const before = f.stance;
    f.stance = Math.max(-100, Math.min(100, f.stance - 2));
    if (before >= 0 && f.stance < 0) {
      pushWorldLog(state, "faction_sour", `${f.name} grows tired of your banner.`);
    }
    if (before >= -10 && f.stance < -10) {
      pushWorldLog(state, "faction_cold", `${f.name} will not take new oaths from you.`);
    }
  }
}

export function growRealm(state: GameState, realmId: string): void {
  const arch = archetypeForRealm(realmId);
  const amount = arch?.growth ?? 1;
  const existing = state.units.find(
    (u) => u.realmId === realmId && u.typeId === "militia" && u.armyId === null
  );
  if (existing) {
    existing.count = toDecimalString(D(existing.count).add(amount));
  } else {
    state.units.push({
      id: `u_${realmId}_${state.meta.tick}`,
      typeId: "militia",
      realmId,
      count: toDecimalString(amount),
      armyId: null,
    });
  }
}
