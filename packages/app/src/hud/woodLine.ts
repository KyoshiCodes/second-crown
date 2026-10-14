/** Inspect line for a wood tile. Reads the existing terrain field; fog hides it. */
export function woodLine(seen: boolean, terrain: string): string | null {
  return seen && terrain === "wood" ? "Wood · trees" : null;
}
