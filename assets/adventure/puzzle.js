const FEEDBACK_MS = 2000;
const CLOSE_DELAY_MS = 800;
const MAX_DIGITS = 10;

export const puzzle = {
  active: false,
  data: null,
  input: "",
  feedback: "",
  feedbackTime: 0,
  onSolve: null,
};

export function openPuzzle(data, onSolve) {
  puzzle.active = true;
  puzzle.data = data;
  puzzle.input = "";
  puzzle.feedback = "";
  puzzle.feedbackTime = 0;
  puzzle.onSolve = onSolve;
}

function closePuzzle() {
  puzzle.active = false;
  puzzle.data = null;
  puzzle.input = "";
  puzzle.feedback = "";
  puzzle.feedbackTime = 0;
  puzzle.onSolve = null;
}

export function feedbackAlpha(now) {
  if (!puzzle.feedback) return 0;
  return Math.max(0, 1 - (now - puzzle.feedbackTime) / FEEDBACK_MS);
}

function setFeedback(text) {
  puzzle.feedback = text;
  puzzle.feedbackTime = performance.now();
}

export function submitAnswer() {
  if (!puzzle.active || !puzzle.data) return;

  const answer = parseInt(puzzle.input, 10);
  if (Number.isNaN(answer)) {
    setFeedback("Enter a number!");
    return;
  }

  if (answer !== puzzle.data.answer) {
    setFeedback("Try again!");
    puzzle.input = "";
    return;
  }

  const onSolve = puzzle.onSolve;
  if (onSolve) onSolve(puzzle.data);
  setFeedback("Correct!");
  setTimeout(closePuzzle, CLOSE_DELAY_MS);
}

export function handlePuzzleKey(key) {
  if (key === "Escape") {
    closePuzzle();
    return;
  }
  if (key === "Enter") {
    submitAnswer();
    return;
  }
  if (key === "Backspace") {
    puzzle.input = puzzle.input.slice(0, -1);
    return;
  }
  if (key === "-" && puzzle.input.length === 0) {
    puzzle.input = "-";
    return;
  }
  if (key >= "0" && key <= "9" && puzzle.input.length < MAX_DIGITS) {
    puzzle.input += key;
  }
}
