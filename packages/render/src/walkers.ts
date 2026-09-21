import { Graphics } from "pixi.js";
import type { GameState } from "@second-crown/shared";
import * as sim from "@second-crown/sim";
import { GRID_W, GRID_H } from "./tiles.js";
import { type CultureKit, resolveCultureKit, culturePalette, type CultureVisualPalette } from "./buildings.js";

export type WalkerRole = "villager" | "woodcutter" | "miner" | "merchant" | "guard" | "scholar";

export interface Walker {
  id: number;
  role: WalkerRole;
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

export function pickDestination(w: Walker, state: GameState | null): void {
  const playerWorkers = state?.citizens?.filter(
    (c) => c.realmId === "player" && c.tile != null
  ) ?? [];

  if (playerWorkers.length > 0) {
    const worker = playerWorkers[w.id % playerWorkers.length];
    w.role = roleForCitizenJob(worker.job);

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
    } else {
      w.targetX = 6 + Math.floor(Math.random() * 4);
      w.targetY = 3 + Math.floor(Math.random() * 3);
    }
  }
  w.state = "walking";
  w.facing = w.targetX >= w.x ? 1 : -1;
}

export function createWalker(id: number, gx: number, gy: number): Walker {
  const roles: WalkerRole[] = ["villager", "woodcutter", "miner", "merchant", "guard", "scholar"];
  const role = roles[id % roles.length];
  const g = new Graphics();
  return {
    id,
    role,
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

export function drawCultureWalker(
  g: Graphics,
  role: "villager" | "guard",
  facing: number,
  frame: 0 | 1 | 2,
  kit: CultureKit,
  cult: CultureVisualPalette,
  bob: number,
  legL: number,
  legR: number,
  armSwing: number
): void {
  if (kit === "cedar") {
    // Cedar Kin: Woodland Walker Cloaks
    if (role === "villager") {
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x5c3818 });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x3f220c });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0x14532d });

      // Trailing woodland cloak behind
      g.poly([
        -facing * 2.5, -8 - bob,
        -facing * 6, -3 - bob + (frame === 1 ? 1 : 0),
        -facing * 2, -2 - bob
      ]);
      g.fill({ color: 0x166534 });

      // Shoulder mantle
      g.rect(-3.5, -9 - bob, 7, 3); g.fill({ color: 0x166534 });

      g.circle(0, -11 - bob, 2.8); g.fill({ color: 0xfbcfe8 });

      // Woodland hood
      g.rect(-3, -14 - bob, 6, 3.5); g.fill({ color: 0x14532d });

      // Woven birch-bark foraging basket with herbs
      g.rect(facing * 3 - 1, -7 - bob + armSwing, 3.5, 3.5);
      g.fill({ color: 0xd4a359 });
      g.circle(facing * 3 + 0.5, -7.5 - bob + armSwing, 1.2);
      g.fill({ color: 0xef4444 });
    } else {
      // Guard: Woodland warrior with travel cloak, leather coif, shield, hunting spear
      g.rect(legL, -3 - bob, 2, 4); g.fill({ color: 0x3f220c });
      g.rect(legR, -3 - bob, 2, 4); g.fill({ color: 0x271406 });

      g.rect(-3, -8 - bob, 6, 6); g.fill({ color: 0x14532d });

      // Trailing woodland travel cloak
      g.poly([
        -facing * 2.5, -8 - bob,
        -facing * 6.5, -1 - bob + (frame === 1 ? 1 : 0),
        -facing * 2, 0 - bob
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
        facing * 3 + 2, -14 - bob + armSwing
      ]);
      g.fill({ color: 0xe2e8f0 });
    }
  } else if (kit === "sand") {
    // Sand Banner: Linen/Sash Walkers
    if (role === "villager") {
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

      // Terracotta water amphora
      g.ellipse(facing * 3, -7 - bob + armSwing, 2, 3);
      g.fill({ color: 0xc2410c });
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
        facing * 3, -14 - bob + armSwing
      ]);
      g.fill({ color: 0xb45309 });
    }
  } else if (kit === "steppe") {
    // Wind Host: Coat-and-Sash Walkers
    if (role === "villager") {
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

      g.rect(facing * 3 - 1, -7 - bob + armSwing, 3.5, 3);
      g.fill({ color: 0xca8a04 });
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
        facing * 3 + 1.5, -15 - bob + armSwing
      ]);
      g.fill({ color: 0xf1f5f9 });
    }
  } else {
    // Tide Clans: Sailcloth Walkers
    if (role === "villager") {
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

      g.rect(facing * 3 - 1, -7 - bob + armSwing, 3.5, 3.5);
      g.fill({ color: 0xa16207 });
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
        facing * 3 + 2, -18 - bob + armSwing
      ]);
      g.stroke({ width: 1, color: 0xcbd5e1 });
    }
  }
}

/**
 * Renders an authentic 2-3 frame pixel walker sprite.
 * Frame 0: Planted / Neutral (legs together, tool at side, bob 0)
 * Frame 1: Left Step (left leg forward, right leg back, bob 1px)
 * Frame 2: Right Step (right leg forward, left leg back, bob 1px)
 */
export function drawWalkerFrame(
  g: Graphics,
  role: Walker["role"],
  facing: number,
  frame: 0 | 1 | 2,
  cultureId?: string
): void {
  g.clear();

  // Ground contact shadow
  g.ellipse(0, 1, 4.5, 2.2);
  g.fill({ color: 0x000000, alpha: 0.28 });

  // Integer pixel offsets for authentic 2-3 frame animation
  const bob = frame === 0 ? 0 : 1;
  const legL = frame === 1 ? -2 : (frame === 2 ? 1 : -1);
  const legR = frame === 1 ? 1 : (frame === 2 ? -2 : 1);
  const armSwing = frame === 1 ? -1 : (frame === 2 ? 1 : 0);

  const kit = resolveCultureKit(cultureId);
  const cult = culturePalette(cultureId);
  const isDefaultCulture = kit === "western";

  // Culture-specific silhouette rendering for villager and guard
  if (!isDefaultCulture && (role === "villager" || role === "guard")) {
    drawCultureWalker(g, role, facing, frame, kit, cult, bob, legL, legR, armSwing);
    return;
  }

  // Boots / legs
  g.rect(legL, -3 - bob, 2, 4);
  g.fill({ color: 0x27272a });
  g.rect(legR, -3 - bob, 2, 4);
  g.fill({ color: 0x18181b });

  // Tunic & clothing colors by role (tinted by culture when not default western)
  let tunicColor = 0x854d0e;
  let toolColor: number | null = null;
  const toolHandleColor = isDefaultCulture ? 0x78350f : cult.timber;
  const guardPennant = isDefaultCulture ? 0xdc2626 : cult.tabard;

  if (role === "villager") tunicColor = isDefaultCulture ? 0xb45309 : cult.tabard;
  else if (role === "woodcutter") { tunicColor = 0x15803d; toolColor = 0xd1d5db; }
  else if (role === "miner") { tunicColor = isDefaultCulture ? 0x52525b : cult.stone; toolColor = 0x71717a; }
  else if (role === "merchant") tunicColor = 0xb91c1c;
  else if (role === "guard") tunicColor = isDefaultCulture ? 0x1e3a8a : cult.tabard;
  else if (role === "scholar") tunicColor = 0x6b21a8;

  // Torso / Tunic
  g.rect(-3, -8 - bob, 6, 6);
  g.fill({ color: tunicColor });

  // Head
  g.circle(0, -11 - bob, 2.8);
  g.fill({ color: 0xfbcfe8 }); // Skin tone

  // Headwear / Hair
  if (role === "guard") {
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
  if (toolColor) {
    // Woodsman axe / miner pickaxe
    g.rect(facing * 3, -9 - bob + armSwing, 1.5, 6);
    g.fill({ color: toolHandleColor });
    g.rect(facing * 3 - 1, -10 - bob + armSwing, 3.5, 2);
    g.fill({ color: toolColor });
  } else if (role === "guard") {
    // Spear with waving pennant
    g.moveTo(facing * 3, 0 - bob); g.lineTo(facing * 3, -17 - bob + armSwing);
    g.stroke({ width: 1.2, color: toolHandleColor });
    g.poly([
      facing * 3, -17 - bob + armSwing,
      facing * 3 + facing * 4, -15 - bob + armSwing,
      facing * 3, -13 - bob + armSwing,
    ]);
    g.fill({ color: guardPennant });
  } else if (role === "villager") {
    // Wicker bread basket
    g.rect(facing * 3 - 1, -7 - bob + armSwing, 3, 3);
    g.fill({ color: 0xd4a359 });
  } else if (role === "scholar") {
    // Parchment scroll
    g.rect(facing * 2.5, -7 - bob + armSwing, 2, 4);
    g.fill({ color: 0xfef3c7 });
  }
}

