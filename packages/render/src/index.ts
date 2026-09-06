import { Application, Graphics, Container } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import { getBuildingType, currentSeason } from "@second-crown/sim";


const TILE = 32;
const GRID_W = 16;
const GRID_H = 10;

export interface MapRenderer {
  sync(state: GameState): void;
  destroy(): void;
  onTileClick(cb: (x: number, y: number) => void): void;
}

function drawBuilding(g: Graphics, typeId: string, level: number, complete: boolean, phase: number, season?: string): void {
  const a = complete ? 1 : 0.45;
  g.clear();
  g.rect(1, 1, TILE - 2, TILE - 2);
  g.fill({ color: 0x152018, alpha: 0.55 });

  if (typeId === "farm") {
    g.rect(3, 18, 26, 10);
    g.fill({ color: 0x6b8e23, alpha: a });
    g.rect(8, 10, 16, 12);
    g.fill({ color: 0x8b5a2b, alpha: a });
    g.moveTo(8, 10); g.lineTo(16, 4); g.lineTo(24, 10); g.fill({ color: 0xa0522d, alpha: a });
  } else if (typeId === "lumber_camp") {
    g.moveTo(6, 26); g.lineTo(12, 8); g.lineTo(18, 26); g.fill({ color: 0x2f6f3e, alpha: a });
    g.moveTo(14, 26); g.lineTo(22, 6); g.lineTo(28, 26); g.fill({ color: 0x3d8b55, alpha: a });
    g.rect(15, 20, 4, 8);
    g.fill({ color: 0x5c4033, alpha: a });
  } else if (typeId === "quarry" || typeId === "mason") {
    g.rect(5, 16, 10, 12); g.fill({ color: 0x808890, alpha: a });
    g.rect(14, 12, 12, 16); g.fill({ color: 0x6a7078, alpha: a });
    g.rect(8, 20, 8, 8); g.fill({ color: 0x9aa0a8, alpha: a });
  } else if (typeId === "gold_mine" || typeId === "mint") {
    g.moveTo(4, 26); g.lineTo(16, 8); g.lineTo(28, 26); g.fill({ color: 0x8a7a40, alpha: a });
    g.circle(16, 16, 4); g.fill({ color: 0xdaa520, alpha: a });
  } else if (typeId === "granary") {
    g.rect(10, 10, 12, 18); g.fill({ color: 0xc4a35a, alpha: a });
    g.ellipse(16, 10, 6, 4); g.fill({ color: 0xd4b36a, alpha: a });
  } else if (typeId === "sawmill") {
    g.rect(6, 14, 20, 14); g.fill({ color: 0x5c4033, alpha: a });
    g.circle(22, 14, 6); g.fill({ color: 0x8b6914, alpha: a });
  } else if (typeId === "market") {
    g.rect(6, 16, 20, 12); g.fill({ color: 0xcd853f, alpha: a });
    g.moveTo(6, 16); g.lineTo(16, 8); g.lineTo(26, 16); g.fill({ color: 0xb22222, alpha: a });
  } else if (typeId === "barracks") {
    g.rect(5, 12, 22, 16); g.fill({ color: 0x4a5568, alpha: a });
    g.moveTo(5, 12); g.lineTo(16, 5); g.lineTo(27, 12); g.fill({ color: 0x8b1a1a, alpha: a });
  } else if (typeId === "stables") {
    g.rect(6, 16, 20, 12); g.fill({ color: 0x8b6914, alpha: a });
    g.moveTo(6, 16); g.lineTo(16, 8); g.lineTo(26, 16); g.fill({ color: 0x5c4033, alpha: a });
    g.ellipse(11, 24, 4, 3); g.fill({ color: 0x4a3a1c, alpha: a });
    g.ellipse(21, 24, 4, 3); g.fill({ color: 0x4a3a1c, alpha: a });
  } else if (typeId === "archery_range") {
    g.rect(4, 20, 24, 8); g.fill({ color: 0x2f6f4e, alpha: a });
    g.circle(24, 14, 5); g.fill({ color: 0xc4a35a, alpha: a });
    g.circle(24, 14, 2); g.fill({ color: 0xb22222, alpha: a });
    g.rect(8, 8, 2, 16); g.fill({ color: 0x8b5a2b, alpha: a });
  } else if (typeId === "siege_workshop") {
    g.rect(5, 14, 22, 14); g.fill({ color: 0x5c4033, alpha: a });
    g.rect(20, 6, 4, 12); g.fill({ color: 0x8b6914, alpha: a });
    g.circle(10, 26, 3); g.fill({ color: 0x1a140c, alpha: a });
    g.circle(22, 26, 3); g.fill({ color: 0x1a140c, alpha: a });
  } else if (typeId === "watchtower") {
    g.rect(12, 10, 8, 18); g.fill({ color: 0x718096, alpha: a });
    const flap = Math.sin(phase) * 3;
    g.moveTo(16, 6); g.lineTo(16, 12); g.stroke({ width: 1, color: 0xd4a72c, alpha: a });
    g.moveTo(16, 6); g.lineTo(22 + flap, 8); g.lineTo(16, 10); g.fill({ color: 0xd4a72c, alpha: a });
  } else if (typeId === "chapel") {
    g.rect(8, 14, 16, 14); g.fill({ color: 0xc4b5fd, alpha: a });
    g.moveTo(8, 14); g.lineTo(16, 6); g.lineTo(24, 14); g.fill({ color: 0x7c3aed, alpha: a });
    g.rect(15, 4, 2, 8); g.fill({ color: 0xf5f0d8, alpha: a });
    g.rect(13, 6, 6, 2); g.fill({ color: 0xf5f0d8, alpha: a });
  } else if (typeId === "walls") {
    g.rect(2, 18, 28, 10); g.fill({ color: 0x64748b, alpha: a });
    g.rect(4, 12, 6, 16); g.fill({ color: 0x475569, alpha: a });
    g.rect(22, 12, 6, 16); g.fill({ color: 0x475569, alpha: a });
    g.rect(13, 10, 6, 18); g.fill({ color: 0x94a3b8, alpha: a });
  } else {
    g.rect(6, 10, 20, 16);
    g.fill({ color: getBuildingType(typeId)?.color ?? 0x4488ff, alpha: a });
  }

  if (typeId === "farm" || typeId === "lumber_camp" || typeId === "sawmill" || typeId === "siege_workshop") {
    const puff = 4 + Math.sin(phase * 1.3) * 2;
    g.circle(24, puff, 2.2);
    g.fill({ color: 0xd0d4d8, alpha: 0.35 * a });
  }

  // Winter snow capping on rooftops
  if (season === "Winter" && complete) {
    if (typeId === "farm" || typeId === "market" || typeId === "stables" || typeId === "barracks" || typeId === "chapel") {
      g.moveTo(6, 12); g.lineTo(16, 4.5); g.lineTo(26, 12);
      g.stroke({ width: 2.2, color: 0xf8fafc, alpha: 0.9 });
    } else if (typeId === "walls") {
      g.rect(2, 17, 28, 2.5); g.fill({ color: 0xf8fafc, alpha: 0.9 });
    } else {
      g.rect(6, 9, 20, 2); g.fill({ color: 0xf8fafc, alpha: 0.85 });
    }
  }

  const pips = Math.max(1, Math.min(5, level));
  for (let i = 0; i < pips; i++) {
    g.rect(4 + i * 5, TILE - 6, 4, 3);
    g.fill({ color: 0xf5f0d8, alpha: 0.9 });
  }
  if (!complete) g.stroke({ width: 2, color: 0xffffff, alpha: 0.4 });
}

function paintGround(ground: Graphics, season: string): void {
  ground.clear();
  let colorA = 0x1a2e20;
  let colorB = 0x16261a;
  let gridColor = 0x27432e;

  if (season === "Summer") {
    colorA = 0x283318;
    colorB = 0x222a14;
    gridColor = 0x3d4b24;
  } else if (season === "Autumn") {
    colorA = 0x352316;
    colorB = 0x2d1c12;
    gridColor = 0x4d321e;
  } else if (season === "Winter") {
    colorA = 0x232f3c;
    colorB = 0x1c2530;
    gridColor = 0x394b5e;
  }

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const shade = (x + y) % 2 === 0 ? colorA : colorB;
      ground.rect(x * TILE, y * TILE, TILE, TILE);
      ground.fill({ color: shade });

      // Subtle ground accents
      if (season === "Spring") {
        if ((x * 7 + y * 13) % 11 === 0) {
          ground.circle(x * TILE + 8, y * TILE + 12, 1.5);
          ground.fill({ color: 0xf472b6, alpha: 0.7 });
        } else if ((x * 11 + y * 5) % 13 === 0) {
          ground.circle(x * TILE + 22, y * TILE + 20, 1.5);
          ground.fill({ color: 0xfacc15, alpha: 0.7 });
        }
      } else if (season === "Summer") {
        if ((x * 9 + y * 7) % 10 === 0) {
          ground.rect(x * TILE + 10, y * TILE + 14, 6, 2);
          ground.fill({ color: 0x84cc16, alpha: 0.35 });
        }
      } else if (season === "Autumn") {
        if ((x * 5 + y * 11) % 7 === 0) {
          ground.circle(x * TILE + 14, y * TILE + 18, 2);
          ground.fill({ color: 0xd97706, alpha: 0.65 });
        } else if ((x * 13 + y * 3) % 9 === 0) {
          ground.circle(x * TILE + 24, y * TILE + 8, 1.8);
          ground.fill({ color: 0xb91c1c, alpha: 0.6 });
        }
      } else if (season === "Winter") {
        if ((x * 3 + y * 7) % 6 === 0) {
          ground.rect(x * TILE + 6, y * TILE + 10, 8, 4);
          ground.fill({ color: 0xe2e8f0, alpha: 0.28 });
        }
      }
    }
  }

  for (let x = 0; x <= GRID_W; x++) {
    ground.moveTo(x * TILE, 0);
    ground.lineTo(x * TILE, GRID_H * TILE);
  }
  for (let y = 0; y <= GRID_H; y++) {
    ground.moveTo(0, y * TILE);
    ground.lineTo(GRID_W * TILE, y * TILE);
  }
  ground.stroke({ width: 1, color: gridColor, alpha: 0.7 });
}

export async function createMapRenderer(canvas: HTMLCanvasElement): Promise<MapRenderer> {
  const app = new Application();
  await app.init({
    canvas,
    width: GRID_W * TILE,
    height: GRID_H * TILE,
    backgroundColor: 0x142018,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  const ground = new Graphics();
  paintGround(ground, "Spring");
  app.stage.addChild(ground);


  const buildingsLayer = new Container();
  app.stage.addChild(buildingsLayer);

  const hover = new Graphics();
  hover.rect(0, 0, TILE, TILE);
  hover.fill({ color: 0xffffff, alpha: 0.1 });
  hover.visible = false;
  app.stage.addChild(hover);

  const rectById = new Map<string, Graphics>();
  let lastState: GameState | null = null;
  let clickCb: ((x: number, y: number) => void) | null = null;
  let phase = 0;

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

  let activeSeason = "";

  function paint(state: GameState, t: number): void {
    const season = currentSeason(state);
    if (season !== activeSeason) {
      activeSeason = season;
      paintGround(ground, season);
    }

    const seen = new Set<string>();
    for (const b of state.buildings) {
      seen.add(b.id);
      let g = rectById.get(b.id);
      if (!g) {
        g = new Graphics();
        rectById.set(b.id, g);
        buildingsLayer.addChild(g);
      }
      const complete = b.completesAtTick === null;
      const px = ((b.x % GRID_W) + GRID_W) % GRID_W;
      const py = ((b.y % GRID_H) + GRID_H) % GRID_H;
      drawBuilding(g, b.typeId, b.level, complete, t + px * 0.4, season);
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


  function sync(state: GameState): void {
    lastState = state;
    paint(state, phase);
  }

  app.ticker.add(() => {
    phase += 0.04;
    if (lastState) paint(lastState, phase);
  });

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
