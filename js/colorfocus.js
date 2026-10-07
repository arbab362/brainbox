/* =========================================================
   colorfocus.js — Color Focus (Stroop-style attention test)
   A color NAME is shown rendered in a different INK color.
   The player must tap the ink color, ignoring the word.
   ========================================================= */

const CF_COLORS = [
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Yellow", hex: "#f59e0b" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Cyan", hex: "#22d3ee" },
];
const CF_CONFIG = {
  easy: { rounds: 8, roundSeconds: 4, forceMismatch: false },
  medium: { rounds: 10, roundSeconds: 3, forceMismatch: true },
  hard: { rounds: 12, roundSeconds: 2, forceMismatch: true },
};

let cfState = { difficulty: "easy", round: 0, score: 0, streak: 0, correctCount: 0, seconds: 0, timer: null, roundTimer: null, roundRemaining: 0, answered: false, inkColor: null };

function cfPick(exclude) {
  const pool = exclude ? CF_COLORS.filter((c) => c.name !== exclude) : CF_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function cfSetDifficulty(diff) {
  cfState.difficulty = diff;
  document.querySelectorAll('#page-colorfocus .diff-btn').forEach((b) => b.classList.toggle("active", b.dataset.diff === diff));
}

function cfRenderRound() {
  const cfg = CF_CONFIG[cfState.difficulty];
  document.getElementById("cfRound").textContent = `${cfState.round + 1} / ${cfg.rounds}`;
  document.getElementById("cfFeedback").textContent = "";

  const wordColor = cfPick();
  const inkColor = cfg.forceMismatch ? cfPick(wordColor.name) : (Math.random() < 0.5 ? cfPick(wordColor.name) : wordColor);
  cfState.inkColor = inkColor;

  const wordEl = document.getElementById("cfWordDisplay");
  wordEl.textContent = wordColor.name.toUpperCase();
  wordEl.style.color = inkColor.hex;

  const optionsEl = document.getElementById("cfOptions");
  optionsEl.innerHTML = "";
  const choices = [inkColor, ...CF_COLORS.filter((c) => c.name !== inkColor.name).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
  choices.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn color-opt";
    btn.style.borderColor = c.hex;
    btn.innerHTML = `<span class="color-dot" style="background:${c.hex}"></span>${c.name}`;
    btn.addEventListener("click", () => cfHandleAnswer(c.name === inkColor.name, btn));
    optionsEl.appendChild(btn);
  });

  cfState.answered = false;
  cfState.roundRemaining = cfg.roundSeconds;
  document.getElementById("cfTimer").textContent = cfState.roundRemaining.toFixed(1);
  clearInterval(cfState.roundTimer);
  cfState.roundTimer = setInterval(() => {
    cfState.roundRemaining -= 0.1;
    document.getElementById("cfTimer").textContent = Math.max(0, cfState.roundRemaining).toFixed(1);
    if (cfState.roundRemaining <= 0) { clearInterval(cfState.roundTimer); cfHandleAnswer(false, null); }
  }, 100);
}

function cfHandleAnswer(isCorrect, btn) {
  if (cfState.answered) return;
  cfState.answered = true;
  clearInterval(cfState.roundTimer);
  document.querySelectorAll("#cfOptions .opt-btn").forEach((b) => (b.disabled = true));

  if (isCorrect) {
    if (btn) btn.classList.add("correct");
    cfState.streak += 1;
    cfState.correctCount += 1;
    const gain = 12 + cfState.streak * 2;
    cfState.score += gain;
    document.getElementById("cfFeedback").textContent = `Correct! +${gain} points`;
  } else {
    if (btn) btn.classList.add("wrong");
    cfState.streak = 0;
    document.querySelectorAll("#cfOptions .opt-btn").forEach((b) => { if (b.textContent.trim() === cfState.inkColor.name) b.classList.add("correct"); });
    document.getElementById("cfFeedback").textContent = cfState.roundRemaining <= 0 ? "Too slow!" : `Not quite — it was ${cfState.inkColor.name}`;
  }
  document.getElementById("cfScore").textContent = cfState.score;
  document.getElementById("cfStreak").textContent = cfState.streak;

  setTimeout(() => {
    cfState.round += 1;
    if (cfState.round >= CF_CONFIG[cfState.difficulty].rounds) cfFinish();
    else cfRenderRound();
  }, 700);
}

function cfFinish() {
  clearInterval(cfState.timer);
  clearInterval(cfState.roundTimer);
  document.getElementById("cfGameBody").style.display = "none";
  document.getElementById("cfStartBtn").style.display = "inline-block";
  document.getElementById("cfStartBtn").textContent = "Play Again";
  document.querySelectorAll('#page-colorfocus .diff-btn').forEach((b) => (b.disabled = false));

  const total = CF_CONFIG[cfState.difficulty].rounds;
  document.getElementById("cfResult").textContent = `Challenge Complete — Score: ${cfState.correctCount} / ${total} (${cfState.score} pts)`;
  const accuracy = Math.round((cfState.correctCount / total) * 100);
  recordGameResult("colorfocus", cfState.score, accuracy, cfState.seconds, cfState.difficulty);
  showToast("Color Focus complete!");
}

function cfStart() {
  clearInterval(cfState.timer);
  clearInterval(cfState.roundTimer);
  const diff = cfState.difficulty;
  cfState = { difficulty: diff, round: 0, score: 0, streak: 0, correctCount: 0, seconds: 0, timer: null, roundTimer: null, roundRemaining: 0, answered: false, inkColor: null };
  document.getElementById("cfResult").textContent = "";
  document.getElementById("cfGameBody").style.display = "block";
  document.getElementById("cfStartBtn").style.display = "none";
  document.getElementById("cfScore").textContent = "0";
  document.getElementById("cfStreak").textContent = "0";
  document.querySelectorAll('#page-colorfocus .diff-btn').forEach((b) => (b.disabled = true));
  cfRenderRound();
  cfState.timer = setInterval(() => { cfState.seconds += 1; }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("cfGameBody").style.display = "none";
  document.getElementById("cfStartBtn").addEventListener("click", cfStart);
  document.querySelectorAll('#page-colorfocus .diff-btn').forEach((b) => b.addEventListener("click", () => cfSetDifficulty(b.dataset.diff)));
  cfSetDifficulty("easy");
});
