/** Inspect line for a hill tile. Reads the existing terrain field; fog hides it. */
export function hillLine(seen: boolean, terrain: string): string | null {
  return seen && terrain === "hill" ? "Hill · rise" : null;
}
