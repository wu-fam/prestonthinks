(function () {
  'use strict';

  var TILE = 32;
  var COLS = 20;
  var ROWS = 15;
  var W = COLS * TILE;
  var H = ROWS * TILE;
  var MOVE_MS = 140;

  var GRASS = 0;
  var TREE = 1;
  var PATH = 2;
  var DOOR = 4;

  var SOLID = [TREE, DOOR];

  var MAP = [
    [1,1,1,1,1,1,1,1,1,4,4,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,2,2,0,0,0,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,0,2,2,0,0,0,0,0,0,1,0,1],
    [1,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,0,0,2,2,2,2,0,0,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,0,2,2,0,0,0,0,0,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,2,2,2,2,1,1,1,1,1,1,1,1],
  ];

  var NPCS = [
    {
      x: 6, y: 6,
      name: 'Old Sage',
      lines: [
        'Ah, a traveler! Welcome to the Enchanted Forest.',
        'An evil sorcerer has cast a shadow over our land.',
        'To reach his tower, you must prove your worth.',
        'But that path is not yet open... come back soon.',
      ],
    },
  ];

  var player = {
    x: 9, y: 13, facing: 'up',
    moving: false, moveProgress: 0,
    px: 0, py: 0,
    startPx: 0, startPy: 0,
    targetPx: 0, targetPy: 0,
    targetTileX: 0, targetTileY: 0,
  };

  var keys = {};
  var dialog = { active: false, npc: null, lineIndex: 0 };
  var canvas, ctx;
  var lastTime = 0;
  var spaceHandled = false;

  function isSolid(tile) {
    for (var i = 0; i < SOLID.length; i++) {
      if (SOLID[i] === tile) return true;
    }
    return false;
  }

  function npcAt(tx, ty) {
    for (var i = 0; i < NPCS.length; i++) {
      if (NPCS[i].x === tx && NPCS[i].y === ty) return NPCS[i];
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
      if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) continue;
      if (npcAt(tx, ty)) return { type: 'npc', x: tx, y: ty };
      if (MAP[ty][tx] === DOOR) return { type: 'door', x: tx, y: ty };
    }
    return null;
  }

  function handleSpace() {
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

    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return;

    var npc = npcAt(tx, ty);
    if (npc) {
      dialog.active = true;
      dialog.npc = npc;
      dialog.lineIndex = 0;
      return;
    }

    if (MAP[ty][tx] === DOOR) {
      dialog.active = true;
      dialog.npc = { name: '???', lines: ['The path ahead is blocked by a mysterious force...'] };
      dialog.lineIndex = 0;
    }
  }

  function init() {
    var container = document.getElementById('adventure');
    if (!container) return;

    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.setAttribute('tabindex', '1');
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    player.px = player.x * TILE;
    player.py = player.y * TILE;

    var hint = document.createElement('p');
    hint.className = 'adventure-hint';
    hint.textContent = 'Arrow keys to move · Spacebar to interact';
    container.appendChild(hint);

    window.addEventListener('keydown', function (e) {
      var dominated = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '];
      if (dominated.indexOf(e.key) !== -1) e.preventDefault();
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

  function loop(time) {
    var dt = time - lastTime;
    lastTime = time;
    if (dt > 100) dt = 100;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    if (dialog.active) return;

    if (player.moving) {
      player.moveProgress += dt;
      var t = Math.min(player.moveProgress / MOVE_MS, 1);
      var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      player.px = player.startPx + (player.targetPx - player.startPx) * ease;
      player.py = player.startPy + (player.targetPy - player.startPy) * ease;
      if (t >= 1) {
        player.moving = false;
        player.x = player.targetTileX;
        player.y = player.targetTileY;
        player.px = player.x * TILE;
        player.py = player.y * TILE;
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

    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
    if (isSolid(MAP[ny][nx])) return;
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
    ctx.clearRect(0, 0, W, H);
    drawMap();
    drawNPCs();
    drawPlayer();
    drawInteractIndicator();
    if (dialog.active) drawDialog();
  }

  function drawMap() {
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var px = x * TILE;
        var py = y * TILE;
        var tile = MAP[y][x];

        ctx.fillStyle = '#5b8c3e';
        ctx.fillRect(px, py, TILE, TILE);

        ctx.fillStyle = '#4d7a34';
        if ((x + y) % 3 === 0) {
          ctx.fillRect(px + 10, py + 14, 2, 5);
          ctx.fillRect(px + 22, py + 6, 2, 5);
        }
        if ((x * 7 + y * 13) % 5 === 0) {
          ctx.fillRect(px + 4, py + 22, 2, 4);
        }

        if (tile === TREE) drawTree(px, py);
        else if (tile === PATH) drawPath(px, py, x, y);
        else if (tile === DOOR) drawDoor(px, py);
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

  function drawPath(px, py, x, y) {
    ctx.fillStyle = '#c9b47c';
    ctx.fillRect(px, py, TILE, TILE);

    ctx.fillStyle = '#b8a36c';
    if ((x + y) % 2 === 0) {
      ctx.fillRect(px + 6, py + 9, 3, 3);
      ctx.fillRect(px + 19, py + 23, 3, 3);
    }
    if ((x * 3 + y * 7) % 4 === 0) {
      ctx.fillRect(px + 14, py + 5, 2, 2);
    }
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
    for (var i = 0; i < NPCS.length; i++) {
      drawNPC(NPCS[i]);
    }
  }

  function drawInteractIndicator() {
    if (dialog.active || player.moving) return;
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

  function drawDialog() {
    var boxH = 110;
    var boxY = H - boxH - 12;
    var boxX = 12;
    var boxW = W - 24;

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
