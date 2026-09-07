import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";
import { isProvinceSeen } from "./fog.js";
import { listMarches } from "./march.js";
import { listOutposts } from "./outpost.js";

export const TUTORIAL_STEPS = [
  { id: "farm", text: "On the Hold, place a Farm. Food keeps your people and your army." },
  { id: "board", text: "Zoom out to the Board. That table is the world, not another city." },
  { id: "scout", text: "Click a far token and Scout it. Fog hides other crowns until you pay gold or build Watchtowers." },
  { id: "march", text: "Send a company with the composer. Five militia is the levy; mix in archers if you have them." },
  { id: "outpost", text: "Break a camp or forage a node and you plant an outpost — a flag, not a second city." },
  { id: "walls", text: "On the Hold rim, place Walls and a Gate. Eight rim walls close the ring." },
] as const;

export function tutorialIndex(state: GameState): number {
  const raw = Number(state.flags.tutorial_index ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(TUTORIAL_STEPS.length, Math.floor(raw)));
}

export function tutorialDone(state: GameState): boolean {
  return state.flags.tutorial_done === true || tutorialIndex(state) >= TUTORIAL_STEPS.length;
}

export function currentTutorial(state: GameState): (typeof TUTORIAL_STEPS)[number] | null {
  if (tutorialDone(state)) return null;
  return TUTORIAL_STEPS[tutorialIndex(state)] ?? null;
}

export function tryAdvanceTutorial(state: GameState): boolean {
  if (tutorialDone(state)) return false;
  const i = tutorialIndex(state);
  const step = TUTORIAL_STEPS[i];
  if (!step) {
    state.flags.tutorial_done = true;
    return false;
  }
  let ok = false;
  if (step.id === "farm") ok = countBuilding(state, "farm") > 0;
  if (step.id === "board") ok = true;
  if (step.id === "scout") ok = state.board.provinces.some((p) => p.id !== state.board.homeProvinceId && isProvinceSeen(state, p.id) && Math.abs(p.x - 2) + Math.abs(p.y - 2) >= 2);
  if (step.id === "march") ok = listMarches(state).some((m) => m.realmId === "player") || Number(state.flags.tutorial_marched ?? 0) > 0;
  if (step.id === "outpost") ok = listOutposts(state).length > 0;
  if (step.id === "walls") ok = countBuilding(state, "walls") + countBuilding(state, "gate") > 0;
  if (!ok) return false;
  state.flags.tutorial_index = i + 1;
  if (i + 1 >= TUTORIAL_STEPS.length) state.flags.tutorial_done = true;
  return true;
}

export function skipTutorial(state: GameState): void {
  state.flags.tutorial_done = true;
  state.flags.tutorial_index = TUTORIAL_STEPS.length;
}
