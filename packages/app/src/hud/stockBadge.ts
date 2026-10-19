/** Board badge text for a gather tile's stock. Reads existing stock fields; null when the tile holds none. */
export function stockBadge(stock: number, stockMax: number): string | null {
  return stockMax > 0 ? `${stock}/${stockMax}` : null;
}
