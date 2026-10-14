/** Inspect line for a peak tile. Reads the existing terrain field; fog hides it. */
export function peakLine(seen: boolean, terrain: string): string | null {
  return seen && terrain === "peak" ? "Peak · mountain" : null;
}
