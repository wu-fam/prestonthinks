import { grid } from "./zones.js";
import { player } from "./player.js";
import { heal, grantShield, grantSpeed } from "./combat.js";

export const SPAWN_INTERVAL_MS = 4000;
export const LIFETIME_MS = 10000;
const MAX_ON_FIELD = 3;
const TYPES = ["heart", "shield", "speed"];
const SPAWN_ATTEMPTS = 20;

export const collectibles = [];

export function clearCollectibles() {
  collectibles.length = 0;
}

export function spawnCollectible(now) {
  if (collectibles.length >= MAX_ON_FIELD) return;

  for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt++) {
    const x = 3 + Math.floor(Math.random() * 22);
    const y = 3 + Math.floor(Math.random() * 16);

    const type = grid().get(x, y);
    if (type !== "grass" && type !== "path") continue;
    if (collectibles.some((c) => c.x === x && c.y === y)) continue;

    collectibles.push({
      x, y,
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
      born: now,
    });
    return;
  }
}

export function expireCollectibles(now) {
  for (let i = collectibles.length - 1; i >= 0; i--) {
    if (now - collectibles[i].born > LIFETIME_MS) collectibles.splice(i, 1);
  }
}

export function collectUnderPlayer() {
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i];
    if (c.x !== player.x || c.y !== player.y) continue;

    if (c.type === "heart") heal();
    else if (c.type === "shield") grantShield();
    else grantSpeed();

    collectibles.splice(i, 1);
  }
}
