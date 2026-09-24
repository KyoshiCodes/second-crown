import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";
import { isProvinceSeen } from "./fog.js";
import { listMarches } from "./march.js";
import { listOutposts } from "./outpost.js";
import { listGathers } from "./gather.js";
import { listTraining } from "./training.js";
import { researchDone, researchTicksLeft } from "./research.js";

export type PrimerTab = "kingdom" | "army" | "war" | "crown" | "board";

export const TUTORIAL_STEPS = [
  {
    id: "farm",
    tab: "kingdom" as PrimerTab,
    text: "Kingdom: place a Farm on the hold. Food feeds people and the host. Watch the income line.",
  },
  {
    id: "cottage",
    tab: "kingdom" as PrimerTab,
    text: "Kingdom: place a Cottage. Beds let more citizens spawn. The beds line turns amber when full.",
  },
  {
    id: "board",
    tab: "board" as PrimerTab,
    text: "Zoom the map out to the Board. Diamonds are provinces. Your keep is home, not a second city.",
  },
  {
    id: "scout",
    tab: "board" as PrimerTab,
    text: "Click a far tile and Scout it (gold). Fog hides other crowns until you scout or raise Watchtowers.",
  },
  {
    id: "train",
    tab: "army" as PrimerTab,
    text: "Army: queue militia (or any unlocked unit). Barracks cheapen the levy. Watch food upkeep.",
  },
  {
    id: "march",
    tab: "army" as PrimerTab,
    text: "Send a column from the composer. Fights use the column, not the whole home army.",
  },
  {
    id: "flag",
    tab: "board" as PrimerTab,
    text: "Break a camp, gather a node, or storm a tile to plant a flag. Garrison it if you want it to hold.",
  },
  {
    id: "walls",
    tab: "kingdom" as PrimerTab,
    text: "Hold rim: place Walls and a Gate. Eight rim walls close the ring. Kingdom shows wall HP.",
  },
  {
    id: "lectern",
    tab: "crown" as PrimerTab,
    text: "Crown: start a study when a hall and Keep allow it. An Academy shortens new studies. One study at a time.",
  },
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

function anyStudy(state: GameState): boolean {
  const ids = ["husbandry", "forestry", "masonry", "surveying", "horse", "siege"] as const;
  return ids.some((id) => {
    try {
      return researchDone(state, id as never) || researchTicksLeft(state, id as never) > 0;
    } catch {
      return false;
    }
  });
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
  if (step.id === "cottage") ok = countBuilding(state, "cottage") > 0;
  if (step.id === "board") ok = true;
  if (step.id === "scout") {
    ok = state.board.provinces.some(
      (p) => p.id !== state.board.homeProvinceId && isProvinceSeen(state, p.id) && Math.abs(p.x - 2) + Math.abs(p.y - 2) >= 2
    );
  }
  if (step.id === "train") {
    ok = listTraining(state, "player").length > 0 || Number(state.flags.tutorial_trained ?? 0) > 0;
  }
  if (step.id === "march") {
    ok = listMarches(state).some((m) => m.realmId === "player") || Number(state.flags.tutorial_marched ?? 0) > 0;
  }
  if (step.id === "flag") {
    ok = listOutposts(state).length > 0 || listGathers(state).some((g) => g.realmId === "player");
  }
  if (step.id === "walls") ok = countBuilding(state, "walls") + countBuilding(state, "gate") > 0;
  if (step.id === "lectern") ok = anyStudy(state);
  if (!ok) return false;
  state.flags.tutorial_index = i + 1;
  if (i + 1 >= TUTORIAL_STEPS.length) state.flags.tutorial_done = true;
  return true;
}

export function skipTutorial(state: GameState): void {
  state.flags.tutorial_done = true;
  state.flags.tutorial_index = TUTORIAL_STEPS.length;
}
