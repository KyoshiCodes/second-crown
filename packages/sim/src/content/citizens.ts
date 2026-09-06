import type { CitizenJobId } from "@second-crown/shared";

export interface CitizenJob {
  id: CitizenJobId;
  name: string;
  blurb: string;
}

/**
 * Stub roster only: presentation (packages/render walkers) can read job/tile
 * off a citizen to decide how to draw it. No production, upkeep, or
 * assignment AI lives here yet — that is a later sim pass.
 */
export const CITIZEN_JOBS: Record<CitizenJobId, CitizenJob> = {
  unassigned: { id: "unassigned", name: "Villager", blurb: "Not yet given a trade" },
  farmer: { id: "farmer", name: "Farmer", blurb: "Works the fields" },
  woodcutter: { id: "woodcutter", name: "Woodcutter", blurb: "Fells timber" },
  miner: { id: "miner", name: "Miner", blurb: "Digs stone and ore" },
  merchant: { id: "merchant", name: "Merchant", blurb: "Trades at the market" },
  guard: { id: "guard", name: "Guard", blurb: "Watches the walls" },
  scholar: { id: "scholar", name: "Scholar", blurb: "Studies at the chapel" },
};

export function getCitizenJob(id: string): CitizenJob | undefined {
  return CITIZEN_JOBS[id as CitizenJobId];
}

export function listCitizenJobs(): CitizenJob[] {
  return Object.values(CITIZEN_JOBS);
}
