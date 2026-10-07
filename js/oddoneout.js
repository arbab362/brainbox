/* =========================================================
   oddoneout.js — Odd One Out
   A grid of matching items with one outlier to spot.
   Difficulty controls how subtle the outlier is.
   ========================================================= */

const OOO_ROUNDS = {
  easy: [
    { base: "🍎", odd: "🍌" }, { base: "🐶", odd: "🐱" }, { base: "⚽", odd: "🏀" },
    { base: "🌞", odd: "🌙" }, { base: "🚗", odd: "🚲" }, { base: "🎵", odd: "🎨" },
    { base: "☕", odd: "🍵" }, { base: "🔑", odd: "🔒" },
  ],
  medium: [
    { base: "🔵", odd: "🟣" }, { base: "🐦", odd: "🦉" }, { base: "🌲", odd: "🌴" },
    { base: "⭐", odd: "✨" }, { base: "🍋", odd: "🍈" }, { base: "🔺", odd: "🔻" },
    { base: "🟠", odd: "🟡" }, { base: "🐟", odd: "🐠" },
  ],
  hard: [
    { base: "🔵", odd: "🔷" }, { base: "⚪", odd: "⚫" }, { base: "🟩", odd: "🟢" },
    { base: "🔺", odd: "🔻" }, { base: "🍏", odd: "🍐" }, { base: "🔶", odd: "🔸" },
    { base: "⬛", odd: "🟫" }, { base: "🟦", odd: "🟪" },
  ],
};
const OOO_GRID_SIZE = 9; // 9 tiles — 8 base + 1 odd

let oooState = { difficulty: "easy", index: 0, score: 0, correctCount: 0, seconds: 0, timer: null, answered: false };

function oooFormatTime(sec) { const m = String(Math.floor(sec / 60)).padStart(2, "0"); const s = String(sec % 60).padStart(2, "0"); return `${m}:${s}`; }

function oooSetDifficulty(diff) {
  oooState.difficulty = diff;
  document.querySelectorAll('#page-oddoneout .diff-btn').forEach((b) => b.classList.toggle("active", b.dataset.diff === diff));
}

function oooRenderRound() {
  const list = OOO_ROUNDS[oooState.difficulty];
  const round = list[oooState.index];
  document.getElementById("oooRound").textContent = `${oooState.index + 1} / ${list.length}`;
  document.getElementById("oooFeedback").textContent = "";

  const tiles = Array.from({ length: OOO_GRID_SIZE - 1 }, () => round.base);
  const oddPos = Math.floor(Math.random() * OOO_GRID_SIZE);
  tiles.splice(oddPos, 0, round.odd);

  const grid = document.getElementById("oooGrid");
  grid.innerHTML = "";
  tiles.forEach((item, i) => {
    const tile = document.createElement("button");
    tile.className = "ooo-tile";
    tile.textContent = item;
    tile.addEventListener("click", () => oooHandleAnswer(i === oddPos, tile));
    grid.appendChild(tile);
  });
  oooState.answered = false;
  document.getElementById("oooNextBtn").style.display = "none";
}

function oooHandleAnswer(isCorrect, tile) {
  if (oooState.answered) return;
  oooState.answered = true;
  document.querySelectorAll("#oooGrid .ooo-tile").forEach((t) => (t.disabled = true));

  if (isCorrect) {
    tile.classList.add("correct");
    oooState.correctCount += 1;
    oooState.score += 15;
    document.getElementById("oooFeedback").textContent = "Correct! Sharp eyes.";
  } else {
    tile.classList.add("wrong");
    document.getElementById("oooFeedback").textContent = "Not quite — look closer next time.";
  }
  document.getElementById("oooScore").textContent = oooState.score;
  document.getElementById("oooNextBtn").style.display = "inline-block";
}

function oooNext() {
  oooState.index += 1;
  if (oooState.index >= OOO_ROUNDS[oooState.difficulty].length) oooFinish();
  else oooRenderRound();
}

function oooFinish() {
  clearInterval(oooState.timer);
  document.getElementById("oooGameBody").style.display = "none";
  document.getElementById("oooNextBtn").style.display = "none";
  document.getElementById("oooStartBtn").style.display = "inline-block";
  document.getElementById("oooStartBtn").textContent = "Play Again";
  document.querySelectorAll('#page-oddoneout .diff-btn').forEach((b) => (b.disabled = false));

  const total = OOO_ROUNDS[oooState.difficulty].length;
  document.getElementById("oooResult").textContent = `Challenge Complete — Score: ${oooState.correctCount} / ${total} (${oooState.score} pts)`;
  const accuracy = Math.round((oooState.correctCount / total) * 100);
  recordGameResult("oddoneout", oooState.score, accuracy, oooState.seconds, oooState.difficulty);
  showToast("Odd One Out complete!");
}

function oooStart() {
  clearInterval(oooState.timer);
  const diff = oooState.difficulty;
  oooState = { difficulty: diff, index: 0, score: 0, correctCount: 0, seconds: 0, timer: null, answered: false };
  document.getElementById("oooResult").textContent = "";
  document.getElementById("oooGameBody").style.display = "block";
  document.getElementById("oooStartBtn").style.display = "none";
  document.getElementById("oooScore").textContent = "0";
  document.querySelectorAll('#page-oddoneout .diff-btn').forEach((b) => (b.disabled = true));
  oooRenderRound();
  oooState.timer = setInterval(() => { oooState.seconds += 1; document.getElementById("oooTimer").textContent = oooFormatTime(oooState.seconds); }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("oooGameBody").style.display = "none";
  document.getElementById("oooStartBtn").addEventListener("click", oooStart);
  document.getElementById("oooNextBtn").addEventListener("click", oooNext);
  document.querySelectorAll('#page-oddoneout .diff-btn').forEach((b) => b.addEventListener("click", () => oooSetDifficulty(b.dataset.diff)));
  oooSetDifficulty("easy");
});
