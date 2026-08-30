(function () {
  'use strict';

  var PLAYER_MAX_HP = 5;
  var BOSS_MAX_HP = 5;
  var PLAYER_DAMAGE = 1;
  var BOSS_DAMAGE = 1;
  var LIE_CHANCE = 0.5;
  var FEEDBACK_DELAY = 900;

  var BOSS = {
    name: 'Captain Bluff',
    flavor: '"Every answer I give is correct. Would I lie to you?"',
    storageKey: 'boss-captain-bluff',
    taunts: [
      'This is definitely correct!',
      'Trust me, I did the math.',
      'Would I lie to you?',
      "I'm 100% sure about this one.",
      'Easy. Obviously right.',
    ],
  };

  var EQUATIONS = [
    { expr: '7 × 8', answer: 56 },
    { expr: '9 × 6', answer: 54 },
    { expr: '12 × 4', answer: 48 },
    { expr: '8 × 5', answer: 40 },
    { expr: '11 × 7', answer: 77 },
    { expr: '6 × 6', answer: 36 },
    { expr: '144 ÷ 12', answer: 12 },
    { expr: '81 ÷ 9', answer: 9 },
    { expr: '56 ÷ 7', answer: 8 },
    { expr: '23 + 49', answer: 72 },
    { expr: '67 + 28', answer: 95 },
    { expr: '135 + 47', answer: 182 },
    { expr: '100 - 37', answer: 63 },
    { expr: '83 - 46', answer: 37 },
    { expr: '200 - 88', answer: 112 },
    { expr: '15 × 3', answer: 45 },
    { expr: '72 ÷ 8', answer: 9 },
    { expr: '48 + 76', answer: 124 },
    { expr: '150 - 63', answer: 87 },
    { expr: '9 × 9', answer: 81 },
  ];

  var PLAYER_NAME_KEY = 'player-name';

  var state;
  var container;

  function getPlayerName() {
    try { return localStorage.getItem(PLAYER_NAME_KEY) || ''; } catch (e) { return ''; }
  }

  function savePlayerName(name) {
    try { localStorage.setItem(PLAYER_NAME_KEY, name); } catch (e) {}
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateWrongAnswer(correct) {
    var offsets = [-3, -2, -1, 1, 2, 3];
    var offset = pickRandom(offsets);
    var wrong = correct + offset;
    if (wrong <= 0) wrong = correct + Math.abs(offset);
    return wrong;
  }

  function generateRound() {
    var eq = pickRandom(EQUATIONS);
    var lying = Math.random() < LIE_CHANCE;
    var displayed = lying ? generateWrongAnswer(eq.answer) : eq.answer;
    state.currentRound = {
      expr: eq.expr,
      correctAnswer: eq.answer,
      displayedAnswer: displayed,
      lying: lying,
      taunt: pickRandom(BOSS.taunts),
    };
  }

  function resetGame() {
    state = {
      screen: 'INTRO',
      playerHP: PLAYER_MAX_HP,
      bossHP: BOSS_MAX_HP,
      currentRound: null,
      resolving: false,
    };
  }

  function healthBar(current, max, label, type) {
    var pct = Math.max(0, (current / max) * 100);
    return (
      '<div class="health-bar ' + type + '">' +
        '<div class="health-bar-label">' + label + ' ' + current + '/' + max + '</div>' +
        '<div class="health-bar-track">' +
          '<div class="health-bar-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderIntro() {
    var defeated = localStorage.getItem(BOSS.storageKey) === 'defeated';
    var badge = defeated ? '<p style="color:#51cf66;font-size:0.85rem;">&#x2714; Defeated</p>' : '';
    var savedName = getPlayerName();
    return (
      '<div class="screen-intro">' +
        '<h2 class="boss-name">' + BOSS.name + '</h2>' +
        '<div class="boss-portrait"><img src="/assets/game/liar-boss.svg" alt="' + BOSS.name + '"></div>' +
        badge +
        '<p class="boss-flavor">' + BOSS.flavor + '</p>' +
        '<div class="name-input">' +
          '<label class="name-label" for="player-name">Your name</label>' +
          '<input id="player-name" class="name-field" type="text" maxlength="12" placeholder="Player" value="' + savedName + '">' +
        '</div>' +
        '<button class="btn btn-action" data-action="start-fight">Fight!</button>' +
      '</div>'
    );
  }

  function renderFight() {
    var r = state.currentRound;
    return (
      '<div class="screen-fight">' +
        '<div class="fight-top">' +
          '<div class="boss-portrait"><img src="/assets/game/liar-boss.svg" alt="' + BOSS.name + '"></div>' +
          '<div class="health-bars">' +
            healthBar(state.bossHP, BOSS_MAX_HP, BOSS.name, 'boss') +
            healthBar(state.playerHP, PLAYER_MAX_HP, state.playerName, 'player') +
          '</div>' +
        '</div>' +
        '<div class="equation-area">' +
          '<p class="equation-text">' + r.expr + ' = ' + r.displayedAnswer + '</p>' +
          '<p class="boss-speech">"' + r.taunt + '"</p>' +
        '</div>' +
        '<div class="answer-buttons">' +
          '<button class="btn btn-true" data-action="answer-true"' + (state.resolving ? ' disabled' : '') + '>True</button>' +
          '<button class="btn btn-false" data-action="answer-false"' + (state.resolving ? ' disabled' : '') + '>False</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderWin() {
    return (
      '<div class="screen-win">' +
        '<p class="result-title">You Win!</p>' +
        '<div class="boss-portrait"><img src="/assets/game/liar-boss.svg" alt="' + BOSS.name + '" style="opacity:0.4"></div>' +
        '<p class="result-text">' + BOSS.name + ' has been defeated. No more lies!</p>' +
        '<button class="btn btn-action" data-action="play-again">Play Again</button>' +
      '</div>'
    );
  }

  function renderLose() {
    return (
      '<div class="screen-lose">' +
        '<p class="result-title">Defeated!</p>' +
        '<div class="boss-portrait"><img src="/assets/game/liar-boss.svg" alt="' + BOSS.name + '"></div>' +
        '<p class="result-text">' + BOSS.name + ' fooled you. The correct answer was ' + state.currentRound.correctAnswer + '.</p>' +
        '<button class="btn btn-action" data-action="try-again">Try Again</button>' +
      '</div>'
    );
  }

  function render() {
    var html;
    switch (state.screen) {
      case 'INTRO': html = renderIntro(); break;
      case 'FIGHT': html = renderFight(); break;
      case 'WIN':   html = renderWin();   break;
      case 'LOSE':  html = renderLose();  break;
    }
    container.innerHTML = html;
  }

  function showFeedback(type, extra) {
    var overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    var label = type === 'hit' ? 'HIT!' : 'MISS!';
    overlay.innerHTML =
      '<div class="feedback-text ' + type + '">' + label + '</div>';
    container.appendChild(overlay);
    container.classList.add('shake');
    setTimeout(function () {
      container.classList.remove('shake');
    }, 300);
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 800);
  }

  function resolveAnswer(playerSaidTrue) {
    if (state.resolving) return;
    state.resolving = true;
    render();

    var r = state.currentRound;
    var bossWasLying = r.lying;
    var correct =
      (playerSaidTrue && !bossWasLying) || (!playerSaidTrue && bossWasLying);

    if (correct) {
      state.bossHP = Math.max(0, state.bossHP - PLAYER_DAMAGE);
      showFeedback('hit');
    } else {
      state.playerHP = Math.max(0, state.playerHP - BOSS_DAMAGE);
      showFeedback('miss');
    }

    setTimeout(function () {
      state.resolving = false;
      if (state.bossHP <= 0) {
        state.screen = 'WIN';
        try { localStorage.setItem(BOSS.storageKey, 'defeated'); } catch (e) {}
      } else if (state.playerHP <= 0) {
        state.screen = 'LOSE';
      } else {
        generateRound();
      }
      render();
    }, FEEDBACK_DELAY);
  }

  function handleClick(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn || btn.disabled) return;

    var action = btn.getAttribute('data-action');
    switch (action) {
      case 'start-fight':
        var nameInput = document.getElementById('player-name');
        var name = (nameInput ? nameInput.value.trim() : '') || 'Player';
        savePlayerName(name);
        resetGame();
        state.playerName = name;
        state.screen = 'FIGHT';
        generateRound();
        render();
        break;
      case 'try-again':
      case 'play-again':
        resetGame();
        state.playerName = getPlayerName() || 'Player';
        state.screen = 'FIGHT';
        generateRound();
        render();
        break;
      case 'answer-true':
        resolveAnswer(true);
        break;
      case 'answer-false':
        resolveAnswer(false);
        break;
    }
  }

  function init() {
    container = document.getElementById('game');
    if (!container) return;
    container.addEventListener('click', handleClick);
    resetGame();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
