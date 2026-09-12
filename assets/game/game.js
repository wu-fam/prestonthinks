import { BOSSES } from "./bosses.js";
import { generateRound } from "./rounds.js";
import { savePlayerName, markBossDefeated } from "./storage.js";
import {
  renderSelect, renderIntro, renderFight, renderWin, renderLose, formatClock,
} from "./screens.js";

const RULES = {
  maxHp: 5,
  damage: 1,
  questionTime: 10,
  fightTime: 60,
  urgentAt: 10,
  feedbackDelay: 900,
};

const FEEDBACK_LABELS = { hit: "HIT!", miss: "MISS!", timeout: "TOO SLOW!" };
const SHAKE_MS = 300;
const OVERLAY_MS = 800;

let container;
let state;
let questionTimer = null;
let fightTimer = null;

function resetGame() {
  state = {
    screen: "SELECT",
    boss: null,
    playerName: "Player",
    playerHp: RULES.maxHp,
    bossHp: RULES.maxHp,
    round: null,
    resolving: false,
    questionTimeLeft: RULES.questionTime,
    fightTimeLeft: RULES.fightTime,
  };
}

const SCREENS = {
  SELECT: () => renderSelect(),
  INTRO: () => renderIntro(state.boss),
  FIGHT: () => renderFight(state, RULES),
  WIN: () => renderWin(state.boss),
  LOSE: () => renderLose(state),
};

function render() {
  container.innerHTML = String(SCREENS[state.screen]());
}

function clearTimers() {
  clearInterval(questionTimer);
  clearInterval(fightTimer);
  questionTimer = null;
  fightTimer = null;
}

function startFightTimer() {
  state.fightTimeLeft = RULES.fightTime;
  fightTimer = setInterval(() => {
    state.fightTimeLeft--;
    updateTimerDisplay();
    if (state.fightTimeLeft <= 0) {
      clearTimers();
      state.screen = "LOSE";
      render();
    }
  }, 1000);
}

function startQuestionTimer() {
  state.questionTimeLeft = RULES.questionTime;
  clearInterval(questionTimer);
  questionTimer = setInterval(() => {
    state.questionTimeLeft--;
    updateTimerDisplay();
    if (state.questionTimeLeft <= 0) {
      clearInterval(questionTimer);
      questionTimer = null;
      onQuestionTimeout();
    }
  }, 1000);
}

// Patched in place: a full re-render each second would wipe the overlay.
function updateTimerDisplay() {
  const fill = container.querySelector(".question-timer-fill");
  if (fill) {
    const pct = Math.max(0, (state.questionTimeLeft / RULES.questionTime) * 100);
    fill.style.width = pct + "%";
  }

  const clock = container.querySelector(".fight-timer-text");
  if (clock) {
    clock.textContent = formatClock(state.fightTimeLeft);
    clock.classList.toggle("urgent", state.fightTimeLeft <= RULES.urgentAt);
  }
}

function showFeedback(type) {
  const overlay = document.createElement("div");
  overlay.className = "feedback-overlay";
  const label = document.createElement("div");
  label.className = "feedback-text " + type;
  label.textContent = FEEDBACK_LABELS[type];
  overlay.appendChild(label);
  container.appendChild(overlay);

  container.classList.add("shake");
  setTimeout(() => container.classList.remove("shake"), SHAKE_MS);
  setTimeout(() => overlay.remove(), OVERLAY_MS);
}

// Renders before adding the overlay, so the re-render does not wipe it.
function resolveTurn(correct, feedback) {
  if (state.resolving) return;
  state.resolving = true;

  clearInterval(questionTimer);
  questionTimer = null;

  if (correct) state.bossHp = Math.max(0, state.bossHp - RULES.damage);
  else state.playerHp = Math.max(0, state.playerHp - RULES.damage);

  render();
  showFeedback(feedback);

  setTimeout(() => {
    state.resolving = false;

    if (state.bossHp <= 0) {
      clearTimers();
      state.screen = "WIN";
      markBossDefeated(state.boss);
    } else if (state.playerHp <= 0) {
      clearTimers();
      state.screen = "LOSE";
    } else {
      state.round = generateRound(state.boss);
      startQuestionTimer();
    }
    render();
  }, RULES.feedbackDelay);
}

function onQuestionTimeout() {
  if (state.screen !== "FIGHT") return;
  resolveTurn(false, "timeout");
}

function startFight() {
  const field = document.getElementById("player-name");
  const name = (field ? field.value.trim() : "") || "Player";
  savePlayerName(name);

  state.playerName = name;
  state.playerHp = RULES.maxHp;
  state.bossHp = RULES.maxHp;
  state.round = generateRound(state.boss);
  state.screen = "FIGHT";

  render();
  startFightTimer();
  startQuestionTimer();
}

const ACTIONS = {
  "select-boss": (button) => {
    const boss = BOSSES[Number(button.dataset.boss)];
    if (!boss) return;
    state.boss = boss;
    state.screen = "INTRO";
    render();
  },
  "back-to-select": () => {
    state.screen = "SELECT";
    render();
  },
  "start-fight": startFight,
  answer: (button) => {
    const option = state.round.options[Number(button.dataset.option)];
    if (!option) return;
    resolveTurn(option.correct, option.correct ? "hit" : "miss");
  },
  "play-again": restart,
  "try-again": restart,
};

function restart() {
  clearTimers();
  resetGame();
  render();
}

function onClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;

  const action = ACTIONS[button.dataset.action];
  if (action) action(button);
}

function init() {
  container = document.getElementById("game");
  if (!container) return;

  container.addEventListener("click", onClick);
  resetGame();
  render();
}

// Modules are deferred, so the DOM is already parsed when this runs.
init();
