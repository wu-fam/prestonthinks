const INVULN_AFTER_HIT_MS = 1000;
const INVULN_AFTER_BLOCK_MS = 500;
const SPEED_DURATION_MS = 5000;

export const combat = {
  hp: 3,
  maxHp: 3,
  invuln: 0,
  shield: false,
  speedTimer: 0,
};

export function resetCombat() {
  combat.hp = combat.maxHp;
  combat.invuln = 0;
  combat.shield = false;
  combat.speedTimer = 0;
}

export function tickCombat(dt) {
  if (combat.invuln > 0) combat.invuln -= dt;
  if (combat.speedTimer > 0) combat.speedTimer -= dt;
}

export function isHasted() {
  return combat.speedTimer > 0;
}

export function heal() {
  if (combat.hp < combat.maxHp) combat.hp++;
}

export function grantShield() {
  combat.shield = true;
}

export function grantSpeed() {
  combat.speedTimer = SPEED_DURATION_MS;
}

// A shield absorbs the hit. Returns true if the player is down.
export function takeHit() {
  if (combat.shield) {
    combat.shield = false;
    combat.invuln = INVULN_AFTER_BLOCK_MS;
    return false;
  }

  combat.hp--;
  combat.invuln = INVULN_AFTER_HIT_MS;
  return combat.hp <= 0;
}
