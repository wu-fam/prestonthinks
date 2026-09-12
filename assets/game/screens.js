import { html } from "./html.js";
import { BOSSES } from "./bosses.js";
import { isBossDefeated, getPlayerName } from "./storage.js";

function healthBar(current, max, label, type) {
  const pct = Math.max(0, (current / max) * 100);
  return html`
    <div class="health-bar ${type}">
      <div class="health-bar-label">${label} ${current}/${max}</div>
      <div class="health-bar-track">
        <div class="health-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function portrait(boss, extraClass = "") {
  return html`<div class="boss-portrait ${extraClass}">
    <img src="${boss.portrait}" alt="${boss.name}">
  </div>`;
}

// Bosses unlock in order: the next one opens only once the previous falls.
export function renderSelect() {
  let unlocked = true;
  const cards = BOSSES.map((boss, index) => {
    const defeated = isBossDefeated(boss);
    const card = unlocked ? unlockedCard(boss, index, defeated) : lockedCard(boss);
    if (!defeated) unlocked = false;
    return card;
  });

  return html`
    <div class="screen-select">
      <h2 class="select-title">Choose Your Battle</h2>
      <div class="boss-grid">${cards}</div>
    </div>`;
}

function unlockedCard(boss, index, defeated) {
  const badge = defeated
    ? html`<p class="boss-card-badge defeated-badge">&#x2714;</p>`
    : "";
  return html`
    <div class="boss-card" data-action="select-boss" data-boss="${index}">
      <div class="boss-card-portrait">
        <img src="${boss.portrait}" alt="${boss.name}">
      </div>
      <p class="boss-card-name">${boss.name}</p>
      ${badge}
    </div>`;
}

function lockedCard(boss) {
  return html`
    <div class="boss-card locked">
      <div class="boss-card-portrait"><div class="locked-silhouette">?</div></div>
      <p class="boss-card-name">${boss.name}</p>
      <p class="boss-card-badge locked-badge">&#x1F512;</p>
    </div>`;
}

export function renderIntro(boss) {
  const badge = isBossDefeated(boss)
    ? html`<p class="intro-defeated">&#x2714; Defeated</p>`
    : "";

  return html`
    <div class="screen-intro">
      <h2 class="boss-name">${boss.name}</h2>
      ${portrait(boss)}
      ${badge}
      <p class="boss-flavor">${boss.flavor}</p>
      <div class="name-input">
        <label class="name-label" for="player-name">Your name</label>
        <input id="player-name" class="name-field" type="text" maxlength="12"
               placeholder="Player" value="${getPlayerName()}">
      </div>
      <div class="intro-buttons">
        <button class="btn btn-back" data-action="back-to-select">Back</button>
        <button class="btn btn-action" data-action="start-fight">Fight!</button>
      </div>
    </div>`;
}

export function renderFight(state, limits) {
  const questionPct = Math.max(0, (state.questionTimeLeft / limits.questionTime) * 100);
  const urgent = state.fightTimeLeft <= limits.urgentAt ? " urgent" : "";
  const round = state.round;

  return html`
    <div class="screen-fight">
      <div class="fight-timer">
        <span class="fight-timer-text${urgent}">${formatClock(state.fightTimeLeft)}</span>
      </div>
      <div class="fight-top">
        ${portrait(state.boss)}
        <div class="health-bars">
          ${healthBar(state.bossHp, limits.maxHp, state.boss.name, "boss")}
          ${healthBar(state.playerHp, limits.maxHp, state.playerName, "player")}
        </div>
      </div>
      <div class="equation-area">
        <div class="question-timer-track">
          <div class="question-timer-fill" style="width:${questionPct}%"></div>
        </div>
        <p class="equation-text">${round.prompt}</p>
        <p class="boss-speech">"${round.taunt}"</p>
      </div>
      ${answerButtons(round, state.resolving)}
    </div>`;
}

function answerButtons(round, resolving) {
  const disabled = resolving ? html`disabled` : "";
  const gridClass = round.kind === "bluff" ? "" : " choice-grid";

  const buttons = round.options.map((option, index) => {
    const style = round.kind === "bluff"
      ? (index === 0 ? "btn-true" : "btn-false")
      : "btn-choice";
    return html`<button class="btn ${style}" data-action="answer"
      data-option="${index}" ${disabled}>${option.label}</button>`;
  });

  return html`<div class="answer-buttons${gridClass}">${buttons}</div>`;
}

export function renderWin(boss) {
  return html`
    <div class="screen-win">
      <p class="result-title">You Win!</p>
      ${portrait(boss, "faded")}
      <p class="result-text">${boss.name}${boss.defeatLine}</p>
      <button class="btn btn-action" data-action="play-again">Play Again</button>
    </div>`;
}

export function renderLose(state) {
  const message = state.fightTimeLeft <= 0
    ? html`Time ran out! ${state.boss.name} wins.`
    : html`${state.boss.name} got you! The answer was ${state.round.correctLabel}.`;

  return html`
    <div class="screen-lose">
      <p class="result-title">Defeated!</p>
      ${portrait(state.boss)}
      <p class="result-text">${message}</p>
      <button class="btn btn-action" data-action="try-again">Try Again</button>
    </div>`;
}

export function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ":" + String(s).padStart(2, "0");
}
