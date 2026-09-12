import { TILE, VP_W, VP_H } from "./config.js";
import { TILES, drawGround } from "./tiles.js";
import {
  currentZone, currentZoneName, enterZone, grid, transitionAt,
} from "./zones.js";
import { player, placeAt, startStep, advanceStep } from "./player.js";
import { camera, updateCamera } from "./camera.js";
import { dialog } from "./dialog.js";
import { puzzle, handlePuzzleKey } from "./puzzle.js";
import { isHasted } from "./combat.js";
import { boss, updateBoss, bossHitFlash, startBossEncounter } from "./boss.js";
import { handleSpace } from "./interact.js";
import {
  drawPlayer, drawNPCs, drawBossCreature, drawProjectiles, drawCollectibles,
} from "./sprites.js";
import {
  drawInteractIndicator, drawBossHud, drawDialog, drawPuzzle,
} from "./hud.js";

const ARROW_KEYS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};
// Checked in this order when several arrows are held at once.
const DIRECTION_ORDER = Object.values(ARROW_KEYS);
const HANDLED_KEYS = [
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  " ", "Backspace", "Enter", "Escape",
];
// Clamped so a long frame cannot tunnel the player across several tiles.
const MAX_FRAME_MS = 100;

const held = new Set();
let spaceDown = false;
let canvas;
let context;
let lastTime = 0;

function init() {
  const container = document.getElementById("adventure");
  if (!container) return;

  canvas = document.createElement("canvas");
  canvas.width = VP_W;
  canvas.height = VP_H;
  canvas.setAttribute("tabindex", "0");
  container.appendChild(canvas);
  context = canvas.getContext("2d");

  const hint = document.createElement("p");
  hint.className = "adventure-hint";
  hint.textContent = "Arrow keys to move · Spacebar to interact";
  container.appendChild(hint);

  placeAt(player.x, player.y);
  updateCamera();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("click", () => canvas.focus());
  canvas.focus();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function onKeyDown(e) {
  if (HANDLED_KEYS.includes(e.key)) e.preventDefault();

  if (puzzle.active) {
    handlePuzzleKey(e.key);
    return;
  }
  if (e.key === " ") {
    if (!spaceDown) {
      spaceDown = true;
      handleSpace();
    }
    return;
  }
  if (ARROW_KEYS[e.key]) held.add(ARROW_KEYS[e.key]);
}

function onKeyUp(e) {
  if (e.key === " ") {
    spaceDown = false;
    return;
  }
  if (ARROW_KEYS[e.key]) held.delete(ARROW_KEYS[e.key]);
}

function loop(time) {
  const dt = Math.min(time - lastTime, MAX_FRAME_MS);
  lastTime = time;

  update(dt, time);
  render(time);
  requestAnimationFrame(loop);
}

function update(dt, now) {
  if (dialog.active || puzzle.active) return;

  if (currentZoneName() === "boss") updateBoss(dt, now);

  if (player.moving) {
    if (advanceStep(dt, isHasted())) {
      updateCamera();
      const exit = transitionAt(player.x, player.y);
      if (exit) loadZone(exit.zone, exit.spawnX, exit.spawnY);
    } else {
      updateCamera();
    }
    return;
  }

  const direction = DIRECTION_ORDER.find((d) => held.has(d));
  if (direction) startStep(direction);
}

function loadZone(name, spawnX, spawnY) {
  enterZone(name);
  placeAt(spawnX, spawnY);
  updateCamera();
  if (name === "boss" && !boss.defeated) startBossEncounter();
}

function render(time) {
  const env = { time, hitFlash: bossHitFlash() };

  context.clearRect(0, 0, VP_W, VP_H);
  context.save();
  context.translate(-camera.x, -camera.y);

  drawMap(context, env);
  drawNPCs(context, env);
  drawPlayer(context);
  drawInteractIndicator(context, env);
  if (currentZoneName() === "boss") {
    drawCollectibles(context, env);
    drawBossCreature(context, env);
    drawProjectiles(context, env);
  }

  context.restore();

  if (currentZoneName() === "boss" && !boss.defeated) drawBossHud(context, env);
  if (dialog.active) drawDialog(context, env);
  if (puzzle.active) drawPuzzle(context, env);
}

function drawMap(ctx, env) {
  const g = grid();
  const theme = currentZone().theme;

  const startCol = Math.max(0, Math.floor(camera.x / TILE));
  const endCol = Math.min(g.cols - 1, Math.ceil((camera.x + VP_W) / TILE));
  const startRow = Math.max(0, Math.floor(camera.y / TILE));
  const endRow = Math.min(g.rows - 1, Math.ceil((camera.y + VP_H) / TILE));

  for (let y = startRow; y <= endRow; y++) {
    for (let x = startCol; x <= endCol; x++) {
      const px = x * TILE;
      const py = y * TILE;
      const type = g.terrain[y][x];

      drawGround(ctx, px, py, type, theme);
      const tile = TILES[type];
      if (tile && tile.draw) tile.draw(ctx, px, py, env);
    }
  }
}

// Modules are deferred, so the DOM is already parsed when this runs.
init();
