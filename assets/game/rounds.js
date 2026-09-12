import { EQUATIONS, FACTOR_PRODUCTS, PATTERNS } from "./questions.js";

const LIE_CHANCE = 0.5;
const CHOICE_COUNT = 4;

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateRound(boss) {
  const taunt = pickRandom(boss.taunts);
  if (boss.mechanic === "factor") return factorRound(taunt);
  if (boss.mechanic === "pattern") return patternRound(taunt);
  return bluffRound(taunt);
}

// The boss states an answer; which button is correct depends on whether it lied.
function bluffRound(taunt) {
  const eq = pickRandom(EQUATIONS);
  const lying = Math.random() < LIE_CHANCE;
  const shown = lying ? wrongNumber(eq.answer) : eq.answer;

  return {
    kind: "bluff",
    prompt: eq.expr + " = " + shown,
    taunt,
    correctLabel: eq.answer,
    options: [
      { label: "True", correct: !lying },
      { label: "False", correct: lying },
    ],
  };
}

function factorRound(taunt) {
  const fp = pickRandom(FACTOR_PRODUCTS);
  const a = Math.min(fp.a, fp.b);
  const b = Math.max(fp.a, fp.b);
  const correctLabel = a + " × " + b;

  const labels = new Set([correctLabel]);
  while (labels.size < CHOICE_COUNT) {
    const pair = wrongFactorPair(a, b, fp.product);
    labels.add(pair[0] + " × " + pair[1]);
  }

  return {
    kind: "choice",
    prompt: "What multiplies to make " + fp.product + "?",
    taunt,
    correctLabel,
    options: toOptions(labels, correctLabel),
  };
}

function patternRound(taunt) {
  const p = pickRandom(PATTERNS);

  const labels = new Set([String(p.next)]);
  while (labels.size < CHOICE_COUNT) {
    labels.add(String(wrongNumber(p.next)));
  }

  return {
    kind: "choice",
    prompt: p.seq.join(", ") + ", ?",
    taunt,
    correctLabel: p.next,
    options: toOptions(labels, String(p.next)),
  };
}

function toOptions(labels, correctLabel) {
  return shuffle([...labels]).map((label) => ({
    label,
    correct: label === correctLabel,
  }));
}

// A near miss, never zero or negative.
function wrongNumber(correct) {
  const offset = pickRandom([-3, -2, -1, 1, 2, 3]);
  const wrong = correct + offset;
  return wrong <= 0 ? correct + Math.abs(offset) : wrong;
}

// A plausible pair that does not actually make the product.
function wrongFactorPair(correctA, correctB, product) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const a = Math.max(2, correctA + pickRandom([-2, -1, 1, 2]));
    const b = Math.max(2, correctB + pickRandom([-2, -1, 1, 2]));
    const low = Math.min(a, b);
    const high = Math.max(a, b);
    if (low * high !== product) return [low, high];
  }
  return [correctA + 1, correctB + 1];
}
