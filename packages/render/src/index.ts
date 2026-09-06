import { Application, Graphics, Container } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import { getBuildingType } from "@second-crown/sim";

const TILE = 32;
const GRID_W = 16;
const GRID_H = 10;

export interface MapRenderer {
  sync(state: GameState): void;
  destroy(): void;
}

/**
 * Phase H: simple grid map. Buildings are colored rectangles.
 * Under-construction buildings are drawn semi-transparent.
 */
export async function createMapRenderer(canvas: HTMLCanvasElement): Promise<MapRenderer> {
  const app = new Application();
  await app.init({
    canvas,
    width: GRID_W * TILE,
    height: GRID_H * TILE,
    backgroundColor: 0x1a1f2e,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  const grid = new Graphics();
  for (let x = 0; x <= GRID_W; x++) {
    grid.moveTo(x * TILE, 0);
    grid.lineTo(x * TILE, GRID_H * TILE);
  }
  for (let y = 0; y <= GRID_H; y++) {
    grid.moveTo(0, y * TILE);
    grid.lineTo(GRID_W * TILE, y * TILE);
  }
  grid.stroke({ width: 1, color: 0x2d3348, alpha: 0.8 });
  app.stage.addChild(grid);

  const buildingsLayer = new Container();
  app.stage.addChild(buildingsLayer);

  const rectById = new Map<string, Graphics>();

  function sync(state: GameState): void {
    const seen = new Set<string>();

    for (const b of state.buildings) {
      seen.add(b.id);
      let g = rectById.get(b.id);
      if (!g) {
        g = new Graphics();
        rectById.set(b.id, g);
        buildingsLayer.addChild(g);
      }

      const def = getBuildingType(b.typeId);
      const color = def?.color ?? 0x4488ff;
      const complete = b.completesAtTick === null;
      const px = ((b.x % GRID_W) + GRID_W) % GRID_W;
      const py = ((b.y % GRID_H) + GRID_H) % GRID_H;

      g.clear();
      g.rect(4, 4, TILE - 8, TILE - 8);
      g.fill({ color, alpha: complete ? 1 : 0.4 });
      if (!complete) {
        g.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
      }
      g.x = px * TILE;
      g.y = py * TILE;
    }

    for (const [id, g] of rectById) {
      if (!seen.has(id)) {
        buildingsLayer.removeChild(g);
        g.destroy();
        rectById.delete(id);
      }
    }
  }

  return {
    sync,
    destroy() {
      app.destroy(true);
      rectById.clear();
    },
  };
}
