export const dialog = { active: false, speaker: "", lines: [], lineIndex: 0 };

export function openDialog(speaker, lines) {
  dialog.active = true;
  dialog.speaker = speaker;
  dialog.lines = lines;
  dialog.lineIndex = 0;
}

function closeDialog() {
  dialog.active = false;
  dialog.speaker = "";
  dialog.lines = [];
  dialog.lineIndex = 0;
}

export function advanceDialog() {
  dialog.lineIndex++;
  if (dialog.lineIndex >= dialog.lines.length) closeDialog();
}

export function currentLine() {
  return dialog.lines[dialog.lineIndex] || "";
}

export function hasMoreLines() {
  return dialog.lineIndex < dialog.lines.length - 1;
}
