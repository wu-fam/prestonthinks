import {
  grid, npcAt, puzzleAt, isSolved, solvePuzzle, currentZoneName,
} from "./zones.js";
import { player, facingOffset } from "./player.js";
import { dialog, openDialog, advanceDialog } from "./dialog.js";
import { puzzle, openPuzzle, submitAnswer } from "./puzzle.js";
import { boss, hitBossCore, openBossGate } from "./boss.js";

const NEIGHBOURS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

export function adjacentInteractable() {
  for (const [dx, dy] of NEIGHBOURS) {
    const x = player.x + dx;
    const y = player.y + dy;
    const tile = grid().get(x, y);
    if (tile === null) continue;

    if (npcAt(x, y)) return { x, y };
    if (tile === "door" || tile === "puzzle" || tile === "bossCore") return { x, y };
  }
  return null;
}

export function handleSpace() {
  if (puzzle.active) {
    submitAnswer();
    return;
  }
  if (dialog.active) {
    advanceDialog();
    return;
  }
  if (player.moving) return;

  const [dx, dy] = facingOffset();
  const x = player.x + dx;
  const y = player.y + dy;

  const tile = grid().get(x, y);
  if (tile === null) return;

  const npc = npcAt(x, y);
  if (npc) {
    openDialog(npc.name, npc.lines);
    return;
  }

  if (currentZoneName() === "boss") {
    if (tile === "bossCore") {
      hitBossCore();
      return;
    }
    if (tile === "puzzle") {
      tryBossPuzzle();
      return;
    }
  }

  const gate = puzzleAt(x, y);
  if (gate) {
    tryGatePuzzle(gate);
    return;
  }

  if (tile === "door") {
    openDialog("???", ["The path ahead is blocked by a mysterious force..."]);
  }
}

function tryBossPuzzle() {
  if (boss.defeated) return;

  if (boss.gateOpen) {
    openDialog("Puzzle Stone", ["The gate is open! Get inside and hit the core!"]);
    return;
  }
  if (boss.phase < boss.puzzles.length) {
    openPuzzle(boss.puzzles[boss.phase], openBossGate);
  }
}

function tryGatePuzzle(gate) {
  if (isSolved(gate.id)) {
    openDialog("Puzzle Stone", ["Already solved! The path is open."]);
    return;
  }
  openPuzzle(gate, solvePuzzle);
}
