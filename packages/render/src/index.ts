import { Application, Graphics, Container } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import { currentSeason } from "@second-crown/sim";
import * as sim from "@second-crown/sim";

// Re-export Camera & Projection
export * from "./camera.js";

// Re-export Tiles & Terrain & Height Faces & Fog
export * from "./tiles.js";

// Re-export Buildings & Culture Kits
export * from "./buildings.js";

// Re-export Tokens & Miniature Keeps & Board Marches
export * from "./tokens.js";

// Re-export Walkers & Citizen Roles
export * from "./walkers.js";

import {
  type CameraBand,
  ZOOM_THRESHOLD,
  BOARD_DEFAULT_ZOOM,
  HOLD_DEFAULT_ZOOM,
  MIN_CAMERA_ZOOM,
  MAX_CAMERA_ZOOM,
  CANVAS_W,
  CANVAS_H,
  ORIGIN_X,
  ORIGIN_Y,
  ORIGIN_BOARD_X,
  ORIGIN_BOARD_Y,
  CHIP_W,
  CHIP_H,
  GAP_X,
  GAP_Y,
  RIM_SIZE,
  HALF_W,
  HALF_H,
  bandForZoom,
  provinceTokenBounds,
  hitTestProvince,
  calculateMarchProgress,
  gridToWorld,
  worldToGrid,
  paintTableRim,
} from "./camera.js";

import {
  GRID_W,
  GRID_H,
  isRimTile,
  type ThemeVisuals,
  type RimFort,
  type RimNeighbors,
  rimWalkIndex,
  listRimFortsPresentation,
  paintIsometricGround,
  paintBoardBackdrop,
} from "./tiles.js";

import {
  getThemeVisuals,
  drawIsometricBuilding,
} from "./buildings.js";

import {
  drawMiniatureKeep,
  paintBoardProvinces,
  paintBoardMarches,
  paintBoardHighlight,
} from "./tokens.js";

import {
  type Walker,
  type WalkerJobTool,
  roleForCitizenJob,
  toolForCitizen,
  createWalker,
  drawWalkerFrame,
  pickDestination,
} from "./walkers.js";

export interface MapRenderer {
  sync(state: GameState): void;
  setTheme(themeId: string, holidayId: string): void;
  destroy(): void;
  onTileClick(cb: (x: number, y: number) => void): void;
  onProvinceClick(cb: (provinceId: string) => void): void;
  zoomIn(): void;
  zoomOut(): void;
  resetView(): void;
  getBand(): CameraBand;
  setBand(band: CameraBand): void;
  onBandChange(cb: (band: CameraBand) => void): void;
}

// -------------------------------------------------------------
// Main Map Renderer Factory (Two-Band Camera: Hold vs Board)
// -------------------------------------------------------------
export async function createMapRenderer(canvas: HTMLCanvasElement): Promise<MapRenderer> {
  const app = new Application();
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  await app.init({
    canvas,
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: 0x0a0c10,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  canvas.style.width = "100%";
  canvas.style.height = "auto";

  // Root containers
  // 1. worldContainer: scales with zoom and translates with pan
  const worldContainer = new Container();
  app.stage.addChild(worldContainer);

  // 2. Viewport mask: cleanly clips the diorama inside the wooden tabletop rim
  const boardMask = new Graphics();
  boardMask.rect(RIM_SIZE, RIM_SIZE, CANVAS_W - 2 * RIM_SIZE, CANVAS_H - 2 * RIM_SIZE);
  boardMask.fill({ color: 0xffffff });
  app.stage.addChild(boardMask);
  worldContainer.mask = boardMask;

  // Two camera bands inside worldContainer:
  // Band 1: Hold Container (16x10 isometric turf, buildings, walkers, fog, particles)
  const holdContainer = new Container();
  worldContainer.addChild(holdContainer);

  // Band 2: Board Container (8x6 tabletop province tokens, routes, march pawns)
  const boardContainer = new Container();
  boardContainer.visible = false;
  worldContainer.addChild(boardContainer);

  // Hold layers inside holdContainer
  const groundLayer = new Graphics();
  holdContainer.addChild(groundLayer);

  const entitiesLayer = new Container();
  entitiesLayer.sortableChildren = true;
  holdContainer.addChild(entitiesLayer);

  const fogLayer = new Graphics();
  holdContainer.addChild(fogLayer);

  const ambientOverlay = new Graphics();
  holdContainer.addChild(ambientOverlay);

  const particlesGraphic = new Graphics();
  holdContainer.addChild(particlesGraphic);

  const hoverGraphic = new Graphics();
  hoverGraphic.poly([
    0, -HALF_H,
    HALF_W, 0,
    0, HALF_H,
    -HALF_W, 0,
  ]);
  hoverGraphic.stroke({ width: 1.8, color: 0xfef08a, alpha: 0.85 });
  hoverGraphic.fill({ color: 0xffffff, alpha: 0.12 });
  hoverGraphic.visible = false;
  holdContainer.addChild(hoverGraphic);

  // Board layers inside boardContainer
  const boardBackdropLayer = new Graphics();
  boardContainer.addChild(boardBackdropLayer);

  const boardProvincesLayer = new Graphics();
  boardContainer.addChild(boardProvincesLayer);

  const boardRoutesLayer = new Graphics();
  boardContainer.addChild(boardRoutesLayer);

  const boardPawnsLayer = new Graphics();
  boardContainer.addChild(boardPawnsLayer);

  const boardHighlightLayer = new Graphics();
  boardHighlightLayer.visible = false;
  boardContainer.addChild(boardHighlightLayer);

  // 3. Tabletop Hardwood Rim (rendered on top of world and mask)
  const tableRimLayer = new Graphics();
  app.stage.addChild(tableRimLayer);
  paintTableRim(tableRimLayer);

  // State management
  const buildingGraphics = new Map<string, Graphics>();
  let lastState: GameState | null = null;
  let clickCb: ((x: number, y: number) => void) | null = null;
  let provinceClickCb: ((provinceId: string) => void) | null = null;
  let bandChangeCb: ((band: CameraBand) => void) | null = null;
  let phase = 0;
  let currentSeasonName = "Spring";
  let currentHolidayId = "none";
  let visuals = getThemeVisuals(currentSeasonName, currentHolidayId);
  let hoveredProvinceCoord: { bx: number; by: number } | null = null;

  // Zoom & Pan State (two zoom bands: Hold vs Board)
  let zoom = HOLD_DEFAULT_ZOOM;
  let panX = 0;
  let panY = 0;
  let currentBand: CameraBand = "hold";

  function updateBand(nextBand: CameraBand): void {
    if (currentBand !== nextBand) {
      currentBand = nextBand;
      bandChangeCb?.(currentBand);
      window.dispatchEvent(new CustomEvent("sc-camera-band-change", { detail: currentBand }));
    }
  }

  function applyTransform(): void {
    const nextBand = bandForZoom(zoom);
    updateBand(nextBand);

    if (currentBand === "hold") {
      holdContainer.visible = true;
      boardContainer.visible = false;
      holdContainer.scale.set(zoom);
      holdContainer.position.set(panX, panY);
    } else {
      holdContainer.visible = false;
      boardContainer.visible = true;
      const boardScale = zoom / BOARD_DEFAULT_ZOOM;
      boardContainer.scale.set(boardScale);
      boardContainer.position.set(
        panX + (1 - boardScale) * (CANVAS_W / 2),
        panY + (1 - boardScale) * (CANVAS_H / 2)
      );
    }
  }
  applyTransform();

  function setZoomCentered(newZoom: number, cx: number, cy: number): void {
    const clamped = Math.max(MIN_CAMERA_ZOOM, Math.min(MAX_CAMERA_ZOOM, newZoom));
    if (Math.abs(clamped - zoom) < 0.001) return;
    const wx = (cx - panX) / zoom;
    const wy = (cy - panY) / zoom;
    zoom = clamped;
    panX = cx - wx * zoom;
    panY = cy - wy * zoom;

    const maxPanX = CANVAS_W * 0.75;
    const maxPanY = CANVAS_H * 0.75;
    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
    applyTransform();
  }

  function setBand(targetBand: CameraBand): void {
    if (targetBand === "hold") {
      zoom = HOLD_DEFAULT_ZOOM;
      panX = 0;
      panY = 0;
    } else {
      zoom = BOARD_DEFAULT_ZOOM;
      panX = 0;
      panY = 0;
    }
    applyTransform();
  }

  // Paint ground and board backdrop initially
  paintIsometricGround(groundLayer, visuals);
  paintBoardBackdrop(boardBackdropLayer, visuals);

  // Living Walkers presentation pool (8 citizens)
  const WALKERS_COUNT = 8;
  const walkers: Walker[] = [];
  for (let i = 0; i < WALKERS_COUNT; i++) {
    const w = createWalker(i, 7 + (i % 3), 4 + Math.floor(i / 3));
    walkers.push(w);
    entitiesLayer.addChild(w.graphics);
  }

  // Drifting Fog banks for All Hallows
  const FOG_COUNT = 8;
  const fogBanks = Array.from({ length: FOG_COUNT }, (_, i) => ({
    x: 80 + (i * 55) % 400,
    y: 60 + (i * 38) % 240,
    vx: 0.12 + (i % 3) * 0.05,
    vy: 0.04 + (i % 2) * 0.03,
    rx: 40 + (i % 4) * 12,
    ry: 18 + (i % 3) * 6,
    alpha: 0.14 + (i % 3) * 0.05,
    phase: i * 1.2,
  }));

  // Floating ambient particle pool
  const PARTICLE_COUNT = 24;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * CANVAS_W,
    y: Math.random() * CANVAS_H,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.3 + Math.random() * 0.7,
    size: 1 + Math.random() * 2,
    alpha: 0.2 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
  }));

  app.canvas.style.cursor = "grab";

  // Coordinate Conversion with Zoom & Pan inversion
  function getCanvasCoords(ev: PointerEvent | MouseEvent): { px: number; py: number } {
    const rect = app.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      px: (ev.clientX - rect.left) * scaleX,
      py: (ev.clientY - rect.top) * scaleY,
    };
  }

  function getWorldCoords(ev: PointerEvent | MouseEvent): { wx: number; wy: number } {
    const { px, py } = getCanvasCoords(ev);
    return {
      wx: (px - panX) / zoom,
      wy: (py - panY) / zoom,
    };
  }

  function getGridFromEvent(ev: PointerEvent | MouseEvent): { gx: number; gy: number } {
    const { wx, wy } = getWorldCoords(ev);
    return worldToGrid(wx, wy);
  }

  function getBoardCoords(ev: PointerEvent | MouseEvent): { bx: number; by: number } {
    const { px, py } = getCanvasCoords(ev);
    const boardScale = zoom / BOARD_DEFAULT_ZOOM;
    const boardOriginX = panX + (1 - boardScale) * (CANVAS_W / 2);
    const boardOriginY = panY + (1 - boardScale) * (CANVAS_H / 2);
    return {
      bx: (px - boardOriginX) / boardScale,
      by: (py - boardOriginY) / boardScale,
    };
  }

  // Pointer drag panning and click detection
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialPanX = 0;
  let initialPanY = 0;
  let dragMoved = 0;

  app.canvas.addEventListener("pointerdown", (ev) => {
    isDragging = true;
    app.canvas.style.cursor = "grabbing";
    dragStartX = ev.clientX;
    dragStartY = ev.clientY;
    initialPanX = panX;
    initialPanY = panY;
    dragMoved = 0;
  });

  app.canvas.addEventListener("pointermove", (ev) => {
    const { px, py } = getCanvasCoords(ev);

    if (isDragging) {
      const dx = (ev.clientX - dragStartX) * (CANVAS_W / app.canvas.clientWidth);
      const dy = (ev.clientY - dragStartY) * (CANVAS_H / app.canvas.clientHeight);
      dragMoved += Math.hypot(dx, dy);
      const maxPanX = CANVAS_W * 0.85;
      const maxPanY = CANVAS_H * 0.85;
      panX = Math.max(-maxPanX, Math.min(maxPanX, initialPanX + dx));
      panY = Math.max(-maxPanY, Math.min(maxPanY, initialPanY + dy));
      applyTransform();
    }

    if (currentBand === "hold") {
      boardHighlightLayer.visible = false;
      const { gx, gy } = getGridFromEvent(ev);
      if (
        px >= RIM_SIZE && px <= CANVAS_W - RIM_SIZE &&
        py >= RIM_SIZE && py <= CANVAS_H - RIM_SIZE &&
        gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H
      ) {
        const { wx, wy } = gridToWorld(gx, gy);
        hoverGraphic.visible = true;
        hoverGraphic.x = wx;
        hoverGraphic.y = wy;
      } else {
        hoverGraphic.visible = false;
      }
    } else {
      hoverGraphic.visible = false;
      const { bx, by } = getBoardCoords(ev);
      const hit = hitTestProvince(bx, by);
      if (
        hit &&
        px >= RIM_SIZE && px <= CANVAS_W - RIM_SIZE &&
        py >= RIM_SIZE && py <= CANVAS_H - RIM_SIZE
      ) {
        hoveredProvinceCoord = hit;
        boardHighlightLayer.visible = true;
        paintBoardHighlight(boardHighlightLayer, hit.bx, hit.by, lastState);
      } else {
        hoveredProvinceCoord = null;
        boardHighlightLayer.visible = false;
      }
    }
  });

  window.addEventListener("pointerup", (ev) => {
    if (!isDragging) return;
    isDragging = false;
    app.canvas.style.cursor = "grab";

    if (dragMoved < 6) {
      const { px, py } = getCanvasCoords(ev);
      if (
        px >= RIM_SIZE && px <= CANVAS_W - RIM_SIZE &&
        py >= RIM_SIZE && py <= CANVAS_H - RIM_SIZE
      ) {
        if (currentBand === "hold" && clickCb) {
          const { gx, gy } = getGridFromEvent(ev);
          if (gx >= 0 && gy >= 0 && gx < GRID_W && gy < GRID_H) {
            clickCb(gx, gy);
          }
        } else if (currentBand === "board" && lastState) {
          const { bx, by } = getBoardCoords(ev);
          const hit = hitTestProvince(bx, by);
          if (hit) {
            const p = lastState.board?.provinces?.find((pr) => pr.x === hit.bx && pr.y === hit.by);
            if (p) {
              if (p.id === lastState.board?.homeProvinceId) {
                // Clicking home province snaps back to Hold band
                setBand("hold");
              } else if (provinceClickCb) {
                provinceClickCb(p.id);
              }
            }
          }
        }
      }
    }
  });

  app.canvas.addEventListener("pointerleave", () => {
    hoverGraphic.visible = false;
    boardHighlightLayer.visible = false;
    hoveredProvinceCoord = null;
  });

  // Mouse wheel zoom centered at cursor
  app.canvas.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const { px, py } = getCanvasCoords(ev);
    const zoomDelta = ev.deltaY < 0 ? 1.15 : 0.87;
    setZoomCentered(zoom * zoomDelta, px, py);
  }, { passive: false });

  function updateWalkers(dt: number, state: GameState | null): void {
    const playerWorkers = state?.citizens?.filter(
      (c) => c.realmId === "player" && c.tile != null
    ) ?? [];

    for (const w of walkers) {
      if (playerWorkers.length > 0) {
        const worker = playerWorkers[w.id % playerWorkers.length];
        w.role = roleForCitizenJob(worker.job);
        const b = state?.buildings?.find(
          (bld) => bld.x === worker.tile!.x && bld.y === worker.tile!.y
        );
        w.tool = toolForCitizen(worker.job, b?.typeId, w.id);
      }

      if (w.state === "idle") {
        w.idleTime -= dt;
        w.idlePhase += dt;
        if (w.idleTime <= 0) {
          pickDestination(w, state);
        }
      } else {
        const dx = w.targetX - w.x;
        const dy = w.targetY - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.08) {
          w.x = w.targetX;
          w.y = w.targetY;
          w.state = "idle";
          w.idleTime = 2 + Math.random() * 4;
        } else {
          const move = (w.speed * dt) / Math.max(0.1, dist);
          w.x += dx * move;
          w.y += dy * move;
          w.facing = dx >= 0 ? 1 : -1;
          w.walkDist += move * 12;
        }
      }

      let frame: 0 | 1 | 2 = 0;
      if (w.state === "walking") {
        const cycle = Math.floor(w.walkDist) % 4;
        if (cycle === 1) frame = 1;
        else if (cycle === 3) frame = 2;
        else frame = 0;
      }

      const { wx, wy } = gridToWorld(w.x, w.y);
      w.graphics.x = wx;
      w.graphics.y = wy;
      w.graphics.zIndex = Math.floor((w.x + w.y) * 100) + 40;

      const cultId = lastState && sim.playerCultureId ? sim.playerCultureId(lastState) : undefined;
      drawWalkerFrame(w.graphics, w.role, w.facing, frame, cultId, w.tool);
    }
  }

  function updateFog(t: number): void {
    fogLayer.clear();
    const dec = visuals.decorations;

    let outerColor = 0x3b244d;
    let innerColor = 0x241433;
    let alphaMult = 1.0;

    if (dec === "halloween") {
      outerColor = 0x3b244d;
      innerColor = 0x241433;
      alphaMult = 1.0;
    } else if (dec === "midwinter") {
      outerColor = 0xbae6fd;
      innerColor = 0xe0f2fe;
      alphaMult = 1.15;
    } else if (dec === "easter") {
      outerColor = 0xf3e8ff;
      innerColor = 0xfdf4ff;
      alphaMult = 0.85;
    } else if (dec === "harvest") {
      outerColor = 0x78350f;
      innerColor = 0x92400e;
      alphaMult = 0.95;
    } else if (dec === "midsummer") {
      outerColor = 0xfde047;
      innerColor = 0xfef08a;
      alphaMult = 0.75;
    } else if (dec === "spring") {
      outerColor = 0xdcfce7;
      innerColor = 0xf0fdf4;
      alphaMult = 0.50;
    } else if (dec === "summer") {
      outerColor = 0xfef9c3;
      innerColor = 0xfef08a;
      alphaMult = 0.40;
    } else if (dec === "autumn") {
      outerColor = 0x78350f;
      innerColor = 0xb45309;
      alphaMult = 0.60;
    } else if (dec === "winter") {
      outerColor = 0xe2e8f0;
      innerColor = 0xf1f5f9;
      alphaMult = 0.70;
    } else {
      return;
    }

    for (const f of fogBanks) {
      f.x += f.vx;
      f.y += f.vy;
      if (f.x > CANVAS_W + 50) f.x = -50;
      if (f.y > CANVAS_H + 30) f.y = -30;

      const pulse = Math.sin(t + f.phase) * 0.08 + 1.0;
      fogLayer.ellipse(f.x, f.y, f.rx * pulse, f.ry * pulse);
      fogLayer.fill({ color: outerColor, alpha: f.alpha * alphaMult });
      fogLayer.ellipse(f.x + 4, f.y - 2, f.rx * 0.65 * pulse, f.ry * 0.6 * pulse);
      fogLayer.fill({ color: innerColor, alpha: f.alpha * 0.7 * alphaMult });
    }
  }

  function updateParticles(t: number): void {
    particlesGraphic.clear();
    const dec = visuals.decorations;

    for (const p of particles) {
      p.y += p.vy;
      p.x += p.vx + Math.sin(t + p.phase) * 0.3;

      if (p.y > CANVAS_H + 10) { p.y = -10; p.x = Math.random() * CANVAS_W; }
      if (p.x > CANVAS_W + 10) p.x = -10;
      if (p.x < -10) p.x = CANVAS_W + 10;

      if (dec === "midwinter" || dec === "winter") {
        particlesGraphic.circle(p.x, p.y, p.size * 0.9);
        particlesGraphic.fill({ color: 0xf8fafc, alpha: p.alpha });
      } else if (dec === "halloween") {
        particlesGraphic.circle(p.x, p.y, p.size);
        particlesGraphic.fill({ color: 0xf97316, alpha: p.alpha * 0.75 });
      } else if (dec === "midsummer") {
        const glow = Math.sin(t * 3 + p.phase) * 0.4 + 0.6;
        particlesGraphic.circle(p.x, p.y, p.size * 1.2);
        particlesGraphic.fill({ color: 0xfacc15, alpha: p.alpha * glow });
      } else if (dec === "autumn" || dec === "harvest") {
        particlesGraphic.ellipse(p.x, p.y, p.size * 1.5, p.size);
        particlesGraphic.fill({ color: 0xd97706, alpha: p.alpha * 0.8 });
      } else if (dec === "spring" || dec === "easter") {
        particlesGraphic.circle(p.x, p.y, p.size);
        particlesGraphic.fill({ color: 0xf472b6, alpha: p.alpha * 0.6 });
      }
    }
  }

  function paintAmbientLighting(): void {
    ambientOverlay.clear();
    if (visuals.tintAlpha > 0) {
      ambientOverlay.rect(-CANVAS_W, -CANVAS_H, CANVAS_W * 3, CANVAS_H * 3);
      ambientOverlay.fill({ color: visuals.tintColor, alpha: visuals.tintAlpha });
    }
  }

  function paintBuildings(state: GameState, t: number): void {
    const seen = new Set<string>();
    const rimForts = listRimFortsPresentation(state);
    const rimFortMap = new Map<number, RimFort>();
    for (const f of rimForts) {
      rimFortMap.set(rimWalkIndex(f.x, f.y), f);
    }

    for (const b of state.buildings) {
      seen.add(b.id);
      let g = buildingGraphics.get(b.id);
      if (!g) {
        g = new Graphics();
        buildingGraphics.set(b.id, g);
        entitiesLayer.addChild(g);
      }

      const complete = b.completesAtTick === null;
      const gx = ((b.x % GRID_W) + GRID_W) % GRID_W;
      const gy = ((b.y % GRID_H) + GRID_H) % GRID_H;
      const { wx, wy } = gridToWorld(gx, gy);

      g.x = wx;
      g.y = wy;
      g.zIndex = Math.floor((gx + gy) * 100) + 50;

      let rimNeighbors: RimNeighbors | undefined;
      if (isRimTile(gx, gy) && (b.typeId === "walls" || b.typeId === "gate")) {
        const idx = rimWalkIndex(gx, gy);
        const prevIdx = (idx - 1 + 48) % 48;
        const nextIdx = (idx + 1) % 48;
        const prevFort = rimFortMap.get(prevIdx);
        const nextFort = rimFortMap.get(nextIdx);
        rimNeighbors = {
          hasPrev: prevFort != null,
          hasNext: nextFort != null,
          prevKind: prevFort?.kind,
          nextKind: nextFort?.kind,
        };
      }

      const cultId = state && sim.playerCultureId ? sim.playerCultureId(state) : undefined;
      drawIsometricBuilding(g, b.typeId, b.level, complete, t + gx * 0.35, visuals, gx, gy, rimNeighbors, cultId);
    }

    for (const [id, g] of buildingGraphics) {
      if (!seen.has(id)) {
        entitiesLayer.removeChild(g);
        g.destroy();
        buildingGraphics.delete(id);
      }
    }
  }

  function sync(state: GameState): void {
    lastState = state;
    const season = currentSeason(state);
    if (season !== currentSeasonName) {
      currentSeasonName = season;
      visuals = getThemeVisuals(currentSeasonName, currentHolidayId);
      paintIsometricGround(groundLayer, visuals);
      paintAmbientLighting();
      paintBoardBackdrop(boardBackdropLayer, visuals);
    }
    paintBuildings(state, phase);
    paintBoardProvinces(boardProvincesLayer, state, phase);
    paintBoardMarches(boardRoutesLayer, boardPawnsLayer, state, phase);
    if (hoveredProvinceCoord) {
      paintBoardHighlight(boardHighlightLayer, hoveredProvinceCoord.bx, hoveredProvinceCoord.by, state);
    }
  }

  function setTheme(themeId: string, holidayId: string): void {
    currentHolidayId = holidayId;
    visuals = getThemeVisuals(currentSeasonName, holidayId);
    paintIsometricGround(groundLayer, visuals);
    paintAmbientLighting();
    paintBoardBackdrop(boardBackdropLayer, visuals);
    if (lastState) {
      paintBuildings(lastState, phase);
      paintBoardProvinces(boardProvincesLayer, lastState, phase);
      paintBoardMarches(boardRoutesLayer, boardPawnsLayer, lastState, phase);
    }
  }

  let lastTickTime = performance.now();

  app.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTickTime) / 1000);
    lastTickTime = now;

    phase += dt * 2.5;

    if (currentBand === "hold") {
      updateWalkers(dt, lastState);
      updateFog(phase);
      updateParticles(phase);
      if (lastState) {
        paintBuildings(lastState, phase);
      }
    } else {
      if (lastState) {
        paintBoardMarches(boardRoutesLayer, boardPawnsLayer, lastState, phase);
      }
    }
  });

  return {
    sync,
    setTheme,
    destroy() {
      app.destroy(true);
      buildingGraphics.clear();
      walkers.length = 0;
    },
    onTileClick(cb) {
      clickCb = cb;
    },
    onProvinceClick(cb) {
      provinceClickCb = cb;
    },
    zoomIn() {
      setZoomCentered(zoom * 1.25, CANVAS_W / 2, CANVAS_H / 2);
    },
    zoomOut() {
      setZoomCentered(zoom * 0.8, CANVAS_W / 2, CANVAS_H / 2);
    },
    resetView() {
      if (currentBand === "hold") {
        zoom = HOLD_DEFAULT_ZOOM;
      } else {
        zoom = BOARD_DEFAULT_ZOOM;
      }
      panX = 0;
      panY = 0;
      applyTransform();
    },
    getBand() {
      return currentBand;
    },
    setBand(band: CameraBand) {
      setBand(band);
    },
    onBandChange(cb) {
      bandChangeCb = cb;
    },
  };
}

