/** Inspect line for a ruins tile. Reads the existing node field; fog hides it. */
export function ruinsLine(seen: boolean, node: string): string | null {
  return seen && node === "ruins" ? "Ruins · no stock" : null;
}
