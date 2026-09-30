import React from "react";
import {
  canAffordTrain,
  canSally,
  garrisonPower,
  gateOnRim,
  getProvince,
  healTicksLeft,
  housingCap,
  incomingOnHome,
  incomingOnPlayerFlags,
  infirmaryBeds,
  lastBattleStory,
  listGarrisons,
  listGathers,
  listHealing,
  listLedger,
  listMarches,
  listScarred,
  opinionOfPlayerFromRealm,
  peaceTicksRemaining,
  population,
  realmPower,
  tryDeclareWar,
  tryGiftGold,
  tryRecallGarrison,
  tryRecallGather,
  tryRecallMarch,
  tryRepair,
  tryResolveWar,
  trySally,
  tryTrain,
  tryTreatWounded,
  tryWhitePeace,
  wallHp,
  warSummary,
  watchtowerWarning,
  woundedCount,
  type GameState,
} from "@second-crown/sim";
import { RealmCard, realmStance } from "./hud/RealmCard";
import { BattleVisual, type BattleSnap } from "./BattleVisual";
import { WarLivingStrip } from "./WarLivingStrip";
import { MarshalCard } from "./MarshalCard";
import { ForceCard } from "./hud/ForceCard";
import { captainName } from "./hud/captainName";
import { BattleCard } from "./hud/BattleCard";
import type { ActFn } from "./game/useGameEngine";
import { getGiftThanks, getWarTaunt } from "./content/flavor";
import { sfx } from "./sfx";

export function WarRoom(props: {
  state: GameState | undefined;
  act: ActFn;
  rivalOp: number;
  playerOp: number;
  battleSnap: BattleSnap | null;
  setBattleSnap: (snap: BattleSnap | null) => void;
}) {
  const { state, act, rivalOp, playerOp, battleSnap, setBattleSnap } = props;
  const activeWar = state?.wars.find((w) => w.status === "active");
  const otherRealms = (state?.realms ?? []).filter((r) => r.id !== "player");
  const mine = state ? realmPower(state, "player") : 0;
  const canLevy = state ? canAffordTrain(state, "militia", 5) : false;
  const summary = state ? warSummary(state) : null;
  const activeDecrees = summary?.decrees.filter((d) => d.ticksLeft > 0) ?? [];
  const incoming = state ? incomingOnHome(state) : [];
  const incomingFlags = state ? incomingOnPlayerFlags(state) : [];
  const hostileColumns = [...incoming, ...incomingFlags];
  const sallyTargetId = incoming[0]?.id;
  const seen = state ? watchtowerWarning(state) : undefined;
  const scarred = state ? listScarred(state) : [];
  const hp = state ? wallHp(state) : 0;
  const gateUp = state ? gateOnRim(state) : false;
  const wounded = state ? woundedCount(state) : 0;
  const beds = state ? infirmaryBeds(state) : 0;
  const healing = state ? listHealing(state).length : 0;
  const healLeft = state ? healTicksLeft(state) : 0;
  const pop = state ? population(state) : 0;
  const cap = state ? housingCap(state) : 0;
  const tick = state?.meta.tick ?? 0;
  const sallyReady = state ? canSally(state) : false;
  const columns = state ? listMarches(state).filter((m) => m.realmId === "player") : [];
  const scouts = columns.filter((m) => m.purpose === "scout");
  const firstColumnId = columns[0]?.id;
  const gathers = state ? listGathers(state).filter((g) => g.realmId === "player") : [];
  const posts = state ? listGarrisons(state) : [];
  const nameOf = (id: string) => state?.realms.find((r) => r.id === id)?.name ?? id;
  const etaOf = (arrivesTick: number) => Math.max(0, Math.ceil((arrivesTick - tick) / 10));
  const provinceLabel = (id: string) => {
    const p = state ? getProvince(state, id) : undefined;
    return p ? `${p.x},${p.y}` : id;
  };
  const lastField = state
    ? listLedger(state).find((e) => /march|battle|camp|siege|hold|garrison|flag|storm|sally/i.test(`${e.kind} ${e.text}`))
    : undefined;
  const story = state ? lastBattleStory(state) : null;

  const card = { margin: "10px 0", fontSize: 13 } as const;
  const h = { display: "block", marginBottom: 6 } as const;
  const resolveWar = () => act((st, eng) => {
    const war = st.wars.find((w) => w.status === "active");
    const atk = war ? realmPower(st, war.attackerRealmId) : 0;
    const def = war ? realmPower(st, war.defenderRealmId) : 0;
    const r = tryResolveWar(st, eng.rng);
    if (r.ok && r.result && war) {
      setBattleSnap({
        attackerId: war.attackerRealmId,
        defenderId: war.defenderRealmId,
        winnerId: r.result.winnerId,
        attackerPower: r.result.attackerPower ?? atk,
        defenderPower: r.result.defenderPower ?? def,
        phases: r.result.phases,
      });
      if (r.result.winnerId === "player") sfx.win();
      else sfx.lose();
      return r.result.winnerId === "player" ? "Victory." : "Defeat.";
    }
    return "No active war.";
  });

  return (
    <div className="sc-tab-war">
      <WarLivingStrip state={state} />
      <MarshalCard state={state} act={act} />

      <section className="sc-realm-card" style={card}>
        <strong style={h}>Diplomacy</strong>
        <p style={{ margin: "0 0 6px", fontSize: 12, opacity: 0.75 }}>
          Your power {mine}. Green favors you, red favors them. Combat still rolls.
        </p>
        <div className="sc-realm-dip-grid">
          {otherRealms.map((r) => {
            const left = state ? peaceTicksRemaining(state, "player", r.id) : 0;
            const theirs = state ? realmPower(state, r.id) : 0;
            const isRival = r.id === "rival";
            const opinion = isRival ? rivalOp : state ? opinionOfPlayerFromRealm(state, r.id) : 0;
            const atWar = !!activeWar && [activeWar.attackerRealmId, activeWar.defenderRealmId].includes(r.id);
            return (
              <RealmCard
                key={r.id}
                realm={r}
                stance={realmStance(atWar, left, opinion)}
                peaceLeft={left}
                opinion={opinion}
                myOpinion={isRival ? playerOp : undefined}
                mine={mine}
                theirs={theirs}
                declareLocked={!!activeWar || left > 0}
                onDeclare={() => act((st) => {
                  const ok = tryDeclareWar(st, { attackerRealmId: "player", defenderRealmId: r.id });
                  if (!ok) return "Cannot declare war.";
                  return `${r.name}: "${getWarTaunt(r.id)}"`;
                })}
                onGift={isRival
                  ? () => act((st) => (tryGiftGold(st) ? `Lord Varric: "${getGiftThanks("rival")}"` : "Need 15 gold."))
                  : undefined}
              />
            );
          })}
        </div>
      </section>

      <section className="sc-realm-card" style={card}>
        <strong style={h}>Levy and fight</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button
            type="button"
            disabled={!canLevy}
            onClick={() => act((st) => {
              const ok = tryTrain(st, { typeId: "militia", count: 5 });
              if (ok) sfx.train();
              return ok ? "Raised 5 militia." : "Cannot afford 5 militia.";
            })}
          >
            Raise 5 militia
          </button>
          <button type="button" disabled={!activeWar} onClick={resolveWar}>
            Fight
          </button>
          <button type="button" disabled={!activeWar} onClick={() => act((st) => (tryWhitePeace(st) ? "White peace signed." : "No war."))}>
            White Peace
          </button>
        </div>
        {!activeWar ? <p style={{ margin: "6px 0 0", fontSize: 12, opacity: 0.7 }}>No war declared. Fight opens once one is.</p> : null}
        <BattleVisual snap={battleSnap} active={!!activeWar} />
      </section>

      <section className="sc-realm-card" style={card}>
        <strong style={h}>Last battle</strong>
        <BattleCard story={story} report={lastField?.text} nameOf={nameOf} />
      </section>

      <section className="sc-realm-card" style={card}>
        <strong style={h}>Columns</strong>
        {columns.length === 0 ? (
          <p style={{ margin: "0 0 6px", opacity: 0.7 }}>No column on the road. March from the map.</p>
        ) : (
          <ul style={{ margin: "0 0 6px", paddingLeft: 18 }}>
            {columns.map((m) => (
              <li key={m.id}>
                {m.purpose ?? m.kind} → {m.toId} · {m.levy} · ETA {etaOf(m.arrivesTick)}s
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          disabled={columns.length === 0}
          onClick={() => act((st) => (tryRecallMarch(st) ? "Column recalled." : "Too late to recall."))}
        >
          Recall column
        </button>
        <div style={{ marginTop: 8 }}>
          <div style={{ opacity: 0.85, marginBottom: 2 }}>Scouts</div>
          {scouts.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.7 }}>No scout on the road.</p>
          ) : (
            <div className="sc-force-grid">
              {scouts.map((m) => (
                <ForceCard
                  key={m.id}
                  tone="scout"
                  captain={captainName(m.id)}
                  name="Scout"
                  dest={provinceLabel(m.toId)}
                  seconds={etaOf(m.arrivesTick)}
                  action={{
                    label: "Recall",
                    disabled: !(m.id === firstColumnId && tick < m.arrivesTick),
                    onClick: () => act((st) => (tryRecallMarch(st) ? "Scout recalled." : "Too late to recall.")),
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ opacity: 0.85, marginBottom: 2 }}>Gathers</div>
          {gathers.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.7 }}>No gather party out.</p>
          ) : (
            <div className="sc-force-grid">
              {gathers.map((g) => {
                const numLoad = parseFloat(String(g.load ?? 0));
                const isLoaded = !isNaN(numLoad) ? numLoad > 0 : Boolean(g.load && g.load !== "0");
                const isEmptyReturn = g.phase === "returning" && !isLoaded;
                return (
                  <ForceCard
                    key={g.id}
                    tone="gather"
                    captain={captainName(g.id)}
                    name={`Gather ${g.node}`}
                    dest={provinceLabel(g.toId)}
                    seconds={etaOf(g.arrivesTick)}
                    detail={g.phase !== "outbound" ? `${g.phase} · load ${g.load}` : g.phase}
                    loaded={isLoaded}
                    empty={isEmptyReturn}
                    action={{
                      label: "Recall",
                      disabled: g.phase === "returning",
                      onClick: () => act((st) => (tryRecallGather(st, g.id) ? "Gather party recalled." : "Already returning.")),
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ opacity: 0.85, marginBottom: 2 }}>Garrisons</div>
          {posts.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.7 }}>No garrison posted on a flag.</p>
          ) : (
            <div className="sc-force-grid">
              {posts.map((g) => (
                <ForceCard
                  key={g.provinceId}
                  tone="garrison"
                  name={`Garrison · power ${state ? garrisonPower(state, g.provinceId) : 0}`}
                  dest={provinceLabel(g.provinceId)}
                  detail={Object.entries(g.force).map(([k, n]) => `${n} ${k}`).join(", ")}
                  action={{
                    label: "Recall",
                    onClick: () =>
                      act((st) => (tryRecallGarrison(st, g.provinceId) ? "Garrison recalled." : "Cannot recall garrison.")),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="sc-realm-card" style={card}>
        <strong style={h}>Home front</strong>
        <div style={{ opacity: 0.85, marginBottom: 2 }}>Incoming</div>
        {hostileColumns.length > 0 ? (
          <div className="sc-force-grid">
            {hostileColumns.map((m) => (
              <ForceCard
                key={m.id}
                tone="hostile"
                captain={captainName(m.id)}
                name={seen ? nameOf(m.realmId) : "Unknown host"}
                dest={provinceLabel(m.toId)}
                seconds={etaOf(m.arrivesTick)}
                detail={`from ${provinceLabel(m.fromId)}`}
                action={
                  sallyReady && m.id === sallyTargetId
                    ? {
                        label: "Sally (5 militia)",
                        onClick: () =>
                          act((st) => {
                            if (!trySally(st)) return "Need 5 militia and a column on the road.";
                            return "Sally at the gate.";
                          }),
                      }
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <p style={{ margin: "4px 0", opacity: 0.7 }}>No column on your gates or flags.</p>
        )}
        <p style={{ margin: "4px 0" }}>
          Wall HP {hp}. Gate {gateUp ? "up" : "down"}. Siege hits walls first, then the yard, then the keep.
        </p>
        <p style={{ margin: "4px 0" }}>
          Wounded {wounded} / {beds} beds{healing > 0 ? ` · treating ${healing} (${Math.ceil(healLeft / 10)}s)` : ""}.{" "}
          <button
            type="button"
            disabled={wounded <= 0}
            onClick={() => act((st) => (tryTreatWounded(st) ? "Sent 1 wounded to the ward." : "Need 4 food."))}
          >
            Treat (4 food, 5s)
          </button>
        </p>
        <p style={{ margin: "4px 0" }}>
          People {pop} / {cap} housing.
        </p>
        {scarred.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => act((st) => (tryRepair(st, b.id) ? `Repaired ${b.typeId}.` : "Need 8 stone."))}
          >
            Repair {b.typeId} (8 stone)
          </button>
        ))}
      </section>

      <section className="sc-realm-card" style={{ ...card, fontSize: 12 }}>
        <strong style={h}>Decrees</strong>
        <p style={{ margin: "4px 0" }}>
          {summary && summary.fortifyTicksLeft > 0
            ? `Walls stand (${Math.ceil(summary.fortifyTicksLeft / 10)}s left).`
            : "No fortification raised. Swear one on the Crown tab."}
        </p>
        <p style={{ margin: "4px 0" }}>
          {activeDecrees.length > 0
            ? `Active: ${activeDecrees.map((d) => `${d.name} (${Math.ceil(d.ticksLeft / 10)}s)`).join(", ")}.`
            : "No decree running. Swear one on the Crown tab."}
        </p>
      </section>
    </div>
  );
}
