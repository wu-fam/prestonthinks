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
        x: 5, y: 27,
        name: 'Old Sage',
        lines: [
          'Ah, a traveler! Welcome to the Enchanted Forest.',
          'An evil sorcerer has cast a shadow over our land.',
          'Solve the puzzle gates to prove your worth and advance.',
          'Walk up to a gate and press Space to try the puzzle.',
        ],
      },
      {
        x: 5, y: 15,
        name: 'Forest Sprite',
        lines: [
          'Psst! Need help with the puzzles?',
          'Take your time. The gates accept numbers only.',
          'Type your answer and press Enter to submit!',
        ],
      },
      {
        x: 32, y: 15,
        name: 'Gate Guardian',
        lines: [
          'The sorcerer sealed these gates with arithmetic magic.',
          'Only those who can solve them may pass.',
        ],
      },
    ],
    puzzles: [
      {
        x: 19, y: 20, id: 'forest-gate-1',
        question: 'What is 145 + 278?',
        answer: 423,
        hint: 'Solve to open the first gate',
        solvedTiles: [[19, 19], [20, 19]],
      },
      {
        x: 20, y: 12, id: 'forest-gate-2',
        question: 'What is 12 x 15?',
        answer: 180,
        hint: 'Solve to open the second gate',
        solvedTiles: [[19, 11], [20, 11]],
      },
      {
        x: 8, y: 15, id: 'forest-gate-3',
        question: 'What is 144 / 12?',
        answer: 12,
        hint: 'Solve to find a hidden treasure',
        solvedTiles: [[7, 15], [7, 16]],
      },
    ],
    transitions: [
      { x: 19, y: 0, zone: 'caves', spawnX: 10, spawnY: 13 },
      { x: 20, y: 0, zone: 'caves', spawnX: 11, spawnY: 13 },
    ],
  };

  ZONES.caves = {
    map: buildCavesMap(),
    npcs: [
      {
        x: 10, y: 7,
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
      { x: 10, y: 14, zone: 'forest', spawnX: 19, spawnY: 1 },
      { x: 11, y: 14, zone: 'forest', spawnX: 20, spawnY: 1 },
    ],
  };

  function buildForestMap() {
    var W = 40, H = 30;
    var m = [];
    for (var y = 0; y < H; y++) {
      m[y] = [];
      for (var x = 0; x < W; x++) {
        m[y][x] = GRASS;
      }
    }

    function fill(x1, y1, x2, y2, t) {
      for (var yy = y1; yy <= y2; yy++)
        for (var xx = x1; xx <= x2; xx++)
          m[yy][xx] = t;
    }
    function set(x, y, t) { m[y][x] = t; }

    // Border trees
    fill(0, 0, W - 1, 0, TREE);
    fill(0, H - 1, W - 1, H - 1, TREE);
    fill(0, 0, 0, H - 1, TREE);
    fill(W - 1, 0, W - 1, H - 1, TREE);

    // Second layer of border trees for thickness
    fill(1, 1, W - 2, 1, TREE);
    fill(1, H - 2, W - 2, H - 2, TREE);
    fill(1, 1, 1, H - 2, TREE);
    fill(W - 2, 1, W - 2, H - 2, TREE);

    // Open up interior
    fill(2, 2, W - 3, H - 3, GRASS);

    // Main path running north-south through center
    fill(19, 2, 20, 27, PATH);

    // Wider path at south entrance
    fill(17, 25, 22, 27, PATH);

    // South entrance opening in border
    fill(17, 28, 22, 29, PATH);

    // North exit opening
    set(19, 0, TRANSITION);
    set(20, 0, TRANSITION);
    set(19, 1, PATH);
    set(20, 1, PATH);

    // Gate 1: blocks path at row 19 (between south start and middle)
    set(19, 19, DOOR);
    set(20, 19, DOOR);
    // Puzzle stone next to gate 1
    set(19, 20, PUZZLE);

    // Gate 2: blocks path at row 11 (between middle and north exit)
    set(19, 11, DOOR);
    set(20, 11, DOOR);
    // Puzzle stone next to gate 2
    set(20, 12, PUZZLE);

    // West clearing (side area with optional puzzle)
    fill(3, 13, 10, 18, GRASS);
    fill(11, 15, 18, 16, PATH);
    // Puzzle gate blocking entry to west clearing
    set(7, 15, DOOR);
    set(7, 16, DOOR);
    set(8, 15, PUZZLE);

    // Water pond in west clearing
    fill(4, 14, 6, 16, WATER);

    // Scattered trees for atmosphere
    var treePlaces = [
      [4,4],[7,3],[12,4],[15,5],[25,4],[30,3],[35,5],[33,8],
      [4,8],[8,7],[14,8],[25,8],[28,6],[35,10],[5,22],[8,23],
      [13,22],[15,25],[25,22],[28,24],[33,22],[35,25],[30,26],
      [4,10],[36,15],[34,18],[3,21],[10,9],[27,10],[32,13],
      [14,15],[14,18],[26,15],[26,18],[33,20],[5,5],[36,4],
      [12,26],[27,26],[34,27],[3,26],
    ];
    for (var i = 0; i < treePlaces.length; i++) {
      var tx = treePlaces[i][0], ty = treePlaces[i][1];
      if (m[ty] && m[ty][tx] === GRASS) set(tx, ty, TREE);
    }

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
    x: 19, y: 26, facing: 'up',
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
