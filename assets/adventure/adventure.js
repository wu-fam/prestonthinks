(function () {
  'use strict';

  var TILE = 32;
  var VP_COLS = 20;
  var VP_ROWS = 15;
  var VP_W = VP_COLS * TILE;
  var VP_H = VP_ROWS * TILE;
  var MOVE_MS = 140;

  var GRASS = 0;
  var TREE = 1;
  var PATH = 2;
  var DOOR = 4;
  var TRANSITION = 5;
  var WATER = 6;
  var STONE = 7;
  var CRYSTAL = 8;
  var PUZZLE = 9;

  var SOLID = [TREE, DOOR, WATER, CRYSTAL, PUZZLE];
  var WALKABLE_SPECIAL = [TRANSITION];

  // --- Zone definitions ---

  var ZONES = {};

  ZONES.forest = {
    map: buildForestMap(),
    npcs: [
      {
        x: 19, y: 43,
        name: 'Old Sage',
        lines: [
          'Ah, a traveler! Welcome to the Enchanted Forest.',
          'An evil sorcerer has cast a shadow over our land.',
          'Solve the puzzle gates to prove your worth and advance.',
          'Walk up to a puzzle stone and press Space to try.',
        ],
      },
      {
        x: 8, y: 31,
        name: 'Forest Sprite',
        lines: [
          'Psst! This garden hides a secret.',
          'The gates accept numbers only.',
          'Type your answer and press Enter to submit!',
        ],
      },
      {
        x: 36, y: 22,
        name: 'Pond Keeper',
        lines: [
          'The water here once ran clear...',
          'The sorcerer poisoned it with dark magic.',
          'Solve the gates and maybe the forest can heal.',
        ],
      },
      {
        x: 24, y: 6,
        name: 'Gate Guardian',
        lines: [
          'You have come far, traveler.',
          'One final challenge stands between you and the caves.',
          'The sorcerer grows stronger. Prepare yourself.',
        ],
      },
    ],
    puzzles: [
      {
        x: 20, y: 41, id: 'forest-gate-1',
        question: 'What is 145 + 278?',
        answer: 423,
        hint: 'Addition: solve to leave the clearing',
        solvedTiles: [[21, 40], [22, 40]],
      },
      {
        x: 16, y: 35, id: 'forest-gate-2',
        question: 'What is 12 x 15?',
        answer: 180,
        hint: 'Multiplication: solve to enter the garden',
        solvedTiles: [[15, 34], [15, 35]],
      },
      {
        x: 27, y: 23, id: 'forest-gate-3',
        question: 'What is 144 / 12?',
        answer: 12,
        hint: 'Division: solve to reach the pond',
        solvedTiles: [[28, 23], [28, 24]],
      },
      {
        x: 22, y: 13, id: 'forest-gate-4',
        question: 'What is 500 - 237?',
        answer: 263,
        hint: 'Subtraction: the final gate before the caves',
        solvedTiles: [[21, 12], [22, 12]],
      },
    ],
    transitions: [
      { x: 21, y: 0, zone: 'caves', spawnX: 10, spawnY: 13 },
      { x: 22, y: 0, zone: 'caves', spawnX: 11, spawnY: 13 },
    ],
  };

  ZONES.caves = {
    map: buildCavesMap(),
    npcs: [
      {
        x: 10, y: 7,
        style: 'miner',
        name: 'Cave Explorer',
        lines: [
          'You made it through the forest!',
          'The Crystal Caves are still being explored...',
          'Come back soon, there will be more to discover.',
        ],
      },
    ],
    puzzles: [],
    transitions: [
      { x: 10, y: 14, zone: 'forest', spawnX: 21, spawnY: 1 },
      { x: 11, y: 14, zone: 'forest', spawnX: 22, spawnY: 1 },
    ],
  };

  function buildForestMap() {
    var W = 44, H = 50;
    var m = [];
    for (var y = 0; y < H; y++) {
      m[y] = [];
      for (var x = 0; x < W; x++) m[y][x] = TREE;
    }

    function fill(x1, y1, x2, y2, t) {
      for (var yy = y1; yy <= y2; yy++)
        for (var xx = x1; xx <= x2; xx++)
          if (yy >= 0 && yy < H && xx >= 0 && xx < W) m[yy][xx] = t;
    }
    function set(x, y, t) { if (y >= 0 && y < H && x >= 0 && x < W) m[y][x] = t; }

    // ===================
    // Room 1: Entrance Clearing
    // ===================
    fill(16, 41, 28, 47, GRASS);
    fill(21, 41, 22, 47, PATH);
    fill(21, 48, 22, 49, PATH);
    set(17, 43, TREE); set(27, 43, TREE);
    set(18, 46, TREE); set(26, 46, TREE);

    // Gate 1: north wall of Room 1
    set(21, 40, DOOR); set(22, 40, DOOR);
    set(20, 41, PUZZLE);

    // ===================
    // Corridor: Room 1 → Room 2
    // ===================
    fill(21, 35, 22, 39, PATH);
    fill(16, 34, 22, 35, PATH);

    // Gate 2: east wall of Room 2
    set(15, 34, DOOR); set(15, 35, DOOR);
    set(16, 35, PUZZLE);

    // ===================
    // Room 2: Puzzle Garden
    // ===================
    fill(4, 28, 14, 36, GRASS);
    fill(9, 28, 10, 36, PATH);
    fill(4, 32, 14, 32, PATH);
    set(5, 29, TREE); set(13, 29, TREE);
    set(13, 35, TREE); set(11, 31, TREE);
    fill(5, 34, 7, 35, WATER);

    // ===================
    // Corridor: Room 2 → Room 3
    // ===================
    fill(9, 24, 10, 27, PATH);
    fill(10, 23, 27, 24, PATH);

    // Gate 3: west wall of Room 3
    set(28, 23, DOOR); set(28, 24, DOOR);
    set(27, 23, PUZZLE);

    // ===================
    // Room 3: Pond Clearing
    // ===================
    fill(29, 18, 40, 28, GRASS);
    fill(33, 18, 34, 28, PATH);
    fill(30, 21, 32, 24, WATER);
    set(30, 19, TREE); set(39, 19, TREE);
    set(30, 27, TREE); set(39, 27, TREE);
    set(37, 22, TREE);

    // ===================
    // Corridor: Room 3 → Room 4
    // ===================
    fill(33, 14, 34, 17, PATH);
    fill(22, 13, 34, 14, PATH);
    fill(21, 12, 22, 14, PATH);

    // Gate 4: south wall of Room 4
    set(21, 12, DOOR); set(22, 12, DOOR);
    set(22, 13, PUZZLE);

    // ===================
    // Room 4: Guardian's Gate
    // ===================
    fill(14, 3, 30, 11, GRASS);
    fill(21, 3, 22, 11, PATH);
    fill(16, 7, 28, 8, PATH);
    set(16, 4, TREE); set(28, 4, TREE);
    set(16, 10, TREE); set(28, 10, TREE);
    set(19, 7, TREE); set(25, 7, TREE);

    // ===================
    // North exit to Crystal Caves
    // ===================
    fill(21, 0, 22, 2, PATH);
    set(21, 0, TRANSITION); set(22, 0, TRANSITION);

    return m;
  }

  function buildCavesMap() {
    var W = 22, H = 15;
    var m = [];
    for (var y = 0; y < H; y++) {
      m[y] = [];
      for (var x = 0; x < W; x++) {
        m[y][x] = CRYSTAL;
      }
    }

    function fill(x1, y1, x2, y2, t) {
      for (var yy = y1; yy <= y2; yy++)
        for (var xx = x1; xx <= x2; xx++)
          m[yy][xx] = t;
    }

    // Open cave interior
    fill(2, 2, W - 3, H - 3, STONE);

    // Central area
    fill(6, 4, 15, 10, STONE);

    // Entrance path at south
    fill(10, 11, 11, 14, STONE);
    m[14][10] = TRANSITION;
    m[14][11] = TRANSITION;

    // Crystal pillars
    m[4][6] = CRYSTAL;
    m[4][15] = CRYSTAL;
    m[10][6] = CRYSTAL;
    m[10][15] = CRYSTAL;
    m[7][9] = CRYSTAL;
    m[7][12] = CRYSTAL;

    return m;
  }

  // --- State ---

  var currentZone = 'forest';
  var player = {
    x: 21, y: 46, facing: 'up',
    moving: false, moveProgress: 0,
    px: 0, py: 0,
    startPx: 0, startPy: 0,
    targetPx: 0, targetPy: 0,
    targetTileX: 0, targetTileY: 0,
  };
  var camera = { x: 0, y: 0 };
  var keys = {};
  var dialog = { active: false, npc: null, lineIndex: 0 };
  var puzzle = { active: false, data: null, input: '', feedback: '', feedbackTime: 0 };
  var solvedPuzzles = {};
  var canvas, ctx;
  var lastTime = 0;
  var spaceHandled = false;

  // --- Helpers ---

  function getZone() { return ZONES[currentZone]; }

  function mapCols() { return getZone().map[0].length; }
  function mapRows() { return getZone().map.length; }

  function tileAt(x, y) {
    var zone = getZone();
    if (y < 0 || y >= zone.map.length || x < 0 || x >= zone.map[0].length) return -1;
    return zone.map[y][x];
  }

  function isSolid(tile) {
    for (var i = 0; i < SOLID.length; i++) {
      if (SOLID[i] === tile) return true;
    }
    return false;
  }

  function npcAt(tx, ty) {
    var npcs = getZone().npcs;
    for (var i = 0; i < npcs.length; i++) {
      if (npcs[i].x === tx && npcs[i].y === ty) return npcs[i];
    }
    return null;
  }

  function puzzleAt(tx, ty) {
    var puzzles = getZone().puzzles;
    for (var i = 0; i < puzzles.length; i++) {
      if (puzzles[i].x === tx && puzzles[i].y === ty) return puzzles[i];
    }
    return null;
  }

  function transitionAt(tx, ty) {
    var transitions = getZone().transitions;
    for (var i = 0; i < transitions.length; i++) {
      if (transitions[i].x === tx && transitions[i].y === ty) return transitions[i];
    }
    return null;
  }

  function facingOffset() {
    switch (player.facing) {
      case 'up': return [0, -1];
      case 'down': return [0, 1];
      case 'left': return [-1, 0];
      case 'right': return [1, 0];
    }
    return [0, 0];
  }

  function adjacentInteractable() {
    var dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    for (var i = 0; i < dirs.length; i++) {
      var tx = player.x + dirs[i][0];
      var ty = player.y + dirs[i][1];
      if (tileAt(tx, ty) === -1) continue;
      if (npcAt(tx, ty)) return { type: 'npc', x: tx, y: ty };
      if (tileAt(tx, ty) === DOOR) return { type: 'door', x: tx, y: ty };
      if (tileAt(tx, ty) === PUZZLE) return { type: 'puzzle', x: tx, y: ty };
    }
    return null;
  }

  function loadZone(name, spawnX, spawnY) {
    currentZone = name;
    player.x = spawnX;
    player.y = spawnY;
    player.px = spawnX * TILE;
    player.py = spawnY * TILE;
    player.moving = false;
    updateCamera();
  }

  function solvePuzzle(p) {
    solvedPuzzles[p.id] = true;
    var zone = getZone();
    for (var i = 0; i < p.solvedTiles.length; i++) {
      var sx = p.solvedTiles[i][0];
      var sy = p.solvedTiles[i][1];
      zone.map[sy][sx] = PATH;
    }
  }

  // --- Camera ---

  function updateCamera() {
    var mw = mapCols() * TILE;
    var mh = mapRows() * TILE;
    var targetX = player.px + TILE / 2 - VP_W / 2;
    var targetY = player.py + TILE / 2 - VP_H / 2;

    if (mw <= VP_W) {
      camera.x = (mw - VP_W) / 2;
    } else {
      camera.x = Math.max(0, Math.min(targetX, mw - VP_W));
    }
    if (mh <= VP_H) {
      camera.y = (mh - VP_H) / 2;
    } else {
      camera.y = Math.max(0, Math.min(targetY, mh - VP_H));
    }
  }

  // --- Input ---

  function handleSpace() {
    if (puzzle.active) {
      submitPuzzleAnswer();
      return;
    }

    if (dialog.active) {
      dialog.lineIndex++;
      if (dialog.lineIndex >= dialog.npc.lines.length) {
        dialog.active = false;
        dialog.npc = null;
        dialog.lineIndex = 0;
      }
      return;
    }

    if (player.moving) return;

    var off = facingOffset();
    var tx = player.x + off[0];
    var ty = player.y + off[1];

    if (tileAt(tx, ty) === -1) return;

    var npc = npcAt(tx, ty);
    if (npc) {
      dialog.active = true;
      dialog.npc = npc;
      dialog.lineIndex = 0;
      return;
    }

    var p = puzzleAt(tx, ty);
    if (p) {
      if (solvedPuzzles[p.id]) {
        dialog.active = true;
        dialog.npc = { name: 'Puzzle Stone', lines: ['Already solved! The path is open.'] };
        dialog.lineIndex = 0;
      } else {
        puzzle.active = true;
        puzzle.data = p;
        puzzle.input = '';
        puzzle.feedback = '';
        puzzle.feedbackTime = 0;
      }
      return;
    }

    if (tileAt(tx, ty) === DOOR) {
      dialog.active = true;
      dialog.npc = { name: '???', lines: ['The path ahead is blocked by a mysterious force...'] };
      dialog.lineIndex = 0;
    }
  }

  function submitPuzzleAnswer() {
    if (!puzzle.active || !puzzle.data) return;
    var answer = parseInt(puzzle.input, 10);
    if (isNaN(answer)) {
      puzzle.feedback = 'Enter a number!';
      puzzle.feedbackTime = performance.now();
      return;
    }
    if (answer === puzzle.data.answer) {
      solvePuzzle(puzzle.data);
      puzzle.feedback = 'Correct!';
      puzzle.feedbackTime = performance.now();
      setTimeout(function () {
        puzzle.active = false;
        puzzle.data = null;
        puzzle.input = '';
        puzzle.feedback = '';
      }, 800);
    } else {
      puzzle.feedback = 'Try again!';
      puzzle.feedbackTime = performance.now();
      puzzle.input = '';
    }
  }

  function handlePuzzleKey(key) {
    if (key === 'Escape') {
      puzzle.active = false;
      puzzle.data = null;
      puzzle.input = '';
      puzzle.feedback = '';
      return;
    }
    if (key === 'Enter') {
      submitPuzzleAnswer();
      return;
    }
    if (key === 'Backspace') {
      puzzle.input = puzzle.input.slice(0, -1);
      return;
    }
    if (key === '-' && puzzle.input.length === 0) {
      puzzle.input = '-';
      return;
    }
    if (key >= '0' && key <= '9' && puzzle.input.length < 10) {
      puzzle.input += key;
    }
  }

  // --- Init ---

  function init() {
    var container = document.getElementById('adventure');
    if (!container) return;

    canvas = document.createElement('canvas');
    canvas.width = VP_W;
    canvas.height = VP_H;
    canvas.setAttribute('tabindex', '1');
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    player.px = player.x * TILE;
    player.py = player.y * TILE;
    updateCamera();

    var hint = document.createElement('p');
    hint.className = 'adventure-hint';
    hint.textContent = 'Arrow keys to move · Spacebar to interact';
    container.appendChild(hint);

    window.addEventListener('keydown', function (e) {
      var dominated = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Backspace','Enter','Escape'];
      if (dominated.indexOf(e.key) !== -1) e.preventDefault();

      if (puzzle.active) {
        handlePuzzleKey(e.key);
        return;
      }

      if (e.key === ' ') {
        if (!spaceHandled) {
          spaceHandled = true;
          handleSpace();
        }
        return;
      }
      keys[e.key] = true;
    });

    window.addEventListener('keyup', function (e) {
      if (e.key === ' ') { spaceHandled = false; return; }
      keys[e.key] = false;
    });

    canvas.addEventListener('click', function () { canvas.focus(); });
    canvas.focus();

    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  // --- Game loop ---

  function loop(time) {
    var dt = time - lastTime;
    lastTime = time;
    if (dt > 100) dt = 100;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    if (dialog.active || puzzle.active) return;

    if (player.moving) {
      player.moveProgress += dt;
      var t = Math.min(player.moveProgress / MOVE_MS, 1);
      var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      player.px = player.startPx + (player.targetPx - player.startPx) * ease;
      player.py = player.startPy + (player.targetPy - player.startPy) * ease;
      updateCamera();
      if (t >= 1) {
        player.moving = false;
        player.x = player.targetTileX;
        player.y = player.targetTileY;
        player.px = player.x * TILE;
        player.py = player.y * TILE;
        updateCamera();

        var tr = transitionAt(player.x, player.y);
        if (tr) {
          loadZone(tr.zone, tr.spawnX, tr.spawnY);
          return;
        }
      }
      return;
    }

    var dx = 0, dy = 0;
    if (keys['ArrowUp']) { dy = -1; player.facing = 'up'; }
    else if (keys['ArrowDown']) { dy = 1; player.facing = 'down'; }
    else if (keys['ArrowLeft']) { dx = -1; player.facing = 'left'; }
    else if (keys['ArrowRight']) { dx = 1; player.facing = 'right'; }

    if (dx === 0 && dy === 0) return;

    var nx = player.x + dx;
    var ny = player.y + dy;

    var tile = tileAt(nx, ny);
    if (tile === -1) return;
    if (isSolid(tile)) return;
    if (npcAt(nx, ny)) return;

    player.moving = true;
    player.moveProgress = 0;
    player.startPx = player.px;
    player.startPy = player.py;
    player.targetPx = nx * TILE;
    player.targetPy = ny * TILE;
    player.targetTileX = nx;
    player.targetTileY = ny;
  }

  // --- Rendering ---

  function render() {
    ctx.clearRect(0, 0, VP_W, VP_H);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    drawMap();
    drawNPCs();
    drawPlayer();
    drawInteractIndicator();

    ctx.restore();

    if (dialog.active) drawDialog();
    if (puzzle.active) drawPuzzle();
  }

  function drawMap() {
    var startCol = Math.max(0, Math.floor(camera.x / TILE));
    var endCol = Math.min(mapCols() - 1, Math.ceil((camera.x + VP_W) / TILE));
    var startRow = Math.max(0, Math.floor(camera.y / TILE));
    var endRow = Math.min(mapRows() - 1, Math.ceil((camera.y + VP_H) / TILE));

    for (var y = startRow; y <= endRow; y++) {
      for (var x = startCol; x <= endCol; x++) {
        var px = x * TILE;
        var py = y * TILE;
        var tile = getZone().map[y][x];

        drawGround(px, py, tile);

        if (tile === TREE) drawTree(px, py);
        else if (tile === DOOR) drawDoor(px, py);
        else if (tile === WATER) drawWater(px, py);
        else if (tile === CRYSTAL) drawCrystal(px, py);
        else if (tile === PUZZLE) drawPuzzleStone(px, py);
        else if (tile === TRANSITION) drawTransition(px, py);
      }
    }
  }

  function drawGround(px, py, tile) {
    if (currentZone === 'caves') {
      if (tile === STONE || tile === TRANSITION) {
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#333344';
        if ((Math.floor(px/TILE) + Math.floor(py/TILE)) % 4 === 0) {
          ctx.fillRect(px + 6, py + 10, 3, 3);
        }
      } else {
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(px, py, TILE, TILE);
      }
      return;
    }

    if (tile === PATH || tile === TRANSITION) {
      ctx.fillStyle = '#c9b47c';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#b8a36c';
      var gx = Math.floor(px / TILE), gy = Math.floor(py / TILE);
      if ((gx + gy) % 2 === 0) {
        ctx.fillRect(px + 6, py + 9, 3, 3);
        ctx.fillRect(px + 19, py + 23, 3, 3);
      }
    } else {
      ctx.fillStyle = '#5b8c3e';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#4d7a34';
      var gx2 = Math.floor(px / TILE), gy2 = Math.floor(py / TILE);
      if ((gx2 + gy2) % 3 === 0) {
        ctx.fillRect(px + 10, py + 14, 2, 5);
        ctx.fillRect(px + 22, py + 6, 2, 5);
      }
      if ((gx2 * 7 + gy2 * 13) % 5 === 0) {
        ctx.fillRect(px + 4, py + 22, 2, 4);
      }
    }
  }

  function drawTree(px, py) {
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(px + 13, py + 20, 6, 12);
    ctx.fillStyle = '#1e5c1e';
    ctx.beginPath();
    ctx.arc(px + 16, py + 14, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2d7a2d';
    ctx.beginPath();
    ctx.arc(px + 12, py + 11, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawDoor(px, py) {
    ctx.fillStyle = '#555';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(px + 16, py + 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px + 14, py + 18, 4, 6);
  }

  function drawWater(px, py) {
    ctx.fillStyle = '#3b7dd8';
    ctx.fillRect(px, py, TILE, TILE);
    var shimmer = Math.sin(performance.now() / 800 + px * 0.1) * 0.15;
    ctx.fillStyle = 'rgba(150, 210, 255, ' + (0.3 + shimmer) + ')';
    ctx.fillRect(px + 4, py + 10, 12, 2);
    ctx.fillRect(px + 14, py + 20, 10, 2);
  }

  function drawCrystal(px, py) {
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(px, py, TILE, TILE);
    var glow = 0.4 + Math.sin(performance.now() / 1000 + px * 0.05 + py * 0.07) * 0.2;
    ctx.fillStyle = 'rgba(120, 80, 220, ' + glow + ')';
    ctx.beginPath();
    ctx.moveTo(px + 16, py + 4);
    ctx.lineTo(px + 26, py + 16);
    ctx.lineTo(px + 16, py + 28);
    ctx.lineTo(px + 6, py + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(180, 140, 255, ' + (glow * 0.6) + ')';
    ctx.beginPath();
    ctx.moveTo(px + 16, py + 8);
    ctx.lineTo(px + 22, py + 16);
    ctx.lineTo(px + 16, py + 24);
    ctx.lineTo(px + 10, py + 16);
    ctx.closePath();
    ctx.fill();
  }

  function drawPuzzleStone(px, py) {
    ctx.fillStyle = '#5b8c3e';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#777';
    ctx.fillRect(px + 4, py + 6, TILE - 8, TILE - 12);
    ctx.fillStyle = '#999';
    ctx.fillRect(px + 6, py + 8, TILE - 12, TILE - 16);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('?', px + 16, py + 22);
    ctx.textAlign = 'left';
  }

  function drawTransition(px, py) {
    // drawn by drawGround as PATH
  }

  function drawPlayer() {
    var px = Math.round(player.px);
    var py = Math.round(player.py);
    var bobY = 0;
    if (player.moving) {
      var t = player.moveProgress / MOVE_MS;
      bobY = -Math.sin(t * Math.PI) * 2;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 30, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    var by = py + bobY;

    ctx.fillStyle = '#3a7bd5';
    ctx.fillRect(px + 9, by + 14, 14, 12);

    ctx.fillStyle = '#f5c6a0';
    ctx.fillRect(px + 10, by + 4, 12, 11);

    ctx.fillStyle = '#4a3728';
    switch (player.facing) {
      case 'down':
        ctx.fillRect(px + 10, by + 4, 12, 3);
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 12, by + 9, 3, 3);
        ctx.fillRect(px + 17, by + 9, 3, 3);
        break;
      case 'up':
        ctx.fillRect(px + 10, by + 4, 12, 7);
        break;
      case 'left':
        ctx.fillRect(px + 12, by + 4, 10, 3);
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 11, by + 9, 3, 3);
        break;
      case 'right':
        ctx.fillRect(px + 10, by + 4, 10, 3);
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 18, by + 9, 3, 3);
        break;
    }

    ctx.fillStyle = '#5c3a1e';
    if (player.moving) {
      var step = Math.sin(player.moveProgress / MOVE_MS * Math.PI * 2);
      ctx.fillRect(px + 9, by + 26, 5, 4 + step);
      ctx.fillRect(px + 18, by + 26, 5, 4 - step);
    } else {
      ctx.fillRect(px + 9, by + 26, 5, 4);
      ctx.fillRect(px + 18, by + 26, 5, 4);
    }
  }

  function drawNPC(npc) {
    if (npc.style === 'miner') { drawMiner(npc); return; }

    var px = npc.x * TILE;
    var py = npc.y * TILE;
    var hover = Math.sin(performance.now() / 600) * 1.5;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 30, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    var by = py + hover;

    ctx.fillStyle = '#7b2d8b';
    ctx.fillRect(px + 8, by + 14, 16, 14);

    ctx.fillStyle = '#f5c6a0';
    ctx.fillRect(px + 10, by + 5, 12, 10);

    ctx.fillStyle = '#7b2d8b';
    ctx.beginPath();
    ctx.moveTo(px + 7, by + 7);
    ctx.lineTo(px + 16, by - 5);
    ctx.lineTo(px + 25, by + 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.fillRect(px + 12, by + 9, 3, 2);
    ctx.fillRect(px + 17, by + 9, 3, 2);

    ctx.fillStyle = '#ccc';
    ctx.fillRect(px + 12, by + 14, 8, 5);
    ctx.beginPath();
    ctx.moveTo(px + 12, by + 19);
    ctx.lineTo(px + 16, by + 25);
    ctx.lineTo(px + 20, by + 19);
    ctx.closePath();
    ctx.fill();
  }

  function drawMiner(npc) {
    var px = npc.x * TILE;
    var py = npc.y * TILE;
    var hover = Math.sin(performance.now() / 600) * 1.5;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 30, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    var by = py + hover;

    // Overalls (brown)
    ctx.fillStyle = '#7a5c3a';
    ctx.fillRect(px + 8, by + 14, 16, 14);
    // Suspender straps
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(px + 10, by + 14, 3, 10);
    ctx.fillRect(px + 19, by + 14, 3, 10);

    // Head
    ctx.fillStyle = '#f5c6a0';
    ctx.fillRect(px + 10, by + 5, 12, 10);

    // Hard hat (yellow)
    ctx.fillStyle = '#e6b800';
    ctx.fillRect(px + 8, by + 2, 16, 5);
    // Hat brim
    ctx.fillRect(px + 6, by + 6, 20, 2);

    // Headlamp (glowing)
    var glow = 0.6 + Math.sin(performance.now() / 400) * 0.3;
    ctx.fillStyle = 'rgba(255, 255, 150, ' + glow + ')';
    ctx.beginPath();
    ctx.arc(px + 16, by + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.fillRect(px + 12, by + 9, 3, 2);
    ctx.fillRect(px + 17, by + 9, 3, 2);

    // Stubble
    ctx.fillStyle = '#b0967a';
    ctx.fillRect(px + 12, by + 13, 8, 2);

    // Boots
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(px + 8, by + 26, 6, 4);
    ctx.fillRect(px + 18, by + 26, 6, 4);
  }

  function drawNPCs() {
    var npcs = getZone().npcs;
    for (var i = 0; i < npcs.length; i++) {
      drawNPC(npcs[i]);
    }
  }

  function drawInteractIndicator() {
    if (dialog.active || puzzle.active || player.moving) return;
    var info = adjacentInteractable();
    if (!info) return;

    var px = info.x * TILE + 16;
    var py = info.y * TILE - 4 + Math.sin(performance.now() / 300) * 3;

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', px, py);
    ctx.textAlign = 'left';
  }

  // --- UI overlays (screen space) ---

  function drawDialog() {
    var boxH = 110;
    var boxY = VP_H - boxH - 12;
    var boxX = 12;
    var boxW = VP_W - 24;

    ctx.fillStyle = 'rgba(10, 10, 30, 0.92)';
    roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();

    ctx.strokeStyle = '#4dabf7';
    ctx.lineWidth = 2;
    roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.stroke();

    ctx.fillStyle = '#4dabf7';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText(dialog.npc.name, boxX + 16, boxY + 24);

    ctx.fillStyle = '#e0e0e0';
    ctx.font = '13px "Courier New", monospace';
    wrapText(dialog.npc.lines[dialog.lineIndex], boxX + 16, boxY + 46, boxW - 32, 18);

    var pulse = 0.5 + Math.sin(performance.now() / 400) * 0.5;
    if (dialog.lineIndex < dialog.npc.lines.length - 1) {
      ctx.fillStyle = 'rgba(77, 171, 247, ' + pulse + ')';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('▼ Space', boxX + boxW - 90, boxY + boxH - 14);
    } else {
      ctx.fillStyle = 'rgba(136, 136, 136, ' + pulse + ')';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('Space to close', boxX + boxW - 130, boxY + boxH - 14);
    }
  }

  function drawPuzzle() {
    var boxW = 400;
    var boxH = 180;
    var boxX = (VP_W - boxW) / 2;
    var boxY = (VP_H - boxH) / 2;

    ctx.fillStyle = 'rgba(10, 10, 30, 0.95)';
    roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.fill();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillText('PUZZLE', boxX + 16, boxY + 26);

    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(puzzle.data.question, boxX + boxW / 2, boxY + 62);
    ctx.textAlign = 'left';

    if (puzzle.data.hint) {
      ctx.fillStyle = '#888';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(puzzle.data.hint, boxX + boxW / 2, boxY + 82);
      ctx.textAlign = 'left';
    }

    var inputX = boxX + 100;
    var inputY = boxY + 95;
    var inputW = 200;
    var inputH = 32;

    ctx.fillStyle = '#16213e';
    ctx.fillRect(inputX, inputY, inputW, inputH);
    ctx.strokeStyle = '#4dabf7';
    ctx.lineWidth = 2;
    ctx.strokeRect(inputX, inputY, inputW, inputH);

    ctx.fillStyle = '#fff';
    ctx.font = '18px "Courier New", monospace';
    ctx.textAlign = 'center';
    var displayText = puzzle.input || '';
    var blink = Math.floor(performance.now() / 500) % 2 === 0;
    ctx.fillText(displayText + (blink ? '|' : ''), inputX + inputW / 2, inputY + 23);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#888';
    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Enter to submit · Esc to close', boxX + boxW / 2, boxY + boxH - 18);
    ctx.textAlign = 'left';

    if (puzzle.feedback) {
      var elapsed = performance.now() - puzzle.feedbackTime;
      var alpha = Math.max(0, 1 - elapsed / 2000);
      if (puzzle.feedback === 'Correct!') {
        ctx.fillStyle = 'rgba(81, 207, 102, ' + alpha + ')';
      } else {
        ctx.fillStyle = 'rgba(255, 107, 107, ' + alpha + ')';
      }
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(puzzle.feedback, boxX + boxW / 2, boxY + boxH - 38);
      ctx.textAlign = 'left';
    }
  }

  // --- Utility ---

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(text, x, y, maxW, lineH) {
    var words = text.split(' ');
    var line = '';
    var curY = y;
    for (var i = 0; i < words.length; i++) {
      var test = line + (line ? ' ' : '') + words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, curY);
        line = words[i];
        curY += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, curY);
  }

  // --- Start ---

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
