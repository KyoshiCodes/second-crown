import { Graphics } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import * as sim from "@second-crown/sim";
import { GRID_W, GRID_H } from "./tiles.js";
import { type CultureKit, resolveCultureKit, culturePalette, type CultureVisualPalette } from "./buildings.js";

export type WalkerRole =
  | "villager"
  | "woodcutter"
  | "miner"
  | "merchant"
  | "guard"
  | "scholar"
  | "farm"
  | "wood"
  | "stone"
  | "gold"
  | "farmer";

export type WalkerJobTool = "farm" | "wood" | "stone" | "gold";

export interface Walker {
  id: number;
  role: WalkerRole;
  tool?: WalkerJobTool;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: "walking" | "idle";
  idleTime: number;
  speed: number;
  facing: number; // -1 for left, 1 for right
  walkDist: number;
  idlePhase: number;
  graphics: Graphics;
}

export function roleForCitizenJob(job: string): WalkerRole {
  switch (job) {
    case "farmer":
      return "villager";
    case "woodcutter":
      return "woodcutter";
    case "miner":
      return "miner";
    case "merchant":
      return "merchant";
    case "guard":
      return "guard";
    case "scholar":
      return "scholar";
    default:
      return "villager";
  }
}

/**
 * Maps a citizen job and building tile to one of the 4 core hold resource tools:
 * farm (pitchfork / wheat sheaf), wood (broadaxe / timber), stone (quarry pick / ashlar), gold (prospector pick / gold pan).
 */
export function toolForCitizen(
  job: string,
  buildingTypeId?: string,
  walkerId: number = 0
): WalkerJobTool {
  if (buildingTypeId === "gold_mine" || buildingTypeId === "mint") return "gold";
  if (buildingTypeId === "quarry" || buildingTypeId === "mason") return "stone";
  if (buildingTypeId === "lumber_camp" || buildingTypeId === "sawmill") return "wood";
  if (buildingTypeId === "farm" || buildingTypeId === "granary") return "farm";

  if (job === "farmer" || job === "farm") return "farm";
  if (job === "woodcutter" || job === "wood") return "wood";
  if (job === "gold" || job === "gold_miner") return "gold";
  if (job === "stone" || job === "stone_cutter") return "stone";
  if (job === "miner") return Math.abs(walkerId) % 2 === 1 ? "gold" : "stone";
  if (job === "merchant") return "gold";

  const cycle: WalkerJobTool[] = ["farm", "wood", "stone", "gold"];
  return cycle[Math.abs(walkerId) % cycle.length];
}

export function resolveWalkerTool(
  role: WalkerRole,
  explicitTool?: WalkerJobTool
): WalkerJobTool | null {
  if (explicitTool) return explicitTool;
  if (role === "farm" || role === "farmer") return "farm";
  if (role === "wood" || role === "woodcutter") return "wood";
  if (role === "stone") return "stone";
  if (role === "gold") return "gold";
  if (role === "villager") return "farm";
  if (role === "miner") return "stone";
  return null;
}

export function pickDestination(w: Walker, state: GameState | null): void {
  const playerWorkers = state?.citizens?.filter(
    (c) => c.realmId === "player" && c.tile != null
  ) ?? [];

  if (playerWorkers.length > 0) {
    const worker = playerWorkers[w.id % playerWorkers.length];
    w.role = roleForCitizenJob(worker.job);

    const b = state?.buildings?.find(
      (bld) => bld.x === worker.tile!.x && bld.y === worker.tile!.y
    );
    w.tool = toolForCitizen(worker.job, b?.typeId, w.id);

    const tx = ((worker.tile!.x % GRID_W) + GRID_W) % GRID_W;
    const ty = ((worker.tile!.y % GRID_H) + GRID_H) % GRID_H;

    const dist = Math.hypot(w.x - tx, w.y - ty);
    if (dist > 0.4) {
      w.targetX = tx;
      w.targetY = ty;
    } else {
      // Small pacing near work tile so the walker stays active at their post
      const ox = (Math.random() - 0.5) * 0.7;
      const oy = (Math.random() - 0.5) * 0.7;
      w.targetX = Math.max(0, Math.min(GRID_W - 1, tx + ox));
      w.targetY = Math.max(0, Math.min(GRID_H - 1, ty + oy));
    }
  } else {
    if (state && state.buildings.length > 0 && Math.random() > 0.25) {
      const b = state.buildings[Math.floor(Math.random() * state.buildings.length)];
      const bx = ((b.x % GRID_W) + GRID_W) % GRID_W;
      const by = ((b.y % GRID_H) + GRID_H) % GRID_H;
      w.targetX = Math.max(0, Math.min(GRID_W - 1, bx + (Math.random() > 0.5 ? 1 : -1)));
      w.targetY = Math.max(0, Math.min(GRID_H - 1, by));
      if (b.typeId === "farm" || b.typeId === "granary") w.tool = "farm";
      else if (b.typeId === "lumber_camp" || b.typeId === "sawmill") w.tool = "wood";
      else if (b.typeId === "quarry" || b.typeId === "mason") w.tool = "stone";
      else if (b.typeId === "gold_mine" || b.typeId === "mint") w.tool = "gold";
    } else {
      w.targetX = 6 + Math.floor(Math.random() * 4);
      w.targetY = 3 + Math.floor(Math.random() * 3);
    }
  }
  w.state = "walking";
  w.facing = w.targetX >= w.x ? 1 : -1;
}

export function createWalker(id: number, gx: number, gy: number): Walker {
  const tools: WalkerJobTool[] = ["farm", "wood", "stone", "gold"];
  const tool = tools[Math.abs(id) % tools.length];
  const roleForTool: Record<WalkerJobTool, WalkerRole> = {
    farm: "villager",
    wood: "woodcutter",
    stone: "miner",
    gold: "miner",
  };
  const role = roleForTool[tool];
  const g = new Graphics();
  return {
    id,
    role,
    tool,
    x: gx + (Math.random() * 0.4 - 0.2),
    y: gy + (Math.random() * 0.4 - 0.2),
    targetX: gx,
    targetY: gy,
    state: "idle",
    idleTime: 1.5 + Math.random() * 3,
    speed: 0.65 + Math.random() * 0.35,
    facing: Math.random() > 0.5 ? 1 : -1,
    walkDist: 0,
    idlePhase: Math.random() * 10,
    graphics: g,
  };
}

/**
 * Draws one of the 4 iconic pixel job tools (farm, wood, stone, gold)
 * with animated 2-3 frame arm motion and tool physics.
 */
export function drawJobTool(
  g: Graphics,
  tool: WalkerJobTool,
  facing: number,
  frame: 0 | 1 | 2,
  bob: number,
  armSwing: number,
  timberColor: number,
  stoneColor: number
): void {
  const handX = facing * 3;
  const toolTilt = armSwing * facing;

  if (tool === "farm") {
    // 3-Tined Forged Iron Farm Pitchfork
    const forkTopY = -15 - bob + armSwing * 2;
    const forkBaseY = 0 - bob;
    // Ash handle
    g.moveTo(handX, forkBaseY);
    g.lineTo(handX + toolTilt * 0.8, forkTopY);
    g.stroke({ width: 1.2, color: timberColor });

    // Forged crossbar ferrule
    const barX = handX + toolTilt * 0.8;
    const barY = forkTopY;
    g.rect(barX - 2.5, barY - 1, 5, 1.4);
    g.fill({ color: 0x64748b });

    // 3 sharp tines tilting with the stride
    g.moveTo(barX, barY);
    g.lineTo(barX + toolTilt * 0.5, barY - 4);
    g.stroke({ width: 1, color: 0xe2e8f0 });

    g.moveTo(barX + facing * 2, barY);
    g.lineTo(barX + facing * 2.5 + toolTilt * 0.5, barY - 3.5);
    g.stroke({ width: 1, color: frame === 1 ? 0xffffff : 0xcbd5e1 });

    g.moveTo(barX - facing * 2, barY);
    g.lineTo(barX - facing * 2.5 + toolTilt * 0.5, barY - 3.5);
    g.stroke({ width: 1, color: 0x94a3b8 });

    // Off-hand / Hip: Golden Harvest Sheaf of Wheat
    const sheafX = -facing * 3;
    const sheafY = -6 - bob + armSwing * 0.5;
    g.ellipse(sheafX, sheafY, 2.4, 3.6);
    g.fill({ color: 0xf59e0b });
    g.circle(sheafX - 0.8, sheafY - 3, 1.2);
    g.fill({ color: 0xfacc15 });
    g.circle(sheafX + 0.8, sheafY - 3.2, 1.1);
    g.fill({ color: 0xfef08a });
    g.rect(sheafX - 1.8, sheafY - 0.5, 3.6, 1.2);
    g.fill({ color: 0x78350f });
  } else if (tool === "wood") {
    // Heavy Felling Broadaxe
    const axeTopY = -13 - bob + armSwing * 2;
    const axeBaseY = 0 - bob;
    g.moveTo(handX, axeBaseY);
    g.lineTo(handX + toolTilt, axeTopY);
    g.stroke({ width: 1.4, color: timberColor });

    const hx = handX + toolTilt;
    const hy = axeTopY;
    // Bearded Iron Blade
    g.poly([
      hx - facing * 1, hy - 3.5,
      hx + facing * 4.5, hy - 2,
      hx + facing * 4, hy + 3,
      hx, hy + 1.5,
    ]);
    g.fill({ color: 0x475569 });

    // Specular Steel Razor Cutting Edge
    g.moveTo(hx + facing * 4.5, hy - 2);
    g.lineTo(hx + facing * 4, hy + 3);
    g.stroke({ width: 1.2, color: frame === 1 ? 0xffffff : 0xe2e8f0 });

    // Off-shoulder: Rough Pine Timber Log
    const logX = -facing * 3;
    const logY = -9 - bob;
    g.rect(logX - 2.5, logY - 1.5, 5, 3);
    g.fill({ color: 0x713f12 });
    const endX = facing > 0 ? logX - 2.5 : logX + 2.5;
    g.ellipse(endX, logY, 1.2, 1.8);
    g.fill({ color: 0xd4a359 });
    g.circle(endX, logY, 0.6);
    g.fill({ color: 0x451a03 });
  } else if (tool === "stone") {
    // Double-Pointed Heavy Quarry Pickaxe
    const pickTopY = -13 - bob + armSwing * 2;
    const pickBaseY = 0 - bob;
    g.moveTo(handX, pickBaseY);
    g.lineTo(handX + toolTilt, pickTopY);
    g.stroke({ width: 1.5, color: timberColor });

    const px = handX + toolTilt;
    const py = pickTopY;
    g.rect(px - 3.5, py - 1, 7, 2.2);
    g.fill({ color: 0x475569 });
    g.circle(px, py + 0.1, 1.6);
    g.fill({ color: 0x1e293b });

    // Forward Piercing Spike
    g.poly([
      px + facing * 3, py - 1,
      px + facing * 6, py + 1.2,
      px + facing * 3, py + 1.2,
    ]);
    g.fill({ color: 0x94a3b8 });
    g.circle(px + facing * 6, py + 1.2, 0.8);
    g.fill({ color: frame === 1 ? 0xffffff : 0xf1f5f9 });

    // Rear Chisel Wedge Striker
    g.poly([
      px - facing * 3, py - 1,
      px - facing * 4.5, py - 0.2,
      px - facing * 3, py + 1,
    ]);
    g.fill({ color: 0x64748b });

    // Off-hand: Carved Ashlar Granite Block
    const stoneX = -facing * 3;
    const stoneY = -6 - bob + armSwing * 0.4;
    g.rect(stoneX - 2, stoneY - 2, 4, 4);
    g.fill({ color: stoneColor });
    g.moveTo(stoneX - 2, stoneY - 2);
    g.lineTo(stoneX + 2, stoneY - 2);
    g.stroke({ width: 0.8, color: 0xcbd5e1 });
    g.moveTo(stoneX - 2, stoneY + 2);
    g.lineTo(stoneX + 2, stoneY + 2);
    g.stroke({ width: 0.8, color: 0x1e293b });
  } else if (tool === "gold") {
    // Gilded Prospector's Pickaxe
    const goldTopY = -13 - bob + armSwing * 2;
    const goldBaseY = 0 - bob;
    g.moveTo(handX, goldBaseY);
    g.lineTo(handX + toolTilt, goldTopY);
    g.stroke({ width: 1.3, color: 0x7c2d12 });

    const gx = handX + toolTilt;
    const gy = goldTopY;
    g.rect(gx - 3, gy - 1, 6, 2);
    g.fill({ color: 0xd97706 });
    g.poly([
      gx - 2.5, gy - 1,
      gx + facing * 4.5, gy + 1,
      gx - 2.5, gy + 1,
    ]);
    g.fill({ color: 0xfacc15 });
    g.circle(gx + facing * 4.5, gy + 1, 1);
    g.fill({ color: frame === 2 ? 0xffffff : 0xfef08a });

    // Off-hand: Iron Gold Pan with Sparkling Bullion & Nuggets
    const panX = -facing * 3;
    const panY = -6 - bob + armSwing * 0.5;
    g.ellipse(panX, panY, 3.2, 1.8);
    g.fill({ color: 0x334155 });
    g.ellipse(panX, panY - 0.6, 2.4, 1.3);
    g.fill({ color: 0xfacc15 });
    g.rect(panX - 1.2, panY - 2, 2.4, 1.4);
    g.fill({ color: 0xfef08a });

    // 2-3 Frame Animated Specular Twinkle Star
    const twX = frame === 1 ? panX + 1.2 : (frame === 2 ? panX - 1.2 : panX);
    const twY = frame === 1 ? panY - 2.8 : (frame === 2 ? panY - 1.6 : panY - 2.2);
    g.poly([
      twX, twY - 2,
      twX + 1.2, twY,
      twX, twY + 2,
      twX - 1.2, twY,
    ]);
    g.fill({ color: 0xfffbeb });
    g.circle(twX, twY, 0.8);
    g.fill({ color: 0xffffff });
  }
}

export function drawCultureWalker(
  g: Graphics,
  role: WalkerRole,
  facing: number,
  frame: 0 | 1 | 2,
  kit: CultureKit,
  cult: CultureVisualPalette,
  bob: number,
  legL: number,
  legR: number,
  armSwing: number,
  tool?: WalkerJobTool
): void {
  if (kit === "cedar") {
    // Cedar Kin: Woodland Walker Cloaks
    if (role !== "guard") {
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x5c3818 });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x3f220c });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0x14532d });

      // Trailing woodland cloak behind
      g.poly([
        -facing * 2.5, -8 - bob,
        -facing * 6, -3 - bob + (frame === 1 ? 1 : 0),
        -facing * 2, -2 - bob,
      ]);
      g.fill({ color: 0x166534 });

      // Shoulder mantle
      g.rect(-3.5, -9 - bob, 7, 3); g.fill({ color: 0x166534 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      // Woodland hood
      g.rect(-3, -14 - bob, 6, 3.5); g.fill({ color: 0x14532d });

      if (tool) {
        drawJobTool(g, tool, facing, frame, bob, armSwing, cult.timber, cult.stone);
      } else {
        // Woven birch-bark foraging basket with herbs
        g.rect(facing * 3 - 1, -7 - bob + armSwing, 3.5, 3.5);
        g.fill({ color: 0xd4a359 });
        g.circle(facing * 3 + 0.5, -7.5 - bob + armSwing, 1.2);
        g.fill({ color: 0xef4444 });
      }
    } else {
      // Guard: Woodland warrior with travel cloak, leather coif, shield, hunting spear
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x3f220c });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x271406 });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0x14532d });

      // Trailing woodland travel cloak
      g.poly([
        -facing * 2.5, -8 - bob,
        -facing * 6.5, -1 - bob + (frame === 1 ? 1 : 0),
        -facing * 2, 0 - bob,
      ]);
      g.fill({ color: 0x166534 });

      g.rect(-3.5, -9 - bob, 7, 3); g.fill({ color: 0x166534 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.rect(-3, -14 - bob, 6, 3); g.fill({ color: 0x5c3818 });
      g.rect(-1, -15 - bob, 2, 1.5); g.fill({ color: 0xfef3c7 });

      // Carved round cedar war shield on off-arm
      g.circle(-facing * 3, -6 - bob + armSwing, 3.5);
      g.fill({ color: 0x854d0e });
      g.stroke({ width: 0.8, color: 0xca8a04 });

      // Heavy ash hunting spear with leaf head
      g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -17 - bob + armSwing);
      g.stroke({ width: 1.4, color: 0x78350f });
      g.poly([
        facing * 3, -17 - bob + armSwing,
        facing * 3 - 2, -14 - bob + armSwing,
        facing * 3 + 2, -14 - bob + armSwing,
      ]);
      g.fill({ color: 0xe2e8f0 });
    }
  } else if (kit === "sand") {
    // Sand Banner: Linen/Sash Walkers
    if (role !== "guard") {
      g.rect(legL, -2 - bob, 2, 3); g.fill({ color: 0xa16207 });
      g.rect(legR, -2 - bob, 2, 3); g.fill({ color: 0x78350f });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0xd6c7a1 });

      // Bright crimson waist sash with trailing tails
      g.rect(-3.5, -6 - bob, 7, 2); g.fill({ color: 0xb45309 });
      g.rect(-facing * 1.5, -4 - bob, 2, 4 + (frame === 1 ? 1 : 0));
      g.fill({ color: 0xf59e0b });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      // Draped linen headcloth (keffiyeh) with agal cord
      g.rect(-3.5, -14 - bob, 7, 4.5); g.fill({ color: 0xfef3c7 });
      g.rect(-3.5, -13 - bob, 7, 1); g.fill({ color: 0x18181b });
      g.rect(-facing * 3, -12 - bob, 2.5, 5); g.fill({ color: 0xfef3c7 });

      if (tool) {
        drawJobTool(g, tool, facing, frame, bob, armSwing, cult.timber, cult.stone);
      } else {
        // Terracotta water amphora
        g.ellipse(facing * 3, -7 - bob + armSwing, 2, 3);
        g.fill({ color: 0xc2410c });
      }
    } else {
      // Sand Guard: Desert turban with havelock, sand tunic with crimson sash, brass buckler, slender lance
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x78350f });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x5c3818 });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0xd6c7a1 });
      g.rect(-3.5, -6 - bob, 7, 2.2); g.fill({ color: 0xb45309 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.rect(-3.5, -14 - bob, 7, 3.5); g.fill({ color: 0xfef08a });
      g.rect(-facing * 3, -12 - bob, 2.5, 6); g.fill({ color: 0xfde047 });

      g.circle(-facing * 3, -6 - bob + armSwing, 3.5);
      g.fill({ color: 0xf59e0b });
      g.stroke({ width: 0.8, color: 0xfacc15 });

      g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -18 - bob + armSwing);
      g.stroke({ width: 1.2, color: 0xa16207 });
      g.poly([
        facing * 3, -18 - bob + armSwing,
        facing * 3 + facing * 4, -16 - bob + armSwing,
        facing * 3, -14 - bob + armSwing,
      ]);
      g.fill({ color: 0xb45309 });
    }
  } else if (kit === "steppe") {
    // Wind Host: Coat-and-Sash Walkers
    if (role !== "guard") {
      g.rect(legL, -3 - bob, 2.5, 4); g.fill({ color: 0x451a03 });
      g.rect(legR, -3 - bob, 2.5, 4); g.fill({ color: 0x271406 });

      g.rect(-3.5, -9 - bob, 7, 7); g.fill({ color: 0x9f1239 });
      g.moveTo(-3.5, -9 - bob); g.lineTo(0, -5 - bob);
      g.stroke({ width: 1, color: 0xca8a04 });

      g.rect(-3.5, -6 - bob, 7, 2.2); g.fill({ color: 0xca8a04 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.rect(-3.5, -13 - bob, 7, 2); g.fill({ color: 0x78350f });
      g.poly([-3, -13 - bob, 0, -17 - bob, 3, -13 - bob]);
      g.fill({ color: 0xf1f5f9 });

      if (tool) {
        drawJobTool(g, tool, facing, frame, bob, armSwing, cult.timber, cult.stone);
      } else {
        g.rect(facing * 3 - 1, -7 - bob + armSwing, 3.5, 3);
        g.fill({ color: 0xca8a04 });
      }
    } else {
      // Steppe Guard: Nomad coat with sash, pointed steel helmet with horsehair plume, shield, lance
      g.rect(legL, -3 - bob, 2.5, 4); g.fill({ color: 0x451a03 });
      g.rect(legR, -3 - bob, 2.5, 4); g.fill({ color: 0x271406 });

      g.rect(-3.5, -9 - bob, 7, 7); g.fill({ color: 0x9f1239 });
      g.rect(-3.5, -6 - bob, 7, 2.2); g.fill({ color: 0xca8a04 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.poly([-3, -13 - bob, 0, -17 - bob, 3, -13 - bob]);
      g.fill({ color: 0xcbd5e1 });
      g.moveTo(0, -17 - bob); g.lineTo(0, -20 - bob);
      g.stroke({ width: 1.4, color: 0x9f1239 });

      g.circle(-facing * 3, -6 - bob + armSwing, 3.5);
      g.fill({ color: 0x57534e });
      g.stroke({ width: 0.8, color: 0xca8a04 });

      g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -18 - bob + armSwing);
      g.stroke({ width: 1.4, color: 0x7c2d12 });
      g.circle(facing * 3, -15 - bob + armSwing, 1.4);
      g.fill({ color: 0x18181b });
      g.poly([
        facing * 3, -18 - bob + armSwing,
        facing * 3 - 1.5, -15 - bob + armSwing,
        facing * 3 + 1.5, -15 - bob + armSwing,
      ]);
      g.fill({ color: 0xf1f5f9 });
    }
  } else {
    // Tide Clans: Sailcloth Walkers
    if (role !== "guard") {
      g.rect(legL, -3 - bob, 2, 3); g.fill({ color: 0x0e7490 });
      g.rect(legL, 0 - bob, 2, 1); g.fill({ color: 0xfbcfe8 });
      g.rect(legR, -3 - bob, 2, 3); g.fill({ color: 0x155e75 });
      g.rect(legR, 0 - bob, 2, 1); g.fill({ color: 0xfbcfe8 });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0xe2e8f0 });
      g.moveTo(-3, -5 - bob); g.lineTo(3, -5 - bob);
      g.stroke({ width: 1.2, color: 0xa16207 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.ellipse(0, -13 - bob, 5.5, 1.8); g.fill({ color: 0xd4a359 });
      g.poly([-2.5, -13 - bob, 0, -16 - bob, 2.5, -13 - bob]);
      g.fill({ color: 0xb45309 });

      if (tool) {
        drawJobTool(g, tool, facing, frame, bob, armSwing, cult.timber, cult.stone);
      } else {
        g.rect(facing * 3 - 1, -7 - bob + armSwing, 3.5, 3.5);
        g.fill({ color: 0xa16207 });
      }
    } else {
      // Tide Guard: Sailcloth warrior vest, reed war cap, turtle-shell buckler, barbed trident
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x44403c });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x271406 });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0x0e7490 });
      g.moveTo(-3, -8 - bob); g.lineTo(3, -2 - bob);
      g.stroke({ width: 1, color: 0x44403c });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      g.rect(-3, -14 - bob, 6, 3); g.fill({ color: 0x0e7490 });
      g.moveTo(-3, -13 - bob); g.lineTo(3, -13 - bob);
      g.stroke({ width: 0.8, color: 0xf8fafc });

      g.ellipse(-facing * 3, -6 - bob + armSwing, 3, 4);
      g.fill({ color: 0x44403c });
      g.stroke({ width: 0.8, color: 0x94a3b8 });

      g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -18 - bob + armSwing);
      g.stroke({ width: 1.4, color: 0x44403c });
      g.poly([
        facing * 3 - 2, -18 - bob + armSwing,
        facing * 3, -21 - bob + armSwing,
        facing * 3 + 2, -18 - bob + armSwing,
      ]);
      g.stroke({ width: 1, color: 0xcbd5e1 });
    }
  }
}

/**
 * Renders an authentic 2-3 frame pixel walker sprite with high-contrast job tools
 * (farm, wood, stone, gold) or culture/role gear.
 * Frame 0: Planted / Neutral (legs together, tool at side, bob 0)
 * Frame 1: Forward Step (front leg leads, rear leg trails, bob 1px, tool swings forward)
 * Frame 2: Opposite Step (rear leg leads, front leg trails, bob 1px, tool swings back & glints)
 */
export function drawWalkerFrame(
  g: Graphics,
  role: WalkerRole,
  facing: number,
  frame: 0 | 1 | 2,
  cultureId?: string,
  tool?: WalkerJobTool
): void {
  g.clear();

  // Ground contact shadow
  g.ellipse(0, 1, 4.5, 2.2);
  g.fill({ color: 0x000000, alpha: 0.28 });

  // Integer pixel offsets for authentic 2-3 frame animation
  const bob = frame === 0 ? 0 : 1;
  const legL = frame === 0 ? -1 : (frame === 1 ? (facing > 0 ? 1.8 : -2.2) : (facing > 0 ? -2.2 : 1.8));
  const legR = frame === 0 ? 1 : (frame === 1 ? (facing > 0 ? -2.2 : 1.8) : (facing > 0 ? 1.8 : -2.2));
  const armSwing = frame === 1 ? -1 : (frame === 2 ? 1 : 0);

  const kit = resolveCultureKit(cultureId);
  const cult = culturePalette(cultureId);
  const isDefaultCulture = kit === "western";
  const jobTool = resolveWalkerTool(role, tool);

  // Culture-specific silhouette rendering for non-western cultures
  if (!isDefaultCulture && (role === "villager" || role === "guard" || jobTool != null)) {
    drawCultureWalker(g, role, facing, frame, kit, cult, bob, legL, legR, armSwing, jobTool ?? undefined);
    return;
  }

  // Boots / legs (shadowed rear boot and highlighted front boot)
  g.rect(legR, -3 - bob, 2, 4);
  g.fill({ color: 0x18181b });
  g.rect(legL, -3 - bob, 2, 4);
  g.fill({ color: 0x27272a });

  // Tunic & clothing colors by job tool or role
  let tunicColor = 0x854d0e;
  const toolHandleColor = isDefaultCulture ? 0x78350f : cult.timber;
  const stoneMatColor = isDefaultCulture ? 0x64748b : cult.stone;
  const guardPennant = isDefaultCulture ? 0xdc2626 : cult.tabard;

  if (jobTool === "farm") {
    tunicColor = isDefaultCulture ? 0xb45309 : cult.tabard;
  } else if (jobTool === "wood") {
    tunicColor = 0x15803d;
  } else if (jobTool === "stone") {
    tunicColor = isDefaultCulture ? 0x475569 : cult.stone;
  } else if (jobTool === "gold") {
    tunicColor = 0x1e293b;
  } else if (role === "villager") {
    tunicColor = isDefaultCulture ? 0xb45309 : cult.tabard;
  } else if (role === "woodcutter") {
    tunicColor = 0x15803d;
  } else if (role === "miner") {
    tunicColor = isDefaultCulture ? 0x475569 : cult.stone;
  } else if (role === "merchant") {
    tunicColor = 0xb91c1c;
  } else if (role === "guard") {
    tunicColor = isDefaultCulture ? 0x1e3a8a : cult.tabard;
  } else if (role === "scholar") {
    tunicColor = 0x6b21a8;
  }

  // Torso / Tunic
  g.rect(-3, -8 - bob, 6, 6);
  g.fill({ color: tunicColor });

  // Special Torso Overlays (Apron, baldric, gold sash)
  if (jobTool === "wood") {
    // Leather shoulder baldric
    g.moveTo(-facing * 2.5, -8 - bob);
    g.lineTo(facing * 2.5, -3 - bob);
    g.stroke({ width: 1.2, color: 0x451a03 });
  } else if (jobTool === "stone") {
    // Heavy split-cowhide quarry mason apron
    g.rect(-2.5, -7 - bob, 5, 5);
    g.fill({ color: 0x78350f });
    g.rect(-1, -6.5 - bob, 2, 1.2);
    g.fill({ color: 0x94a3b8 });
  } else if (jobTool === "gold") {
    // Gold sash and buckle
    g.rect(-3.5, -6 - bob, 7, 1.8);
    g.fill({ color: 0xf59e0b });
    g.rect(-1, -6.5 - bob, 2, 2.5);
    g.fill({ color: 0xfacc15 });
    g.circle(0, -5.3 - bob, 0.6);
    g.fill({ color: 0xffffff });
  } else if (jobTool === "farm") {
    // Peasant waist twine
    g.rect(-3.5, -5 - bob, 7, 1.2);
    g.fill({ color: 0x78350f });
  }

  // Head (Skin tone)
  g.circle(0, -11 - bob, 2.8);
  g.fill({ color: 0xfbcfe8 });

  // Headwear / Hair
  if (jobTool === "farm") {
    // Peasant Wide-Brim Straw Hat
    g.ellipse(0, -13.5 - bob, 5.8, 2);
    g.fill({ color: 0xd4a359 });
    g.ellipse(0, -14 - bob, 5.2, 1.3);
    g.fill({ color: 0xfde047 });
    g.rect(-3, -14.5 - bob, 6, 1);
    g.fill({ color: 0x92400e });
    g.poly([-2.5, -14.5 - bob, 0, -17.5 - bob, 2.5, -14.5 - bob]);
    g.fill({ color: 0xfacc15 });
  } else if (jobTool === "wood") {
    // Forester Cap with Pheasant Feather
    g.poly([-3, -13 - bob, -facing * 2, -16.5 - bob, 3, -13 - bob]);
    g.fill({ color: 0x14532d });
    g.rect(-3.5, -14 - bob, 7, 1.8);
    g.fill({ color: 0x166534 });
    g.moveTo(-facing * 2, -14.5 - bob);
    g.lineTo(-facing * 5.5, -17 - bob);
    g.stroke({ width: 1.2, color: 0xef4444 });
    g.circle(-facing * 5.5, -17 - bob, 0.9);
    g.fill({ color: 0xf59e0b });
  } else if (jobTool === "stone") {
    // Quarryman Dust Cowl / Protective Hood
    g.rect(-3.5, -14 - bob, 7, 3.8);
    g.fill({ color: 0x334155 });
    g.rect(-3, -15 - bob, 6, 1.5);
    g.fill({ color: 0x1e293b });
  } else if (jobTool === "gold") {
    // Assayer Miner Forehead Reflector Lamp
    g.rect(-3, -13.5 - bob, 6, 1.5);
    g.fill({ color: 0x78350f });
    g.circle(facing * 1.8, -14 - bob, 1.5);
    g.fill({ color: 0xfacc15 });
    g.circle(facing * 1.8, -14 - bob, 0.8);
    g.fill({ color: 0xffffff });
  } else if (role === "guard") {
    g.rect(-3, -14 - bob, 6, 3);
    g.fill({ color: isDefaultCulture ? 0x94a3b8 : cult.stone }); // Helmet
  } else if (role === "scholar") {
    g.rect(-3, -13 - bob, 6, 2.5);
    g.fill({ color: 0x581c87 }); // Monk cowl
  } else {
    g.rect(-2.5, -13 - bob, 5, 2);
    g.fill({ color: 0x451a03 }); // Hair
  }

  // Carried Tools / Weapons with 2-3 frame arm motion
  if (jobTool) {
    drawJobTool(g, jobTool, facing, frame, bob, armSwing, toolHandleColor, stoneMatColor);
  } else if (role === "guard") {
    // Guard: Spear with waving pennant and round shield
    g.moveTo(facing * 3, 0 - bob);
    g.lineTo(facing * 3, -17 - bob + armSwing);
    g.stroke({ width: 1.2, color: toolHandleColor });
    g.poly([
      facing * 3, -17 - bob + armSwing,
      facing * 3 + facing * 4, -15 - bob + armSwing,
      facing * 3, -13 - bob + armSwing,
    ]);
    g.fill({ color: guardPennant });
    // Shield on off-arm
    g.circle(-facing * 3, -6 - bob + armSwing, 3.5);
    g.fill({ color: 0x475569 });
    g.stroke({ width: 0.8, color: 0x94a3b8 });
  } else if (role === "scholar") {
    // Parchment scroll
    g.rect(facing * 2.5, -7 - bob + armSwing, 2, 4);
    g.fill({ color: 0xfef3c7 });
  } else if (role === "merchant") {
    // Merchant gold balance scales
    g.moveTo(facing * 3, -5 - bob + armSwing);
    g.lineTo(facing * 3, -10 - bob + armSwing);
    g.stroke({ width: 1, color: 0xfacc15 });
    g.moveTo(facing * 3 - 2, -10 - bob + armSwing);
    g.lineTo(facing * 3 + 2, -10 - bob + armSwing);
    g.stroke({ width: 1, color: 0xfacc15 });
  } else {
    // Wicker bread basket fallback
    g.rect(facing * 3 - 1, -7 - bob + armSwing, 3, 3);
    g.fill({ color: 0xd4a359 });
  }
}
