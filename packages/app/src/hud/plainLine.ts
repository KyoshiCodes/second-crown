/** Inspect line for a plain tile. Reads the existing terrain field; fog hides it. */
export function plainLine(seen: boolean, terrain: string): string | null {
  return seen && terrain === "plain" ? "Plain · meadow" : null;
}
