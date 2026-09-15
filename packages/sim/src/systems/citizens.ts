import type { CitizenInstance, CitizenJobId, CitizenTile, GameState } from "@second-crown/shared";
import { canHouse } from "./housing.js";

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
  infirmary: "scholar",
};

const JOB_ROLE: Record<string, string> = {
  farmer: "villager",
  woodcutter: "woodcutter",
  miner: "miner",
  merchant: "merchant",
  guard: "guard",
  scholar: "scholar",
  unassigned: "villager",
};

export function jobForBuildingType(typeId: string): CitizenJobId {
  return BUILDING_JOB[typeId] ?? "unassigned";
}

export function walkerRoleForJob(job: CitizenJobId | string): string {
  return JOB_ROLE[job] ?? "villager";
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

export function hireCitizenForBuilding(
  state: GameState,
  realmId: string,
  typeId: string,
  x: number,
  y: number
): CitizenInstance {
  if (typeId === "cottage" || typeId === "gate") {
    return { id: `skip_${typeId}`, realmId, job: "unassigned", tile: { x, y } };
  }
  if (!canHouse(state, realmId)) {
    return { id: "skip_cap", realmId, job: jobForBuildingType(typeId), tile: { x, y } };
  }
  return createCitizen(state, realmId, jobForBuildingType(typeId), { x, y });
}

export function seedCitizensFromBuildings(state: GameState): void {
  if (state.citizens.length > 0) return;
  for (const b of state.buildings) {
    if (b.completesAtTick !== null) continue;
    hireCitizenForBuilding(state, b.realmId, b.typeId, b.x, b.y);
  }
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

/** Send a worker to a finished building. Cottage and gate have no trade. */
export function tryAssignCitizen(state: GameState, citizenId: string, buildingId: string): boolean {
  const citizen = state.citizens.find((c) => c.id === citizenId);
  if (!citizen) return false;
  const b = state.buildings.find((x) => x.id === buildingId);
  if (!b || b.completesAtTick !== null) return false;
  if (b.realmId !== citizen.realmId) return false;
  const job = jobForBuildingType(b.typeId);
  if (job === "unassigned") return false;
  citizen.job = job;
  citizen.tile = { x: b.x, y: b.y };
  return true;
}

export function tryIdleCitizen(state: GameState, citizenId: string): boolean {
  const citizen = state.citizens.find((c) => c.id === citizenId);
  if (!citizen) return false;
  citizen.job = "unassigned";
  citizen.tile = null;
  return true;
}
