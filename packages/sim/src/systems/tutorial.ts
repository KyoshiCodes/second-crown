import type { GameState } from "@second-crown/shared";
import { countBuilding } from "../content/buildings.js";
import { isProvinceSeen } from "./fog.js";
import { listMarches } from "./march.js";
import { listOutposts } from "./outpost.js";
import { listGathers } from "./gather.js";
import { listTraining } from "./training.js";
import { researchDone, researchTicksLeft } from "./research.js";

export type PrimerTab = "kingdom" | "army" | "war" | "world" | "crown" | "board";

export const TUTORIAL_STEPS = [
  {
    id: "farm",
    tab: "kingdom" as PrimerTab,
    text: "Kingdom: the strip up top shows Food, Wood, Stone and Gold with income per tick. Place a Farm. Once it stands it gets a work card under Standing works.",
  },
  {
    id: "cottage",
    tab: "kingdom" as PrimerTab,
    text: "Kingdom: place a Cottage for beds and another work plot. Below, People sorts citizens onto job cards. Market offer cards open once a Market stands.",
  },
  {
    id: "board",
    tab: "board" as PrimerTab,
    text: "Press Board on the map. Click a tile: a gold rim marks it, and the inspect card groups it under Tile, Owner, Forces and Hold.",
  },
  {
    id: "scout",
    tab: "board" as PrimerTab,
    text: "Click a far tile and press Scout column on its inspect card (gold plus one skirmisher or militia). Fog hides other crowns until you scout or raise Watchtowers.",
  },
  {
    id: "train",
    tab: "army" as PrimerTab,
    text: "Army: each unit card shows cost and food upkeep. Queue militia or any unlocked unit. Barracks cheapen the levy.",
  },
  {
    id: "march",
    tab: "board" as PrimerTab,
    text: "Fill the Column box on a tile's inspect card and send it. Then open War: force cards track your columns, Last battle shows the latest fight, diplomacy cards show each crown's stance.",
  },
  {
    id: "flag",
    tab: "board" as PrimerTab,
    text: "Gather a node or raid a tile to plant a flag. Station a garrison if you want it to hold. World: the log marks claims, trades and raids.",
  },
  {
    id: "walls",
    tab: "kingdom" as PrimerTab,
    text: "Hold rim: place Walls and a Gate. Eight rim walls close the ring. Kingdom shows wall HP.",
  },
  {
    id: "lectern",
    tab: "crown" as PrimerTab,
    text: "Crown: start a study when a hall and Keep allow it (an Academy speeds it up). Swear decrees here; War lists the ones running. Latest event shows here too.",
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
