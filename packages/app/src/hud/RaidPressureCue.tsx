import React from "react";
import {
  breachRun,
  homeRaidGap,
  homeRaidPerType,
  incomingOnHome,
  isShielded,
  raidStage,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import { formatHorizon } from "../horizon/horizon";
import "./raid-payoff-accents.css";

const HOME_RAID_FIRST_TICK = 3000;

export type RaidPressureTone = "calm" | "elevated" | "recovering";

export interface RaidPressureSummary {
  tone: RaidPressureTone;
  tag: string;
  text: string;
  stageId: string;
  breachCount: number;
}

/**
 * Pure read-only summary of existing sim raid-pressure and breach-respite state.
 * Never invents timers or rules; reads `raidStage`, `breachRun`, `homeRaidGap`, and `homeRaidPerType`.
 */
export function summarizeRaidPressure(state: GameState | undefined): RaidPressureSummary {
  if (!state) return { tone: "calm", tag: "", text: "", stageId: "unwalled", breachCount: 0 };
  const stage = raidStage(state);
  const run = breachRun(state);
  const gap = homeRaidGap(state);
  const cap = homeRaidPerType(state);
  const inbound = incomingOnHome(state).length;
  const shielded = isShielded(state);

  if (run > 0) {
    const respiteSec = Math.max(0, (gap - stage.gap) / TICKS_PER_SECOND);
    return {
      tone: "recovering",
      tag: "Recovery",
      text: `Recovery room · +${formatHorizon(respiteSec)} respite · next raid up to ${cap}/type`,
      stageId: stage.id,
      breachCount: run,
    };
  }

  if (shielded) {
    return { tone: "calm", tag: "", text: "", stageId: stage.id, breachCount: 0 };
  }

  if (inbound > 0) {
    return {
      tone: "elevated",
      tag: "Pressure",
      text: `Raid inbound · ${stage.label} (up to ${cap}/type)`,
      stageId: stage.id,
      breachCount: 0,
    };
  }

  const last = state.flags.home_raid_last;
  const due = state.meta.tick >= HOME_RAID_FIRST_TICK && (typeof last !== "number" || state.meta.tick - last >= gap);
  if (due) {
    const hint = stage.id === "unwalled" ? "No walls yet — walls raise defense" : `${stage.label} · up to ${cap}/type`;
    return {
      tone: "elevated",
      tag: "Pressure",
      text: `Raid window open · ${hint}`,
      stageId: stage.id,
      breachCount: 0,
    };
  }

  return { tone: "calm", tag: "", text: "", stageId: stage.id, breachCount: 0 };
}

/** Calm status strip mounted in War Room Home front when raid pressure is due/inbound or breach recovery is active. */
export function RaidPressureCue(props: { state: GameState | undefined }) {
  const p = summarizeRaidPressure(props.state);
  if (p.tone === "calm") return null;
  return (
    <div
      className={`sc-raid-pressure-cue is-${p.tone}`}
      data-raid-pressure-cue={p.tone}
      data-raid-stage={p.stageId}
      role="status"
    >
      <span className="sc-raid-pressure-pip" aria-hidden="true" />
      <span className="sc-raid-pressure-tag">{p.tag}</span>
      <span className="sc-raid-pressure-text">{p.text}</span>
    </div>
  );
}
