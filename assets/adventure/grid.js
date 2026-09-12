// A zone's map as two layers over the same coordinates: terrain[y][x] is what
// gets drawn, blocked[y][x] is whether the player may step there. Keeping them
// apart lets a tile look like one thing and behave like another, so opening a
// path through standing trees is a collision change, not a movement-check
// special case.

import { isSolidByDefault } from "./tiles.js";

export class TileGrid {
  constructor(cols, rows, fillType) {
    this.cols = cols;
    this.rows = rows;
    this.terrain = [];
    this.blocked = [];
    for (let y = 0; y < rows; y++) {
      this.terrain.push(new Array(cols).fill(fillType));
      this.blocked.push(new Array(cols).fill(isSolidByDefault(fillType)));
    }
  }

  inBounds(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  // Tile type at a cell, or null outside the map.
  get(x, y) {
    return this.inBounds(x, y) ? this.terrain[y][x] : null;
  }

  // Sets appearance and resets collision to that tile type's default.
  set(x, y, type) {
    if (!this.inBounds(x, y)) return;
    this.terrain[y][x] = type;
    this.blocked[y][x] = isSolidByDefault(type);
  }

  forEach(x1, y1, x2, y2, fn) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (this.inBounds(x, y)) fn(x, y);
      }
    }
  }

  fill(x1, y1, x2, y2, type) {
    this.forEach(x1, y1, x2, y2, (x, y) => this.set(x, y, type));
  }

  // Outside the map counts as blocked, so the player can never walk off it.
  isBlocked(x, y) {
    return this.inBounds(x, y) ? this.blocked[y][x] : true;
  }

  // Lifts collision without touching appearance.
  setWalkable(x1, y1, x2, y2) {
    this.forEach(x1, y1, x2, y2, (x, y) => {
      this.blocked[y][x] = false;
    });
  }

  // Restores collision from terrain, so trees re-block but open ground does not.
  resetCollision(x1, y1, x2, y2) {
    this.forEach(x1, y1, x2, y2, (x, y) => {
      this.blocked[y][x] = isSolidByDefault(this.terrain[y][x]);
    });
  }
}
