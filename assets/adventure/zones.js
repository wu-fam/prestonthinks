import { buildForestMap, buildCavesMap, buildBossMap } from "./maps.js";

export const ZONES = {
  forest: {
    theme: "forest",
    grid: buildForestMap(),
    npcs: [
      {
        x: 19, y: 43,
        name: "Old Sage",
        lines: [
          "Ah, a traveler! Welcome to the Enchanted Forest.",
          "An evil sorcerer has cast a shadow over our land.",
          "Solve the puzzle gates to prove your worth and advance.",
          "Walk up to a puzzle stone and press Space to try.",
        ],
      },
      {
        x: 8, y: 31,
        name: "Forest Sprite",
        lines: [
          "Psst! This garden hides a secret.",
          "The gates accept numbers only.",
          "Type your answer and press Enter to submit!",
        ],
      },
      {
        x: 36, y: 22,
        name: "Pond Keeper",
        lines: [
          "The water here once ran clear...",
          "The sorcerer poisoned it with dark magic.",
          "Solve the gates and maybe the forest can heal.",
        ],
      },
      {
        x: 24, y: 6,
        name: "Gate Guardian",
        lines: [
          "You have come far, traveler.",
          "One final challenge stands between you and the caves.",
          "The sorcerer grows stronger. Prepare yourself.",
        ],
      },
    ],
    puzzles: [
      {
        x: 20, y: 41, id: "forest-gate-1",
        question: "What is 145 + 278?",
        answer: 423,
        hint: "Addition: solve to leave the clearing",
        opens: [[21, 40], [22, 40]],
      },
      {
        x: 16, y: 35, id: "forest-gate-2",
        question: "What is 12 x 15?",
        answer: 180,
        hint: "Multiplication: solve to enter the garden",
        opens: [[15, 34], [15, 35]],
      },
      {
        x: 27, y: 23, id: "forest-gate-3",
        question: "What is 144 / 12?",
        answer: 12,
        hint: "Division: solve to reach the pond",
        opens: [[28, 23], [28, 24]],
      },
      {
        x: 22, y: 13, id: "forest-gate-4",
        question: "What is 500 - 237?",
        answer: 263,
        hint: "Subtraction: the final gate before the caves",
        opens: [[21, 12], [22, 12]],
      },
    ],
    transitions: [
      { x: 21, y: 0, zone: "boss", spawnX: 13, spawnY: 19 },
      { x: 22, y: 0, zone: "boss", spawnX: 14, spawnY: 19 },
    ],
  },

  caves: {
    theme: "caves",
    grid: buildCavesMap(),
    npcs: [
      {
        x: 10, y: 7,
        style: "miner",
        name: "Cave Explorer",
        lines: [
          "You made it through the forest!",
          "The Crystal Caves are still being explored...",
          "Come back soon, there will be more to discover.",
        ],
      },
    ],
    puzzles: [],
    transitions: [
      { x: 10, y: 14, zone: "forest", spawnX: 21, spawnY: 1 },
      { x: 11, y: 14, zone: "forest", spawnX: 22, spawnY: 1 },
    ],
  },

  boss: {
    theme: "boss",
    grid: buildBossMap(),
    npcs: [],
    puzzles: [],
    transitions: [
      { x: 13, y: 20, zone: "forest", spawnX: 21, spawnY: 1 },
      { x: 14, y: 20, zone: "forest", spawnX: 22, spawnY: 1 },
    ],
  },
};

let currentName = "forest";
const solvedPuzzles = new Set();

export function currentZone() {
  return ZONES[currentName];
}

export function currentZoneName() {
  return currentName;
}

export function enterZone(name) {
  currentName = name;
}

export function grid() {
  return ZONES[currentName].grid;
}

export function npcAt(x, y) {
  return currentZone().npcs.find((n) => n.x === x && n.y === y) || null;
}

export function puzzleAt(x, y) {
  return currentZone().puzzles.find((p) => p.x === x && p.y === y) || null;
}

export function transitionAt(x, y) {
  return currentZone().transitions.find((t) => t.x === x && t.y === y) || null;
}

export function isSolved(puzzleId) {
  return solvedPuzzles.has(puzzleId);
}

// A real terrain change: set() clears the door's collision along with its look.
export function solvePuzzle(puzzle) {
  solvedPuzzles.add(puzzle.id);
  for (const [x, y] of puzzle.opens) grid().set(x, y, "path");
}

// Ignores repeats, so replaying a fight cannot stack duplicates.
export function addTransition(zoneName, entry) {
  const list = ZONES[zoneName].transitions;
  if (list.some((t) => t.x === entry.x && t.y === entry.y)) return;
  list.push(entry);
}
