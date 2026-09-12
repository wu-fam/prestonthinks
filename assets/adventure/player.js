import { TILE, MOVE_MS } from "./config.js";
import { grid, npcAt } from "./zones.js";

export const player = {
  x: 21, y: 46,
  px: 21 * TILE, py: 46 * TILE,
  facing: "up",
  moving: false,
  moveProgress: 0,
  startPx: 0, startPy: 0,
  targetPx: 0, targetPy: 0,
  targetX: 0, targetY: 0,
};

const DIRECTIONS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export function facingOffset() {
  return DIRECTIONS[player.facing];
}

export function placeAt(x, y) {
  player.x = x;
  player.y = y;
  player.px = x * TILE;
  player.py = y * TILE;
  player.moving = false;
  player.moveProgress = 0;
}

// Returns true if the step began.
export function startStep(direction) {
  const [dx, dy] = DIRECTIONS[direction];
  player.facing = direction;

  const nx = player.x + dx;
  const ny = player.y + dy;
  if (grid().isBlocked(nx, ny) || npcAt(nx, ny)) return false;

  player.moving = true;
  player.moveProgress = 0;
  player.startPx = player.px;
  player.startPy = player.py;
  player.targetPx = nx * TILE;
  player.targetPy = ny * TILE;
  player.targetX = nx;
  player.targetY = ny;
  return true;
}

// Returns true on the frame the step lands.
export function advanceStep(dt, hasted) {
  player.moveProgress += dt;
  const duration = hasted ? MOVE_MS * 0.55 : MOVE_MS;
  const t = Math.min(player.moveProgress / duration, 1);
  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  player.px = player.startPx + (player.targetPx - player.startPx) * ease;
  player.py = player.startPy + (player.targetPy - player.startPy) * ease;

  if (t < 1) return false;

  placeAt(player.targetX, player.targetY);
  return true;
}
