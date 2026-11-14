import React from "react";
import {
  RESEARCH,
  countBuilding,
  getBuildingType,
  keepLevel,
  researchDone,
  researchDuration,
  researchKeepMin,
  researchKeepReady,
  researchPrereqReady,
  researchRequires,
  researchTicksLeft,
  researchTier,
  tryCancelResearch,
  tryStartResearch,
  type GameState,
} from "@second-crown/sim";
import { TICKS_PER_SECOND } from "@second-crown/shared";
import type { ActFn } from "./game/useGameEngine";
import { InhabitedOverlay } from "./hud/InhabitedOverlay";
import { ScrollPip } from "./hud/ScrollPip";
import { studyLedgerRows, studyStatus } from "./hud/StudyLedger";
import { StudyLivingRows } from "./hud/StudyLivingRows";
import {
  AcademyLecternLivingGlyph,
  StudyLivingGlyph,
  StudyLivingUnderlay,
} from "./hud/AcademyLivingGlyph";
import { ResearchInkPip } from "./hud/ResearchInkPip";
import { ResearchCostRow, studyCostParts } from "./ResearchCost";
import {
  StudyLeadsLine,
  StudyNeedsRow,
  TierMeter,
  studyLeadsTo,
  studyNeeds,
  studyProgressText,
} from "./ResearchAdvanced";
import { ResearchTreeMap } from "./ResearchTreeMap";
import "./hud/button-pips.css";
import "./hud/research-ink-pip.css";
import "./research-tree.css";

function needList(def: { needs?: string; needsAny?: readonly string[] }): string[] {
  if (def.needsAny && def.needsAny.length) return [...def.needsAny];
  if (def.needs) return [def.needs];
  return [];
}

function Row(props: {
  state: GameState;
  act: ActFn;
  id: keyof typeof RESEARCH;
  academyFast: boolean;
  /** Name of another study already on the lectern (display only). */
  busyWith?: string;
}) {
  const { state, act, id, academyFast, busyWith } = props;
  const def = RESEARCH[id];
  const done = researchDone(state, id);
  const left = researchTicksLeft(state, id);
  const buildings = needList(def);
  const hasHall = buildings.some((b) => countBuilding(state, b) > 0);
  const keepOk = researchKeepReady(state, id);
  const keepNeed = researchKeepMin(id);
  const prereqId = researchRequires(id);
  const prereq = prereqId ? RESEARCH[prereqId].name : undefined;
  const prereqOk = researchPrereqReady(state, id);
  const label = def.name;
  const effect = "effect" in def ? String(def.effect) : "";
  const cost = Object.entries(def.cost).map(([k, v]) => `${v} ${k}`).join(", ");
  const ticksTotal = Number(state.flags[`research_${id}_total`] ?? 0);
  const duration = researchDuration(state, id);
  const effectiveTotal = ticksTotal > 0 ? ticksTotal : duration;
  const progress = done ? 1 : left > 0 ? Math.min(1, Math.max(0, 1 - left / effectiveTotal)) : 0;
  const seconds = Math.round(duration / TICKS_PER_SECOND);
  const status = studyStatus({ done, ticksLeft: left, hallOk: hasHall, keepOk, prereqOk });
  const hallName = (b: string) => getBuildingType(b)?.name ?? b;
  const builtHall = buildings.find((b) => countBuilding(state, b) > 0);
  // The checklist is shown while the study can still be started; it replaces the
  // "needs ..." words under the name so each gate is stated once.
  const needs =
    status === "open" || status === "locked"
      ? studyNeeds({
          prereq,
          prereqOk,
          halls: buildings.map(hallName),
          hallBuilt: builtHall ? hallName(builtHall) : undefined,
          keepNeed,
          keepNow: keepLevel(state),
        })
      : [];
  const progressText = studyProgressText({
    status,
    ticksLeft: left,
    ticksTotal: effectiveTotal,
    ticksBase: def.ticks,
    ticksPerSecond: TICKS_PER_SECOND,
  });
  const leads = studyLeadsTo(id).map((next) => ({ name: RESEARCH[next].name, known: researchDone(state, next) }));
  const rows = studyLedgerRows({
    name: label,
    status,
    ticksLeft: left,
    ticksTotal,
    seconds,
    effect,
    halls: buildings,
    keepNeed,
    hallOk: hasHall,
    keepOk,
    prereq,
    prereqOk,
  }).map((r) => {
    if (r.kind === "progress" && progressText) {
      r = { ...r, value: progressText.value, sub: progressText.sub };
    }
    if (r.kind === "name") {
      return {
        ...r,
        sub: needs.length > 0 ? undefined : r.sub,
        lead:
          status === "known" ? (
            <ScrollPip size={16} status="claimed" />
          ) : status === "studying" ? (
            <ScrollPip size={16} status="ready" />
          ) : (
            <ScrollPip size={16} status="open" />
          ),
      };
    }
    if (r.kind === "progress" && status === "studying") {
      return {
        ...r,
        slot: (
          <button
            type="button"
            onClick={() =>
              act((s) => (tryCancelResearch(s, id) ? `Called off ${label.toLowerCase()}.` : "Nothing to cancel."))
            }
          >
            Cancel
          </button>
        ),
      };
    }
    return r;
  });
  const glyphState = status === "known" ? "completed" : status === "open" ? "available" : status;
  return (
    <div
      className={`sc-study-living-card is-${status} is-${glyphState} sc-research-living-card${prereq ? " sc-research-tree-card" : ""}`}
      data-study={id}
      data-tier={researchTier(id)}
      data-study-state={glyphState}
      data-progress={Math.round(progress * 100)}
      title={effect}
    >
      {prereq ? (
        <p className={`sc-research-tree-link${prereqOk ? " is-met" : ""}`} data-builds-on={prereqId ?? undefined}>
          <span className="sc-research-tree-link-mark" aria-hidden="true" />
          Builds on <strong>{prereq}</strong>
          {prereqOk ? " · known" : " · study it first"}
        </p>
      ) : null}
      <StudyLivingUnderlay topicId={id} status={status} academyFast={academyFast} progress={progress} />
      <span className="sc-study-ink-badge" aria-hidden="true">
        <ResearchInkPip
          progress={progress}
          status={status}
          topicId={id}
          size={18}
          showDrops={status === "studying"}
        />
      </span>
      <StudyLivingRows topicId={id} status={status} rows={rows} />
      <StudyLivingGlyph topicId={id} status={status} academyFast={academyFast} progress={progress} />
      <StudyNeedsRow needs={needs} />
      <ResearchCostRow status={status} parts={studyCostParts(def.cost, state.resources)} busyWith={busyWith} />
      {done || left > 0 ? null : (
        <button
          type="button"
          disabled={!hasHall || !keepOk || !prereqOk}
          title={effect}
          onClick={() =>
            act((s) =>
              tryStartResearch(s, id)
                ? `Scribes begin ${label.toLowerCase()}.`
                : `Need ${prereq ? `${prereq} known, ` : ""}${buildings.join(" or ")}${keepNeed ? `, Keep ${keepNeed}` : ""}, ${cost}, and a free study slot.`
            )
          }
          className="sc-btn-with-pip sc-study-btn"
        >
          <ScrollPip size={16} status="open" />
          <span>Study {label.toLowerCase()} ({seconds}s)</span>
        </button>
      )}
      <StudyLeadsLine leads={leads} />
    </div>
  );
}

export function ResearchBar(props: { state: GameState | undefined; act: ActFn }) {
  const { state, act } = props;
  if (!state) return null;
  const ids = Object.keys(RESEARCH) as (keyof typeof RESEARCH)[];
  const open = ids.find((id) => researchTicksLeft(state, id) > 0);
  const known = ids.filter((id) => researchDone(state, id)).map((id) => RESEARCH[id].name);
  const academy = countBuilding(state, "academy");
  return (
    <div
      className="sc-realm-card sc-research-lectern"
      style={{ fontSize: 13, margin: "6px 0 10px", position: "relative", overflow: "hidden" }}
    >
      <InhabitedOverlay motesCount={18} candleAnchor="top-right" />
      <p style={{ margin: "0 0 8px", opacity: 0.85, position: "relative", zIndex: 1 }}>
        Lectern {open ? `· studying ${RESEARCH[open].name} (${Math.ceil(researchTicksLeft(state, open) / 10)}s)` : "· idle (one study at a time)"}.
        {known.length > 0 ? ` Known: ${known.join(", ")}.` : " Nothing known yet."}
        {academy < 1
          ? " Raise an Academy on Kingdom — it counts as a hall for every study (farm/camp still work for early ones)."
          : ` Academy x${academy} covers every lectern hall.`}
      </p>
      <AcademyLecternLivingGlyph
        activeName={open ? RESEARCH[open].name : undefined}
        knownCount={known.length}
        totalCount={ids.length}
        academyCount={academy}
      />
      <ResearchTreeMap state={state} />
      {([1, 2] as const).map((tier) => {
        const tierIds = ids.filter((id) => researchTier(id) === tier);
        if (tierIds.length === 0) return null;
        const tierKnown = tierIds.filter((id) => researchDone(state, id)).length;
        return (
          <section key={tier} className={`sc-research-tree-tier is-tier-${tier}`} data-research-tier={tier}>
            <h4 className="sc-research-tree-heading">
              <span className="sc-research-tree-numeral" aria-hidden="true">
                {tier === 1 ? "I" : "II"}
              </span>
              <span>{tier === 1 ? "First studies" : "Deeper studies"}</span>
              <span className="sc-research-tree-count">
                {tierKnown} of {tierIds.length} known
              </span>
              <TierMeter known={tierKnown} total={tierIds.length} />
            </h4>
            {tier === 2 ? (
              <p className="sc-research-tree-note">Each deeper study builds on one first study and needs Keep II or III.</p>
            ) : null}
            <div className="sc-research-tree-cards">
              {tierIds.map((id) => (
                <Row
                  key={id}
                  state={state}
                  act={act}
                  id={id}
                  academyFast={academy >= 1}
                  busyWith={open && open !== id ? RESEARCH[open].name : undefined}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export const ResearchCard = Row;
export const ResearchLivingCard = Row;
