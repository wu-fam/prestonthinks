// Map builders. Each paints broad terrain first and places single cells last,
// so a region fill can never overwrite a door or puzzle stone.

import { TileGrid } from "./grid.js";

// Always called after the region fills.
function place(grid, cells) {
  for (const [x, y, type] of cells) grid.set(x, y, type);
}

export function buildForestMap() {
  const g = new TileGrid(44, 50, "tree");

  // Room 1: Entrance Clearing
  g.fill(16, 41, 28, 47, "grass");
  g.fill(21, 41, 22, 47, "path");
  g.fill(21, 48, 22, 49, "path");

  // Corridor: Room 1 to Room 2
  g.fill(21, 35, 22, 39, "path");
  g.fill(16, 34, 22, 35, "path");

  // Room 2: Puzzle Garden
  g.fill(4, 28, 14, 36, "grass");
  g.fill(9, 28, 10, 36, "path");
  g.fill(4, 32, 14, 32, "path");
  g.fill(5, 34, 7, 35, "water");

  // Corridor: Room 2 to Room 3
  g.fill(9, 24, 10, 27, "path");
  g.fill(10, 23, 27, 24, "path");

  // Room 3: Pond Clearing
  g.fill(29, 18, 40, 28, "grass");
  g.fill(33, 18, 34, 28, "path");
  g.fill(30, 21, 32, 24, "water");

  // Corridor: Room 3 to Room 4
  g.fill(33, 14, 34, 17, "path");
  g.fill(22, 13, 34, 14, "path");
  g.fill(21, 12, 22, 14, "path");

  // Room 4: Guardian's Gate
  g.fill(14, 3, 30, 11, "grass");
  g.fill(21, 3, 22, 11, "path");
  g.fill(16, 7, 28, 8, "path");

  // North exit to the Crystal Caves
  g.fill(21, 0, 22, 2, "path");

  place(g, [
    // Scattered trees inside the rooms
    [17, 43, "tree"], [27, 43, "tree"], [18, 46, "tree"], [26, 46, "tree"],
    [5, 29, "tree"], [13, 29, "tree"], [13, 35, "tree"], [11, 31, "tree"],
    [30, 19, "tree"], [39, 19, "tree"], [30, 27, "tree"], [39, 27, "tree"],
    [37, 22, "tree"],
    [16, 4, "tree"], [28, 4, "tree"], [16, 10, "tree"], [28, 10, "tree"],
    [19, 7, "tree"], [25, 7, "tree"],

    // Gate 1: north wall of Room 1
    [21, 40, "door"], [22, 40, "door"], [20, 41, "puzzle"],
    // Gate 2: east wall of Room 2
    [15, 34, "door"], [15, 35, "door"], [16, 35, "puzzle"],
    // Gate 3: west wall of Room 3
    [28, 23, "door"], [28, 24, "door"], [27, 23, "puzzle"],
    // Gate 4: south wall of Room 4
    [21, 12, "door"], [22, 12, "door"], [22, 13, "puzzle"],

    [21, 0, "transition"], [22, 0, "transition"],
  ]);

  return g;
}

export function buildCavesMap() {
  const g = new TileGrid(22, 15, "crystal");

  g.fill(2, 2, 19, 12, "stone");
  g.fill(6, 4, 15, 10, "stone");
  g.fill(10, 11, 11, 14, "stone");

  place(g, [
    [10, 14, "transition"], [11, 14, "transition"],
    [6, 4, "crystal"], [15, 4, "crystal"],
    [6, 10, "crystal"], [15, 10, "crystal"],
    [9, 7, "crystal"], [12, 7, "crystal"],
  ]);

  return g;
}

export function buildBossMap() {
  const g = new TileGrid(28, 22, "tree");

  // Arena floor
  g.fill(2, 2, 25, 19, "grass");
  // The creature's shell, rows 5-12
  g.fill(9, 5, 18, 12, "bossWall");
  // Path from the south entrance up to the shell
  g.fill(13, 13, 14, 19, "path");
  g.fill(13, 20, 14, 21, "path");
  // Seal the north wall so no gap shows before the creature falls
  g.fill(0, 0, 27, 1, "tree");

  place(g, [
    // Gate on the south side of the shell
    [13, 12, "door"], [14, 12, "door"],
    // Puzzle stone beside the path
    [12, 13, "puzzle"],
    // Rocks for dodging cover
    [5, 4, "tree"], [22, 4, "tree"],
    [4, 10, "tree"], [23, 10, "tree"],
    [6, 16, "tree"], [21, 16, "tree"],
    [4, 8, "tree"], [23, 8, "tree"],
  ]);

  return g;
}
