import { TILE, VP_W, VP_H } from "./config.js";
import { grid } from "./zones.js";
import { player } from "./player.js";

export const camera = { x: 0, y: 0 };

export function updateCamera() {
  const mapW = grid().cols * TILE;
  const mapH = grid().rows * TILE;

  camera.x = clampAxis(player.px + TILE / 2 - VP_W / 2, mapW, VP_W);
  camera.y = clampAxis(player.py + TILE / 2 - VP_H / 2, mapH, VP_H);
}

function clampAxis(target, mapSize, viewSize) {
  if (mapSize <= viewSize) return (mapSize - viewSize) / 2;
  return Math.max(0, Math.min(target, mapSize - viewSize));
}
