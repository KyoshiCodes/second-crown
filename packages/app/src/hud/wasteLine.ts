/** Inspect line for a waste tile. Reads the existing terrain field; fog hides it. */
export function wasteLine(seen: boolean, terrain: string): string | null {
  return seen && terrain === "waste" ? "Waste · scorched" : null;
}
