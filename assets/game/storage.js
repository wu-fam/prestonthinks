// localStorage wrappers. Access is guarded because private browsing and
// blocked site data make these throw.

const PLAYER_NAME_KEY = "player-name";

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Progress just will not persist this session.
  }
}

export function getPlayerName() {
  return read(PLAYER_NAME_KEY) || "";
}

export function savePlayerName(name) {
  write(PLAYER_NAME_KEY, name);
}

export function isBossDefeated(boss) {
  return read(boss.storageKey) === "defeated";
}

export function markBossDefeated(boss) {
  write(boss.storageKey, "defeated");
}
