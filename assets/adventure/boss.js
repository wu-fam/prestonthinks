import { TILE } from "./config.js";
import { ZONES, addTransition } from "./zones.js";
import { player, placeAt } from "./player.js";
import { openDialog } from "./dialog.js";
import { combat, resetCombat, tickCombat, takeHit } from "./combat.js";
import {
  collectibles, clearCollectibles, spawnCollectible,
  expireCollectibles, collectUnderPlayer, SPAWN_INTERVAL_MS,
} from "./collectibles.js";

const PROJECTILE_SPEED = 120;
const HIT_FLASH_MS = 500;
const HIT_RADIUS = TILE * 0.6;
const DEATH_RESET_DELAY_MS = 1000;

export const SHELL = { x: 9, y: 5, w: 10, h: 8 };
const GATE_TILES = [[13, 12], [14, 12]];
const CORE_TILE = [13, 8];
const NORTH_PATH = { x1: 13, y1: 0, x2: 14, y2: 4 };

export const boss = {
  hp: 3,
  maxHp: 3,
  phase: 0,
  gateOpen: false,
  defeated: false,
  hitAnim: 0,
  attackTimer: 2000,
  projectiles: [],
  puzzles: [
    { question: "What is 25 x 4?", answer: 100, hint: "Breach the creature!" },
    { question: "What is 13 x 17?", answer: 221, hint: "Find the weak point!" },
    { question: "What is 256 / 16?", answer: 16, hint: "One last strike!" },
  ],
};

let collectibleTimer = 0;

const INTERIOR = (() => {
  const cells = [];
  for (let y = SHELL.y + 2; y <= SHELL.y + SHELL.h - 2; y++) {
    for (let x = SHELL.x + 2; x <= SHELL.x + SHELL.w - 2; x++) cells.push([x, y]);
  }
  for (let y = SHELL.y + SHELL.h - 2; y >= SHELL.y + 2; y--) {
    cells.push([13, y], [14, y]);
  }
  return cells;
})();

function bossGrid() {
  return ZONES.boss.grid;
}

export function bossHitFlash() {
  return boss.hitAnim > 0;
}

export function openBossGate() {
  const g = bossGrid();
  for (const [x, y] of GATE_TILES) g.set(x, y, "path");
  for (const [x, y] of INTERIOR) g.set(x, y, "grass");
  g.set(CORE_TILE[0], CORE_TILE[1], "bossCore");
  boss.gateOpen = true;
}

function closeBossGate() {
  const g = bossGrid();
  for (const [x, y] of GATE_TILES) g.set(x, y, "door");
  for (const [x, y] of INTERIOR) g.set(x, y, "bossWall");
  g.set(CORE_TILE[0], CORE_TILE[1], "bossWall");
  boss.gateOpen = false;
}

export function hitBossCore() {
  boss.hp--;
  boss.hitAnim = HIT_FLASH_MS;
  boss.phase++;
  closeBossGate();

  placeAt(13, 15);
  player.facing = "up";

  if (boss.hp <= 0) defeatBoss();
}

function defeatBoss() {
  const g = bossGrid();
  boss.defeated = true;
  boss.projectiles = [];
  clearCollectibles();

  g.fill(SHELL.x, SHELL.y, SHELL.x + SHELL.w - 1, SHELL.y + SHELL.h - 1, "grass");
  g.set(12, 13, "grass");

  // Trees stay standing; only their collision lifts.
  g.setWalkable(NORTH_PATH.x1, NORTH_PATH.y1, NORTH_PATH.x2, NORTH_PATH.y2);
  addTransition("boss", { x: 13, y: 0, zone: "caves", spawnX: 10, spawnY: 13 });
  addTransition("boss", { x: 14, y: 0, zone: "caves", spawnX: 11, spawnY: 13 });

  openDialog("Victory!", [
    "The creature crumbles! A path opens to the north.",
    "The Crystal Caves await. Onward!",
  ]);
}

function resetBoss() {
  boss.hp = boss.maxHp;
  boss.phase = 0;
  boss.defeated = false;
  boss.hitAnim = 0;
  boss.attackTimer = 2000;
  boss.projectiles = [];

  bossGrid().resetCollision(
    NORTH_PATH.x1, NORTH_PATH.y1, NORTH_PATH.x2, NORTH_PATH.y2,
  );
  closeBossGate();

  resetCombat();
  clearCollectibles();
  collectibleTimer = 0;
  placeAt(13, 19);
  player.facing = "up";
}

export function startBossEncounter() {
  resetCombat();
  boss.projectiles = [];
  boss.attackTimer = 3000;
  openDialog("!!!", [
    "A massive creature blocks the path ahead!",
    "Walk up the path and use the puzzle stone to breach its shell.",
    "Get inside and strike the glowing core. Dodge its attacks!",
  ]);
}

function attackInterval() {
  if (boss.phase === 0) return 2500;
  if (boss.phase === 1) return 2000;
  return 1500;
}

function spawnProjectiles() {
  const cx = (SHELL.x + SHELL.w / 2) * TILE;
  const cy = (SHELL.y + SHELL.h / 2) * TILE;
  const count = boss.phase === 0 ? 3 : boss.phase === 1 ? 4 : 5;

  for (let i = 0; i < count; i++) {
    let angle = i === 0
      ? Math.atan2(player.py + TILE / 2 - cy, player.px + TILE / 2 - cx)
      : Math.random() * Math.PI * 2;
    angle += (Math.random() - 0.5) * 0.4;

    boss.projectiles.push({
      x: cx, y: cy,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
    });
  }
}

function updateProjectiles(dt) {
  const g = bossGrid();
  const pcx = player.px + TILE / 2;
  const pcy = player.py + TILE / 2;

  for (let i = boss.projectiles.length - 1; i >= 0; i--) {
    const p = boss.projectiles[i];
    p.x += (p.dx * PROJECTILE_SPEED * dt) / 1000;
    p.y += (p.dy * PROJECTILE_SPEED * dt) / 1000;

    const tile = g.get(Math.floor(p.x / TILE), Math.floor(p.y / TILE));
    if (tile === null || tile === "tree") {
      boss.projectiles.splice(i, 1);
      continue;
    }

    const dx = p.x - pcx;
    const dy = p.y - pcy;
    if (Math.sqrt(dx * dx + dy * dy) >= HIT_RADIUS) continue;
    if (combat.invuln > 0) continue;

    boss.projectiles.splice(i, 1);
    if (takeHit()) {
      openDialog("Defeated!", ["The creature was too strong... Try again!"]);
      setTimeout(resetBoss, DEATH_RESET_DELAY_MS);
    }
  }
}

export function updateBoss(dt, now) {
  if (boss.defeated) return;

  if (boss.hitAnim > 0) boss.hitAnim -= dt;
  tickCombat(dt);

  boss.attackTimer -= dt;
  if (boss.attackTimer <= 0) {
    spawnProjectiles();
    boss.attackTimer = attackInterval();
  }

  collectibleTimer -= dt;
  if (collectibleTimer <= 0) {
    spawnCollectible(now);
    collectibleTimer = SPAWN_INTERVAL_MS;
  }
  expireCollectibles(now);
  collectUnderPlayer();

  updateProjectiles(dt);
}
