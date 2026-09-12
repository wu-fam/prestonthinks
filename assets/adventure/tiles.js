import { TILE } from "./config.js";
import { circle, polygon } from "./draw.js";

export const TILES = {
  grass: { solid: false },
  path: { solid: false },
  stone: { solid: false },
  transition: { solid: false },
  tree: { solid: true, draw: drawTree },
  door: { solid: true, draw: drawDoor },
  water: { solid: true, draw: drawWater },
  crystal: { solid: true, draw: drawCrystal },
  puzzle: { solid: true, draw: drawPuzzleStone },
  bossWall: { solid: true, draw: drawBossWall },
  bossCore: { solid: true, draw: drawBossCore },
};

export function isSolidByDefault(type) {
  const tile = TILES[type];
  return tile ? tile.solid : true;
}

export function drawGround(ctx, px, py, type, theme) {
  const gx = Math.floor(px / TILE);
  const gy = Math.floor(py / TILE);
  const open = type === "path" || type === "transition" || type === "grass";

  if (theme === "boss") {
    ctx.fillStyle = open ? "#3a4a2e" : "#2a2a1e";
    ctx.fillRect(px, py, TILE, TILE);
    if (open && (gx + gy) % 3 === 0) {
      ctx.fillStyle = "#2e3e24";
      ctx.fillRect(px + 8, py + 12, 2, 4);
    }
    return;
  }

  if (theme === "caves") {
    const floor = type === "stone" || type === "transition";
    ctx.fillStyle = floor ? "#3a3a4a" : "#2a2a3a";
    ctx.fillRect(px, py, TILE, TILE);
    if (floor && (gx + gy) % 4 === 0) {
      ctx.fillStyle = "#333344";
      ctx.fillRect(px + 6, py + 10, 3, 3);
    }
    return;
  }

  if (type === "path" || type === "transition") {
    ctx.fillStyle = "#c9b47c";
    ctx.fillRect(px, py, TILE, TILE);
    if ((gx + gy) % 2 === 0) {
      ctx.fillStyle = "#b8a36c";
      ctx.fillRect(px + 6, py + 9, 3, 3);
      ctx.fillRect(px + 19, py + 23, 3, 3);
    }
    return;
  }

  ctx.fillStyle = "#5b8c3e";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#4d7a34";
  if ((gx + gy) % 3 === 0) {
    ctx.fillRect(px + 10, py + 14, 2, 5);
    ctx.fillRect(px + 22, py + 6, 2, 5);
  }
  if ((gx * 7 + gy * 13) % 5 === 0) {
    ctx.fillRect(px + 4, py + 22, 2, 4);
  }
}

function drawTree(ctx, px, py) {
  ctx.fillStyle = "#5c3a1e";
  ctx.fillRect(px + 13, py + 20, 6, 12);
  ctx.fillStyle = "#1e5c1e";
  circle(ctx, px + 16, py + 14, 13);
  ctx.fillStyle = "#2d7a2d";
  circle(ctx, px + 12, py + 11, 6);
}

function drawDoor(ctx, px, py) {
  ctx.fillStyle = "#555";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#6b4423";
  ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
  ctx.fillStyle = "#ffd700";
  circle(ctx, px + 16, py + 18, 4);
  ctx.fillRect(px + 14, py + 18, 4, 6);
}

function drawWater(ctx, px, py, env) {
  ctx.fillStyle = "#3b7dd8";
  ctx.fillRect(px, py, TILE, TILE);
  const shimmer = Math.sin(env.time / 800 + px * 0.1) * 0.15;
  ctx.fillStyle = "rgba(150, 210, 255, " + (0.3 + shimmer) + ")";
  ctx.fillRect(px + 4, py + 10, 12, 2);
  ctx.fillRect(px + 14, py + 20, 10, 2);
}

function drawCrystal(ctx, px, py, env) {
  ctx.fillStyle = "#2a2a4a";
  ctx.fillRect(px, py, TILE, TILE);
  const glow = 0.4 + Math.sin(env.time / 1000 + px * 0.05 + py * 0.07) * 0.2;
  ctx.fillStyle = "rgba(120, 80, 220, " + glow + ")";
  polygon(ctx, [
    [px + 16, py + 4],
    [px + 26, py + 16],
    [px + 16, py + 28],
    [px + 6, py + 16],
  ]);
  ctx.fillStyle = "rgba(180, 140, 255, " + glow * 0.6 + ")";
  polygon(ctx, [
    [px + 16, py + 8],
    [px + 22, py + 16],
    [px + 16, py + 24],
    [px + 10, py + 16],
  ]);
}

function drawPuzzleStone(ctx, px, py) {
  ctx.fillStyle = "#5b8c3e";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "#777";
  ctx.fillRect(px + 4, py + 6, TILE - 8, TILE - 12);
  ctx.fillStyle = "#999";
  ctx.fillRect(px + 6, py + 8, TILE - 12, TILE - 16);
  ctx.fillStyle = "#ffd700";
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.fillText("?", px + 16, py + 22);
  ctx.textAlign = "left";
}

function drawBossWall(ctx, px, py, env) {
  ctx.fillStyle = env.hitFlash ? "#884444" : "#3a2a1e";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = env.hitFlash ? "#aa5555" : "#4a3528";
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  const vein = 0.15 + Math.sin(env.time / 2000 + px * 0.1 + py * 0.1) * 0.1;
  ctx.fillStyle = "rgba(160, 40, 40, " + vein + ")";
  ctx.fillRect(px + 6, py + 4, 3, TILE - 8);
  ctx.fillRect(px + 14, py + 8, 4, TILE - 12);
}

function drawBossCore(ctx, px, py, env) {
  ctx.fillStyle = "#2a1a10";
  ctx.fillRect(px, py, TILE, TILE);
  const glow = 0.6 + Math.sin(env.time / 300) * 0.4;
  ctx.fillStyle = "rgba(255, 60, 60, " + glow + ")";
  circle(ctx, px + 16, py + 16, 10);
  ctx.fillStyle = "rgba(255, 200, 100, " + glow * 0.7 + ")";
  circle(ctx, px + 16, py + 16, 5);
}
