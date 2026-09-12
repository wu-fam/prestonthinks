import { TILE, MOVE_MS } from "./config.js";
import { circle, polygon, shadow } from "./draw.js";
import { player } from "./player.js";
import { currentZone } from "./zones.js";
import { boss, SHELL } from "./boss.js";
import { collectibles, LIFETIME_MS } from "./collectibles.js";

export function drawPlayer(ctx) {
  const px = Math.round(player.px);
  const py = Math.round(player.py);

  shadow(ctx, px, py);

  let bob = 0;
  if (player.moving) {
    bob = -Math.sin((player.moveProgress / MOVE_MS) * Math.PI) * 2;
  }
  const by = py + bob;

  ctx.fillStyle = "#3a7bd5";
  ctx.fillRect(px + 9, by + 14, 14, 12);
  ctx.fillStyle = "#f5c6a0";
  ctx.fillRect(px + 10, by + 4, 12, 11);

  ctx.fillStyle = "#4a3728";
  if (player.facing === "down") {
    ctx.fillRect(px + 10, by + 4, 12, 3);
    ctx.fillStyle = "#333";
    ctx.fillRect(px + 12, by + 9, 3, 3);
    ctx.fillRect(px + 17, by + 9, 3, 3);
  } else if (player.facing === "up") {
    ctx.fillRect(px + 10, by + 4, 12, 7);
  } else if (player.facing === "left") {
    ctx.fillRect(px + 12, by + 4, 10, 3);
    ctx.fillStyle = "#333";
    ctx.fillRect(px + 11, by + 9, 3, 3);
  } else {
    ctx.fillRect(px + 10, by + 4, 10, 3);
    ctx.fillStyle = "#333";
    ctx.fillRect(px + 18, by + 9, 3, 3);
  }

  ctx.fillStyle = "#5c3a1e";
  const step = player.moving
    ? Math.sin((player.moveProgress / MOVE_MS) * Math.PI * 2)
    : 0;
  ctx.fillRect(px + 9, by + 26, 5, 4 + step);
  ctx.fillRect(px + 18, by + 26, 5, 4 - step);
}

export function drawNPCs(ctx, env) {
  for (const npc of currentZone().npcs) {
    if (npc.style === "miner") drawMiner(ctx, npc, env);
    else drawVillager(ctx, npc, env);
  }
}

function drawVillager(ctx, npc, env) {
  const px = npc.x * TILE;
  const py = npc.y * TILE;
  shadow(ctx, px, py);
  const by = py + Math.sin(env.time / 600) * 1.5;

  ctx.fillStyle = "#7b2d8b";
  ctx.fillRect(px + 8, by + 14, 16, 14);
  ctx.fillStyle = "#f5c6a0";
  ctx.fillRect(px + 10, by + 5, 12, 10);

  ctx.fillStyle = "#7b2d8b";
  polygon(ctx, [[px + 7, by + 7], [px + 16, by - 5], [px + 25, by + 7]]);

  ctx.fillStyle = "#333";
  ctx.fillRect(px + 12, by + 9, 3, 2);
  ctx.fillRect(px + 17, by + 9, 3, 2);

  ctx.fillStyle = "#ccc";
  ctx.fillRect(px + 12, by + 14, 8, 5);
  polygon(ctx, [[px + 12, by + 19], [px + 16, by + 25], [px + 20, by + 19]]);
}

function drawMiner(ctx, npc, env) {
  const px = npc.x * TILE;
  const py = npc.y * TILE;
  shadow(ctx, px, py);
  const by = py + Math.sin(env.time / 600) * 1.5;

  ctx.fillStyle = "#7a5c3a";
  ctx.fillRect(px + 8, by + 14, 16, 14);
  ctx.fillStyle = "#5c3a1e";
  ctx.fillRect(px + 10, by + 14, 3, 10);
  ctx.fillRect(px + 19, by + 14, 3, 10);

  ctx.fillStyle = "#f5c6a0";
  ctx.fillRect(px + 10, by + 5, 12, 10);

  ctx.fillStyle = "#e6b800";
  ctx.fillRect(px + 8, by + 2, 16, 5);
  ctx.fillRect(px + 6, by + 6, 20, 2);

  const glow = 0.6 + Math.sin(env.time / 400) * 0.3;
  ctx.fillStyle = "rgba(255, 255, 150, " + glow + ")";
  circle(ctx, px + 16, by + 4, 3);

  ctx.fillStyle = "#333";
  ctx.fillRect(px + 12, by + 9, 3, 2);
  ctx.fillRect(px + 17, by + 9, 3, 2);
  ctx.fillStyle = "#b0967a";
  ctx.fillRect(px + 12, by + 13, 8, 2);
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(px + 8, by + 26, 6, 4);
  ctx.fillRect(px + 18, by + 26, 6, 4);
}

export function drawBossCreature(ctx, env) {
  if (boss.defeated || boss.gateOpen) return;

  const cx = (SHELL.x + SHELL.w / 2) * TILE;
  const cy = (SHELL.y + 2) * TILE;
  const breathe = Math.sin(env.time / 800) * 2;
  const eyeY = cy + breathe + 10;
  const eyeGlow = 0.7 + Math.sin(env.time / 400) * 0.3;

  ctx.fillStyle = "rgba(255, 50, 50, " + eyeGlow + ")";
  for (const side of [-24, 24]) {
    ctx.beginPath();
    ctx.ellipse(cx + side, eyeY, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#000";
  circle(ctx, cx - 24, eyeY, 4);
  circle(ctx, cx + 24, eyeY, 4);

  ctx.strokeStyle = "rgba(255, 80, 40, 0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy + 50 + breathe);
  ctx.quadraticCurveTo(cx, cy + 60 + breathe, cx + 20, cy + 50 + breathe);
  ctx.stroke();
}

export function drawProjectiles(ctx, env) {
  boss.projectiles.forEach((p, i) => {
    const glow = 0.7 + Math.sin(env.time / 200 + i) * 0.3;
    ctx.fillStyle = "rgba(180, 40, 220, " + glow * 0.3 + ")";
    circle(ctx, p.x, p.y, 12);
    ctx.fillStyle = "rgba(220, 60, 255, " + glow + ")";
    circle(ctx, p.x, p.y, 6);
    ctx.fillStyle = "rgba(255, 200, 255, " + glow * 0.8 + ")";
    circle(ctx, p.x, p.y, 3);
  });
}

const GLOW_COLORS = {
  heart: "rgba(255, 80, 80, 0.3)",
  shield: "rgba(80, 140, 255, 0.3)",
  speed: "rgba(255, 220, 50, 0.3)",
};

export function drawCollectibles(ctx, env) {
  collectibles.forEach((c, i) => {
    const px = c.x * TILE;
    const py = c.y * TILE;
    const bob = Math.sin(env.time / 400 + i * 2) * 3;
    const age = env.time - c.born;

    ctx.globalAlpha = age > LIFETIME_MS - 2000
      ? 0.3 + Math.sin(env.time / 150) * 0.3
      : 1;

    ctx.fillStyle = GLOW_COLORS[c.type];
    circle(ctx, px + 16, py + 16 + bob, 14);

    if (c.type === "heart") drawHeartPickup(ctx, px, py, bob);
    else if (c.type === "shield") drawShieldPickup(ctx, px, py, bob);
    else drawSpeedPickup(ctx, px, py, bob);

    ctx.globalAlpha = 1;
  });
}

function drawHeartPickup(ctx, px, py, bob) {
  ctx.fillStyle = "#ff4444";
  ctx.font = "bold 20px serif";
  ctx.textAlign = "center";
  ctx.fillText("♥", px + 16, py + 22 + bob);
  ctx.textAlign = "left";
}

function drawShieldPickup(ctx, px, py, bob) {
  ctx.fillStyle = "#4488ff";
  polygon(ctx, [
    [px + 16, py + 6 + bob], [px + 24, py + 12 + bob], [px + 22, py + 24 + bob],
    [px + 16, py + 28 + bob], [px + 10, py + 24 + bob], [px + 8, py + 12 + bob],
  ]);
  ctx.fillStyle = "#66aaff";
  polygon(ctx, [
    [px + 16, py + 10 + bob], [px + 21, py + 14 + bob], [px + 20, py + 22 + bob],
    [px + 16, py + 25 + bob], [px + 12, py + 22 + bob], [px + 11, py + 14 + bob],
  ]);
}

function drawSpeedPickup(ctx, px, py, bob) {
  ctx.fillStyle = "#ffdd33";
  ctx.fillRect(px + 8, py + 10 + bob, 16, 12);
  ctx.fillStyle = "#ffaa00";
  ctx.fillRect(px + 6, py + 18 + bob, 8, 6);
  ctx.fillRect(px + 18, py + 18 + bob, 8, 6);
  ctx.fillStyle = "#fff";
  circle(ctx, px + 16, py + 8 + bob, 3);
}
