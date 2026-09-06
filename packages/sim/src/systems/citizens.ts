import type { CitizenInstance, CitizenJobId, CitizenTile, GameState } from "@second-crown/shared";

const BUILDING_JOB: Record<string, CitizenJobId> = {
  farm: "farmer",
  granary: "farmer",
  lumber_camp: "woodcutter",
  sawmill: "woodcutter",
  quarry: "miner",
  mason: "miner",
  gold_mine: "miner",
  market: "merchant",
  mint: "merchant",
  watchtower: "guard",
  walls: "guard",
  keep: "guard",
  barracks: "guard",
  chapel: "scholar",
};

/** Suggested job for a building type; presentation/assignment logic can use this later. */
export function jobForBuildingType(typeId: string): CitizenJobId {
  return BUILDING_JOB[typeId] ?? "unassigned";
}

export function createCitizen(
  state: GameState,
  realmId: string,
  job: CitizenJobId = "unassigned",
  tile: CitizenTile | null = null
): CitizenInstance {
  const citizen: CitizenInstance = {
    id: `c_${state.meta.tick}_${state.citizens.length}`,
    realmId,
    job,
    tile,
  };
  state.citizens.push(citizen);
  return citizen;
}

export function assignJob(state: GameState, citizenId: string, job: CitizenJobId): boolean {
  const citizen = state.citizens.find((c) => c.id === citizenId);
  if (!citizen) return false;
  citizen.job = job;
  return true;
}

export function assignTile(state: GameState, citizenId: string, tile: CitizenTile | null): boolean {
  const citizen = state.citizens.find((c) => c.id === citizenId);
  if (!citizen) return false;
  citizen.tile = tile;
  return true;
}

export function citizensByRealm(state: GameState, realmId: string): CitizenInstance[] {
  return state.citizens.filter((c) => c.realmId === realmId);
}

export function countCitizensByJob(state: GameState, realmId: string, job: CitizenJobId): number {
  return state.citizens.filter((c) => c.realmId === realmId && c.job === job).length;
}
