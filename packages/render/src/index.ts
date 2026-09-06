import { Application, Graphics, Container } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import { getBuildingType } from "@second-crown/sim";

const TILE = 32;
const GRID_W = 16;
const GRID_H = 10;

export interface MapRenderer {
  sync(state: GameState): void;
  destroy(): void;
  onTileClick(cb: (x: number, y: number) => void): void;
}

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

  const hover = new Graphics();
  hover.rect(0, 0, TILE, TILE);
  hover.fill({ color: 0xffffff, alpha: 0.08 });
  hover.visible = false;
  app.stage.addChild(hover);

  const rectById = new Map<string, Graphics>();
  let clickCb: ((x: number, y: number) => void) | null = null;

  app.canvas.style.cursor = "pointer";

  function tileFromEvent(ev: PointerEvent) {
    const rect = app.canvas.getBoundingClientRect();
    const scaleX = (GRID_W * TILE) / rect.width;
    const scaleY = (GRID_H * TILE) / rect.height;
    const gx = Math.floor(((ev.clientX - rect.left) * scaleX) / TILE);
    const gy = Math.floor(((ev.clientY - rect.top) * scaleY) / TILE);
    return { gx, gy };
  }

  app.canvas.addEventListener("pointermove", (ev) => {
    const { gx, gy } = tileFromEvent(ev);
    if (gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H) {
      hover.visible = true;
      hover.x = gx * TILE;
      hover.y = gy * TILE;
    } else hover.visible = false;
  });
  app.canvas.addEventListener("pointerleave", () => {
    hover.visible = false;
  });
  app.canvas.addEventListener("pointerdown", (ev) => {
    const { gx, gy } = tileFromEvent(ev);
    if (gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H && clickCb) clickCb(gx, gy);
  });

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
      if (!complete) g.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
      // Level pips along the bottom of the tile
      const pips = Math.max(1, Math.min(5, b.level));
      for (let i = 0; i < pips; i++) {
        g.rect(6 + i * 4, TILE - 8, 3, 3);
        g.fill({ color: 0xffffff, alpha: 0.85 });
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
    onTileClick(cb) {
      clickCb = cb;
    },
  };
}
