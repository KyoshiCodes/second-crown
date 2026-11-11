import { describe, it, expect } from "vitest";
import { createGameState } from "../state/createGameState.js";
import {
  tryGiftGold,
  rivalOpinionOfPlayer,
  playerOpinionOfRival,
  opinionOfPlayerFromRealm,
  giftOffer,
  giftOpinionGain,
  GIFT_GOLD_COST,
  GIFT_BASE_OPINION,
} from "./diplomacy.js";

describe("diplomacy", () => {
  it("gift spends gold and raises rival opinion", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "40";
    const before = rivalOpinionOfPlayer(state);
    expect(tryGiftGold(state)).toBe(true);
    expect(rivalOpinionOfPlayer(state)).toBe(before + 12);
    expect(state.resources.gold).toBe("25");
  });

  it("rejects gift without gold", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "0";
    expect(tryGiftGold(state)).toBe(false);
  });

  it("offer reads cost, gain and standing without changing state", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "40";
    const snap = JSON.stringify(state);
    const offer = giftOffer(state);
    expect(offer).toMatchObject({ realmId: "rival", cost: GIFT_GOLD_COST, gain: GIFT_BASE_OPINION, short: 0, ok: true, block: null });
    expect(offer.opinion).toBe(rivalOpinionOfPlayer(state));
    expect(JSON.stringify(state)).toBe(snap);
  });

  it("offer reports the gold still missing", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "9";
    expect(giftOffer(state)).toMatchObject({ ok: false, block: "no_gold", short: 6 });
  });

  it("offer and gift agree on the gain with Court doctrine and Silk Seal", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "40";
    state.flags.doctrine = "court";
    state.flags.craft_opinion = 1;
    expect(giftOpinionGain(state)).toBe(GIFT_BASE_OPINION + 9);
    const before = rivalOpinionOfPlayer(state);
    const mineBefore = playerOpinionOfRival(state);
    const { gain } = giftOffer(state);
    expect(tryGiftGold(state)).toBe(true);
    expect(rivalOpinionOfPlayer(state)).toBe(Math.min(100, before + gain));
    expect(playerOpinionOfRival(state)).toBe(Math.min(100, mineBefore + 15));
  });

  it("refuses a gift at full standing and keeps the gold", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "40";
    const edge = state.opinions.find((o) => o.from === "char_rival" && o.to === "char_player");
    if (edge) edge.value = 100;
    else state.opinions.push({ from: "char_rival", to: "char_player", value: 100, expiresTick: null });
    expect(giftOffer(state)).toMatchObject({ ok: false, block: "at_cap" });
    expect(tryGiftGold(state)).toBe(false);
    expect(state.resources.gold).toBe("40");
  });

  it("gifts any other crown and logs the input", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "40";
    const other = state.realms.find((r) => r.id !== "player" && r.id !== "rival");
    if (!other) return;
    const before = opinionOfPlayerFromRealm(state, other.id);
    const logged = state.inputLog.length;
    expect(tryGiftGold(state, GIFT_GOLD_COST, other.id)).toBe(true);
    expect(opinionOfPlayerFromRealm(state, other.id)).toBe(Math.min(100, before + GIFT_BASE_OPINION));
    expect(state.inputLog[logged]).toMatchObject({ type: "gift", payload: { amount: GIFT_GOLD_COST, to: other.id } });
  });

  it("offer for an unknown realm is blocked", () => {
    const state = createGameState({ seed: 1 });
    state.resources.gold = "40";
    expect(giftOffer(state, "nowhere")).toMatchObject({ ok: false, block: "no_ruler" });
    expect(tryGiftGold(state, GIFT_GOLD_COST, "nowhere")).toBe(false);
  });
});
