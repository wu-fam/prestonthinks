import { TILE, VP_W, VP_H } from "./config.js";
import { roundRect, wrapText } from "./draw.js";
import { player } from "./player.js";
import { dialog, currentLine, hasMoreLines } from "./dialog.js";
import { puzzle, feedbackAlpha } from "./puzzle.js";
import { boss } from "./boss.js";
import { combat } from "./combat.js";
import { adjacentInteractable } from "./interact.js";

const MONO = '"Courier New", monospace';

export function drawInteractIndicator(ctx, env) {
  if (dialog.active || puzzle.active || player.moving) return;

  const target = adjacentInteractable();
  if (!target) return;

  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 16px " + MONO;
  ctx.textAlign = "center";
  ctx.fillText(
    "!",
    target.x * TILE + 16,
    target.y * TILE - 4 + Math.sin(env.time / 300) * 3,
  );
  ctx.textAlign = "left";
}

export function drawBossHud(ctx, env) {
  drawHearts(ctx);
  drawBossHealthBar(ctx);
  drawStatusFlags(ctx);

  // Flicker while briefly invulnerable.
  if (combat.invuln > 0 && Math.floor(env.time / 100) % 2 === 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(0, 0, VP_W, VP_H);
  }
}

function drawHearts(ctx) {
  for (let i = 0; i < combat.maxHp; i++) {
    const x = 10 + i * 28;
    const y = 10;
    ctx.fillStyle = i < combat.hp ? "#ff4444" : "#444";
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 6);
    ctx.bezierCurveTo(x + 10, y + 2, x + 4, y, x, y + 6);
    ctx.bezierCurveTo(x - 2, y + 12, x + 10, y + 18, x + 10, y + 20);
    ctx.bezierCurveTo(x + 10, y + 18, x + 22, y + 12, x + 20, y + 6);
    ctx.bezierCurveTo(x + 16, y, x + 10, y + 2, x + 10, y + 6);
    ctx.fill();
  }
}

function drawBossHealthBar(ctx) {
  const w = 200;
  const h = 14;
  const x = (VP_W - w) / 2;
  const y = VP_H - 30;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = "#333";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#cc2222";
  ctx.fillRect(x, y, w * (boss.hp / boss.maxHp), h);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px " + MONO;
  ctx.textAlign = "center";
  ctx.fillText("FOREST GUARDIAN", VP_W / 2, y - 6);
  ctx.textAlign = "left";
}

function drawStatusFlags(ctx) {
  let x = 10 + combat.maxHp * 28 + 8;
  ctx.font = "bold 11px " + MONO;

  if (combat.shield) {
    ctx.fillStyle = "#4488ff";
    ctx.fillText("SHIELD", x, 24);
    x += 60;
  }
  if (combat.speedTimer > 0) {
    ctx.fillStyle = "#ffdd33";
    ctx.fillText("SPEED", x, 24);
  }
}

export function drawDialog(ctx, env) {
  const h = 110;
  const w = VP_W - 24;
  const x = 12;
  const y = VP_H - h - 12;

  panel(ctx, x, y, w, h, 8, "rgba(10, 10, 30, 0.92)", "#4dabf7");

  ctx.fillStyle = "#4dabf7";
  ctx.font = "bold 14px " + MONO;
  ctx.fillText(dialog.speaker, x + 16, y + 24);

  ctx.fillStyle = "#e0e0e0";
  ctx.font = "13px " + MONO;
  wrapText(ctx, currentLine(), x + 16, y + 46, w - 32, 18);

  const pulse = 0.5 + Math.sin(env.time / 400) * 0.5;
  ctx.font = "12px " + MONO;
  if (hasMoreLines()) {
    ctx.fillStyle = "rgba(77, 171, 247, " + pulse + ")";
    ctx.fillText("▼ Space", x + w - 90, y + h - 14);
  } else {
    ctx.fillStyle = "rgba(136, 136, 136, " + pulse + ")";
    ctx.fillText("Space to close", x + w - 130, y + h - 14);
  }
}

export function drawPuzzle(ctx, env) {
  const w = 400;
  const h = 180;
  const x = (VP_W - w) / 2;
  const y = (VP_H - h) / 2;

  panel(ctx, x, y, w, h, 10, "rgba(10, 10, 30, 0.95)", "#ffd700");

  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 13px " + MONO;
  ctx.fillText("PUZZLE", x + 16, y + 26);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e0e0e0";
  ctx.font = "bold 18px " + MONO;
  ctx.fillText(puzzle.data.question, x + w / 2, y + 62);

  if (puzzle.data.hint) {
    ctx.fillStyle = "#888";
    ctx.font = "11px " + MONO;
    ctx.fillText(puzzle.data.hint, x + w / 2, y + 82);
  }
  ctx.textAlign = "left";

  drawAnswerField(ctx, env, x + 100, y + 95, 200, 32);

  ctx.textAlign = "center";
  ctx.fillStyle = "#888";
  ctx.font = "11px " + MONO;
  ctx.fillText("Enter to submit · Esc to close", x + w / 2, y + h - 18);

  const alpha = feedbackAlpha(env.time);
  if (alpha > 0) {
    ctx.fillStyle = puzzle.feedback === "Correct!"
      ? "rgba(81, 207, 102, " + alpha + ")"
      : "rgba(255, 107, 107, " + alpha + ")";
    ctx.font = "bold 14px " + MONO;
    ctx.fillText(puzzle.feedback, x + w / 2, y + h - 38);
  }
  ctx.textAlign = "left";
}

function drawAnswerField(ctx, env, x, y, w, h) {
  ctx.fillStyle = "#16213e";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#4dabf7";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  const caret = Math.floor(env.time / 500) % 2 === 0 ? "|" : "";
  ctx.fillStyle = "#fff";
  ctx.font = "18px " + MONO;
  ctx.textAlign = "center";
  ctx.fillText(puzzle.input + caret, x + w / 2, y + 23);
  ctx.textAlign = "left";
}

function panel(ctx, x, y, w, h, radius, fill, stroke) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, radius);
  ctx.stroke();
}
