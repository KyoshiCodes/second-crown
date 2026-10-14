/** Inspect line for a shore tile. Reads the existing terrain field; fog hides it. */
export function shoreLine(seen: boolean, terrain: string): string | null {
  return seen && terrain === "shore" ? "Shore · water" : null;
}
