(function () {
  'use strict';

  var PLAYER_MAX_HP = 5;
  var BOSS_MAX_HP = 5;
  var PLAYER_DAMAGE = 1;
  var BOSS_DAMAGE = 1;
  var LIE_CHANCE = 0.5;
  var FEEDBACK_DELAY = 900;
  var QUESTION_TIME = 10;
  var FIGHT_TIME = 60;

  var BOSSES = [
    {
      name: 'Captain Bluff',
      flavor: '"Every answer I give is correct. Would I lie to you?"',
      storageKey: 'boss-captain-bluff',
      portrait: '/assets/game/liar-boss.svg',
      mechanic: 'bluff',
      taunts: [
        'This is definitely correct!',
        'Trust me, I did the math.',
        'Would I lie to you?',
        "I'm 100% sure about this one.",
        'Easy. Obviously right.',
      ],
    },
    {
      name: 'Viking Orc',
      flavor: '"I\'ll break every number in half. Can you put them back together?"',
      storageKey: 'boss-viking-orc',
      portrait: '/assets/game/splitter-boss.svg',
      mechanic: 'factor',
      taunts: [
        'Split this!',
        'Too many pieces for you!',
        'Can you even multiply?',
        'This one is tricky...',
        'CHOP CHOP!',
      ],
    },
    {
      name: 'Wizard Snake',
      flavor: '"My patterns are flawlesssss. You will never keep up."',
      storageKey: 'boss-wizard-snake',
      portrait: '/assets/game/pattern-boss.svg',
      mechanic: 'pattern',
      taunts: [
        'Follow the pattern... if you can.',
        'Sssso predictable.',
        'My sequencesss are perfect.',
        'You will never keep up!',
        'What comesss next?',
      ],
    },
  ];

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

  var FACTOR_PRODUCTS = [
    { product: 36, a: 6, b: 6 },
    { product: 42, a: 6, b: 7 },
    { product: 48, a: 6, b: 8 },
    { product: 54, a: 6, b: 9 },
    { product: 56, a: 7, b: 8 },
    { product: 63, a: 7, b: 9 },
    { product: 72, a: 8, b: 9 },
    { product: 81, a: 9, b: 9 },
    { product: 45, a: 5, b: 9 },
    { product: 40, a: 5, b: 8 },
    { product: 35, a: 5, b: 7 },
    { product: 24, a: 4, b: 6 },
    { product: 32, a: 4, b: 8 },
    { product: 28, a: 4, b: 7 },
    { product: 64, a: 8, b: 8 },
    { product: 27, a: 3, b: 9 },
  ];

  var PATTERNS = [
    { seq: [2, 4, 6, 8], next: 10, rule: '+2' },
    { seq: [5, 10, 15, 20], next: 25, rule: '+5' },
    { seq: [3, 6, 9, 12], next: 15, rule: '+3' },
    { seq: [7, 14, 21, 28], next: 35, rule: '+7' },
    { seq: [10, 20, 30, 40], next: 50, rule: '+10' },
    { seq: [2, 4, 8, 16], next: 32, rule: '×2' },
    { seq: [3, 9, 27, 81], next: 243, rule: '×3' },
    { seq: [1, 4, 16, 64], next: 256, rule: '×4' },
    { seq: [100, 90, 80, 70], next: 60, rule: '-10' },
    { seq: [50, 45, 40, 35], next: 30, rule: '-5' },
    { seq: [1, 2, 4, 7], next: 11, rule: '+1,+2,+3,...' },
    { seq: [2, 6, 12, 20], next: 30, rule: '+4,+6,+8,...' },
    { seq: [1, 1, 2, 3], next: 5, rule: 'fib' },
    { seq: [1, 3, 6, 10], next: 15, rule: 'triangular' },
    { seq: [4, 8, 16, 32], next: 64, rule: '×2' },
    { seq: [11, 22, 33, 44], next: 55, rule: '+11' },
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

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function generateWrongAnswer(correct) {
    var offsets = [-3, -2, -1, 1, 2, 3];
    var offset = pickRandom(offsets);
    var wrong = correct + offset;
    if (wrong <= 0) wrong = correct + Math.abs(offset);
    return wrong;
  }

  function generateWrongFactorPair(correctA, correctB, product) {
    var attempts = 0;
    while (attempts < 20) {
      var a = correctA + pickRandom([-2, -1, 1, 2]);
      var b = correctB + pickRandom([-2, -1, 1, 2]);
      if (a < 2) a = 2;
      if (b < 2) b = 2;
      if (a > b) { var tmp = a; a = b; b = tmp; }
      if (a * b !== product) return { a: a, b: b };
      attempts++;
    }
    return { a: correctA + 1, b: correctB + 1 };
  }

  function generateBluffRound() {
    var eq = pickRandom(EQUATIONS);
    var lying = Math.random() < LIE_CHANCE;
    var displayed = lying ? generateWrongAnswer(eq.answer) : eq.answer;
    state.currentRound = {
      mechanic: 'bluff',
      expr: eq.expr,
      correctAnswer: eq.answer,
      displayedAnswer: displayed,
      lying: lying,
      taunt: pickRandom(state.currentBoss.taunts),
    };
  }

  function generateFactorRound() {
    var fp = pickRandom(FACTOR_PRODUCTS);
    var a = Math.min(fp.a, fp.b);
    var b = Math.max(fp.a, fp.b);
    var choices = [{ a: a, b: b, label: a + ' × ' + b }];
    var used = {};
    used[a + ',' + b] = true;
    while (choices.length < 4) {
      var wrong = generateWrongFactorPair(a, b, fp.product);
      var wa = Math.min(wrong.a, wrong.b);
      var wb = Math.max(wrong.a, wrong.b);
      var key = wa + ',' + wb;
      if (!used[key]) {
        used[key] = true;
        choices.push({ a: wa, b: wb, label: wa + ' × ' + wb });
      }
    }
    choices = shuffle(choices);
    var correctIdx = -1;
    for (var i = 0; i < choices.length; i++) {
      if (choices[i].a === a && choices[i].b === b) { correctIdx = i; break; }
    }
    state.currentRound = {
      mechanic: 'factor',
      prompt: 'What multiplies to make ' + fp.product + '?',
      choices: choices.map(function (c) { return c.label; }),
      correctIdx: correctIdx,
      correctAnswer: a + ' × ' + b,
      taunt: pickRandom(state.currentBoss.taunts),
    };
  }

  function generatePatternRound() {
    var p = pickRandom(PATTERNS);
    var choices = [p.next];
    while (choices.length < 4) {
      var wrong = p.next + pickRandom([-5, -3, -2, -1, 1, 2, 3, 5]);
      if (wrong <= 0) wrong = p.next + Math.abs(pickRandom([1, 2, 3, 5]));
      if (choices.indexOf(wrong) === -1) choices.push(wrong);
    }
    choices = shuffle(choices);
    var correctIdx = choices.indexOf(p.next);
    state.currentRound = {
      mechanic: 'pattern',
      prompt: p.seq.join(', ') + ', ?',
      choices: choices.map(function (c) { return '' + c; }),
      correctIdx: correctIdx,
      correctAnswer: p.next,
      taunt: pickRandom(state.currentBoss.taunts),
    };
  }

  function generateRound() {
    var mechanic = state.currentBoss.mechanic;
    if (mechanic === 'factor') generateFactorRound();
    else if (mechanic === 'pattern') generatePatternRound();
    else generateBluffRound();
  }

  function clearTimers() {
    if (state.questionInterval) clearInterval(state.questionInterval);
    if (state.fightInterval) clearInterval(state.fightInterval);
    state.questionInterval = null;
    state.fightInterval = null;
  }

  function startFightTimer() {
    state.fightTimeLeft = FIGHT_TIME;
    state.fightInterval = setInterval(function () {
      state.fightTimeLeft--;
      updateTimerDisplay();
      if (state.fightTimeLeft <= 0) {
        clearTimers();
        state.screen = 'LOSE';
        render();
      }
    }, 1000);
  }

  function startQuestionTimer() {
    state.questionTimeLeft = QUESTION_TIME;
    if (state.questionInterval) clearInterval(state.questionInterval);
    state.questionInterval = setInterval(function () {
      state.questionTimeLeft--;
      updateTimerDisplay();
      if (state.questionTimeLeft <= 0) {
        clearInterval(state.questionInterval);
        state.questionInterval = null;
        questionTimeout();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    var qEl = container.querySelector('.question-timer-fill');
    var fEl = container.querySelector('.fight-timer-text');
    if (qEl) qEl.style.width = Math.max(0, (state.questionTimeLeft / QUESTION_TIME) * 100) + '%';
    if (fEl) {
      var m = Math.floor(state.fightTimeLeft / 60);
      var s = state.fightTimeLeft % 60;
      fEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      if (state.fightTimeLeft <= 10) fEl.classList.add('urgent');
      else fEl.classList.remove('urgent');
    }
  }

  function questionTimeout() {
    if (state.resolving || state.screen !== 'FIGHT') return;
    state.resolving = true;
    state.playerHP = Math.max(0, state.playerHP - BOSS_DAMAGE);
    showFeedback('timeout');
    render();
    setTimeout(function () {
      state.resolving = false;
      if (state.playerHP <= 0) {
        clearTimers();
        state.screen = 'LOSE';
      } else {
        generateRound();
        startQuestionTimer();
      }
      render();
    }, FEEDBACK_DELAY);
  }

  function resetGame() {
    state = {
      screen: 'SELECT',
      currentBoss: null,
      playerHP: PLAYER_MAX_HP,
      bossHP: BOSS_MAX_HP,
      currentRound: null,
      resolving: false,
      questionTimeLeft: QUESTION_TIME,
      fightTimeLeft: FIGHT_TIME,
      questionInterval: null,
      fightInterval: null,
    };
  }

  function healthBar(current, max, label, type) {
    var pct = Math.max(0, (current / max) * 100);
    return (
      '<div class="health-bar ' + type + '">' +
        '<div class="health-bar-label">' + escapeHtml(label) + ' ' + current + '/' + max + '</div>' +
        '<div class="health-bar-track">' +
          '<div class="health-bar-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function isBossDefeated(b) {
    try { return localStorage.getItem(b.storageKey) === 'defeated'; } catch (e) { return false; }
  }

  function renderSelect() {
    var cards = '';
    var allPriorDefeated = true;
    for (var i = 0; i < BOSSES.length; i++) {
      var b = BOSSES[i];
      var defeated = isBossDefeated(b);
      var locked = b.locked || !allPriorDefeated;
      if (locked) {
        cards +=
          '<div class="boss-card locked">' +
            '<div class="boss-card-portrait"><div class="locked-silhouette">?</div></div>' +
            '<p class="boss-card-name">' + escapeHtml(b.name) + '</p>' +
            '<p class="boss-card-badge locked-badge">&#x1F512;</p>' +
          '</div>';
      } else {
        var badge = defeated ? '<p class="boss-card-badge defeated-badge">&#x2714;</p>' : '';
        cards +=
          '<div class="boss-card" data-action="select-boss" data-boss="' + i + '">' +
            '<div class="boss-card-portrait"><img src="' + b.portrait + '" alt="' + escapeHtml(b.name) + '"></div>' +
            '<p class="boss-card-name">' + escapeHtml(b.name) + '</p>' +
            badge +
          '</div>';
      }
      if (!b.locked && !defeated) allPriorDefeated = false;
    }
    return (
      '<div class="screen-select">' +
        '<h2 class="select-title">Choose Your Battle</h2>' +
        '<div class="boss-grid">' + cards + '</div>' +
      '</div>'
    );
  }

  function renderIntro() {
    var boss = state.currentBoss;
    var defeated = false;
    try { defeated = localStorage.getItem(boss.storageKey) === 'defeated'; } catch (e) {}
    var badge = defeated ? '<p style="color:#51cf66;font-size:0.85rem;">&#x2714; Defeated</p>' : '';
    var savedName = getPlayerName();
    return (
      '<div class="screen-intro">' +
        '<h2 class="boss-name">' + escapeHtml(boss.name) + '</h2>' +
        '<div class="boss-portrait"><img src="' + boss.portrait + '" alt="' + escapeHtml(boss.name) + '"></div>' +
        badge +
        '<p class="boss-flavor">' + boss.flavor + '</p>' +
        '<div class="name-input">' +
          '<label class="name-label" for="player-name">Your name</label>' +
          '<input id="player-name" class="name-field" type="text" maxlength="12" placeholder="Player" value="' + escapeHtml(savedName) + '">' +
        '</div>' +
        '<div class="intro-buttons">' +
          '<button class="btn btn-back" data-action="back-to-select">Back</button>' +
          '<button class="btn btn-action" data-action="start-fight">Fight!</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderAnswerButtons() {
    var r = state.currentRound;
    var disabled = state.resolving ? ' disabled' : '';
    if (r.mechanic === 'bluff') {
      return (
        '<div class="answer-buttons">' +
          '<button class="btn btn-true" data-action="answer-true"' + disabled + '>True</button>' +
          '<button class="btn btn-false" data-action="answer-false"' + disabled + '>False</button>' +
        '</div>'
      );
    }
    var html = '<div class="answer-buttons choice-grid">';
    for (var i = 0; i < r.choices.length; i++) {
      html += '<button class="btn btn-choice" data-action="answer-choice" data-choice="' + i + '"' + disabled + '>' + escapeHtml(r.choices[i]) + '</button>';
    }
    html += '</div>';
    return html;
  }

  function renderEquationArea() {
    var r = state.currentRound;
    var qPct = Math.max(0, (state.questionTimeLeft / QUESTION_TIME) * 100);
    if (r.mechanic === 'bluff') {
      return (
        '<div class="equation-area">' +
          '<div class="question-timer-track"><div class="question-timer-fill" style="width:' + qPct + '%"></div></div>' +
          '<p class="equation-text">' + r.expr + ' = ' + r.displayedAnswer + '</p>' +
          '<p class="boss-speech">"' + escapeHtml(r.taunt) + '"</p>' +
        '</div>'
      );
    }
    return (
      '<div class="equation-area">' +
        '<div class="question-timer-track"><div class="question-timer-fill" style="width:' + qPct + '%"></div></div>' +
        '<p class="equation-text">' + escapeHtml(r.prompt) + '</p>' +
        '<p class="boss-speech">"' + escapeHtml(r.taunt) + '"</p>' +
      '</div>'
    );
  }

  function renderFight() {
    var boss = state.currentBoss;
    var fm = Math.floor(state.fightTimeLeft / 60);
    var fs = state.fightTimeLeft % 60;
    var fightTimeStr = fm + ':' + (fs < 10 ? '0' : '') + fs;
    var urgentClass = state.fightTimeLeft <= 10 ? ' urgent' : '';
    return (
      '<div class="screen-fight">' +
        '<div class="fight-timer">' +
          '<span class="fight-timer-text' + urgentClass + '">' + fightTimeStr + '</span>' +
        '</div>' +
        '<div class="fight-top">' +
          '<div class="boss-portrait"><img src="' + boss.portrait + '" alt="' + escapeHtml(boss.name) + '"></div>' +
          '<div class="health-bars">' +
            healthBar(state.bossHP, BOSS_MAX_HP, boss.name, 'boss') +
            healthBar(state.playerHP, PLAYER_MAX_HP, state.playerName, 'player') +
          '</div>' +
        '</div>' +
        renderEquationArea() +
        renderAnswerButtons() +
      '</div>'
    );
  }

  function renderWin() {
    var boss = state.currentBoss;
    var msgs = {
      bluff: ' has been defeated. No more lies!',
      factor: ' has been defeated. No more chopping!',
      pattern: ' has been defeated. Ssssequence broken!',
    };
    var msg = escapeHtml(boss.name) + (msgs[boss.mechanic] || ' has been defeated!');
    return (
      '<div class="screen-win">' +
        '<p class="result-title">You Win!</p>' +
        '<div class="boss-portrait"><img src="' + boss.portrait + '" alt="' + escapeHtml(boss.name) + '" style="opacity:0.4"></div>' +
        '<p class="result-text">' + msg + '</p>' +
        '<button class="btn btn-action" data-action="play-again">Play Again</button>' +
      '</div>'
    );
  }

  function renderLose() {
    var boss = state.currentBoss;
    var r = state.currentRound;
    var msg;
    if (state.fightTimeLeft <= 0) {
      msg = 'Time ran out! ' + escapeHtml(boss.name) + ' wins.';
    } else {
      msg = escapeHtml(boss.name) + ' got you! The answer was ' + r.correctAnswer + '.';
    }
    return (
      '<div class="screen-lose">' +
        '<p class="result-title">Defeated!</p>' +
        '<div class="boss-portrait"><img src="' + boss.portrait + '" alt="' + escapeHtml(boss.name) + '"></div>' +
        '<p class="result-text">' + msg + '</p>' +
        '<button class="btn btn-action" data-action="try-again">Try Again</button>' +
      '</div>'
    );
  }

  function render() {
    var html;
    switch (state.screen) {
      case 'SELECT': html = renderSelect(); break;
      case 'INTRO':  html = renderIntro();  break;
      case 'FIGHT':  html = renderFight();  break;
      case 'WIN':    html = renderWin();    break;
      case 'LOSE':   html = renderLose();   break;
    }
    container.innerHTML = html;
  }

  function showFeedback(type) {
    var overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    var labels = { hit: 'HIT!', miss: 'MISS!', timeout: 'TOO SLOW!' };
    var label = labels[type] || 'MISS!';
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

  function resolveBluff(playerSaidTrue) {
    var r = state.currentRound;
    return (playerSaidTrue && !r.lying) || (!playerSaidTrue && r.lying);
  }

  function resolveChoice(choiceIdx) {
    return choiceIdx === state.currentRound.correctIdx;
  }

  function resolveAnswer(correct) {
    if (state.resolving) return;
    state.resolving = true;
    if (state.questionInterval) clearInterval(state.questionInterval);
    state.questionInterval = null;
    render();

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
        clearTimers();
        state.screen = 'WIN';
        try { localStorage.setItem(state.currentBoss.storageKey, 'defeated'); } catch (e) {}
      } else if (state.playerHP <= 0) {
        clearTimers();
        state.screen = 'LOSE';
      } else {
        generateRound();
        startQuestionTimer();
      }
      render();
    }, FEEDBACK_DELAY);
  }

  function handleClick(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn || btn.disabled) return;

    var action = btn.getAttribute('data-action');
    switch (action) {
      case 'select-boss':
        var idx = parseInt(btn.getAttribute('data-boss'), 10);
        var boss = BOSSES[idx];
        if (!boss || boss.locked) break;
        state.currentBoss = boss;
        state.screen = 'INTRO';
        render();
        break;
      case 'back-to-select':
        state.screen = 'SELECT';
        render();
        break;
      case 'start-fight':
        var nameInput = document.getElementById('player-name');
        var name = (nameInput ? nameInput.value.trim() : '') || 'Player';
        savePlayerName(name);
        state.playerHP = PLAYER_MAX_HP;
        state.bossHP = BOSS_MAX_HP;
        state.playerName = name;
        state.screen = 'FIGHT';
        generateRound();
        render();
        startFightTimer();
        startQuestionTimer();
        break;
      case 'try-again':
      case 'play-again':
        clearTimers();
        resetGame();
        render();
        break;
      case 'answer-true':
        resolveAnswer(resolveBluff(true));
        break;
      case 'answer-false':
        resolveAnswer(resolveBluff(false));
        break;
      case 'answer-choice':
        var ci = parseInt(btn.getAttribute('data-choice'), 10);
        resolveAnswer(resolveChoice(ci));
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
