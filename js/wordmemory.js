/* =========================================================
   wordmemory.js — Word Memory
   Study phase shows a set of words briefly, then the recall
   phase asks the player to pick out exactly those words from
   a larger pool of distractors.
   ========================================================= */

const WM_POOLS = {
  easy: { pool: ["Cloud", "River", "Stone", "Flame", "Bridge", "Forest", "Silver", "Candle", "Harbor", "Meadow"], show: 5, studySeconds: 6 },
  medium: { pool: ["Horizon", "Crystal", "Thunder", "Lantern", "Compass", "Journey", "Whisper", "Canyon", "Glacier", "Falcon", "Mirror", "Echo", "Garden", "Velvet"], show: 7, studySeconds: 5 },
  hard: { pool: ["Labyrinth", "Momentum", "Cascade", "Paradox", "Eclipse", "Sanctuary", "Resonance", "Quasar", "Nebula", "Odyssey", "Phantom", "Tundra", "Vortex", "Zenith", "Catalyst", "Pinnacle", "Mirage", "Solstice"], show: 9, studySeconds: 4 },
};

let wmState = { difficulty: "easy", phase: "idle", shown: [], candidates: [], selected: new Set(), seconds: 0, timer: null, studyTimer: null };

function wmFormatTime(sec) { const m = String(Math.floor(sec / 60)).padStart(2, "0"); const s = String(sec % 60).padStart(2, "0"); return `${m}:${s}`; }

function wmSetDifficulty(diff) {
  wmState.difficulty = diff;
  document.querySelectorAll('#page-wordmemory .diff-btn').forEach((b) => b.classList.toggle("active", b.dataset.diff === diff));
}

function wmShuffle(arr) { return arr.map((v) => ({ v, r: Math.random() })).sort((a, b) => a.r - b.r).map((o) => o.v); }

function wmRenderGrid(words, clickable) {
  const grid = document.getElementById("wmWordGrid");
  grid.innerHTML = "";
  words.forEach((word) => {
    const chip = document.createElement("button");
    chip.className = "word-chip";
    chip.textContent = word;
    chip.disabled = !clickable;
    if (clickable) {
      chip.addEventListener("click", () => {
        if (wmState.selected.has(word)) { wmState.selected.delete(word); chip.classList.remove("selected"); }
        else { wmState.selected.add(word); chip.classList.add("selected"); }
      });
    }
    grid.appendChild(chip);
  });
}

function wmBeginStudy() {
  const cfg = WM_POOLS[wmState.difficulty];
  wmState.shown = wmShuffle(cfg.pool).slice(0, cfg.show);
  wmState.phase = "study";
  document.getElementById("wmStatus").textContent = "Memorize these words...";
  document.getElementById("wmSubmitBtn").style.display = "none";
  wmRenderGrid(wmState.shown, false);

  let remaining = cfg.studySeconds;
  document.getElementById("wmPhaseTimer").textContent = remaining;
  clearInterval(wmState.studyTimer);
  wmState.studyTimer = setInterval(() => {
    remaining -= 1;
    document.getElementById("wmPhaseTimer").textContent = remaining;
    if (remaining <= 0) { clearInterval(wmState.studyTimer); wmBeginRecall(); }
  }, 1000);
}

function wmBeginRecall() {
  const cfg = WM_POOLS[wmState.difficulty];
  wmState.phase = "recall";
  wmState.selected = new Set();
  document.getElementById("wmStatus").textContent = "Select the words you saw:";
  document.getElementById("wmPhaseTimer").textContent = "";
  const distractorPool = cfg.pool.filter((w) => !wmState.shown.includes(w));
  const distractors = wmShuffle(distractorPool).slice(0, cfg.show);
  wmState.candidates = wmShuffle([...wmState.shown, ...distractors]);
  wmRenderGrid(wmState.candidates, true);
  document.getElementById("wmSubmitBtn").style.display = "inline-block";
}

function wmSubmit() {
  if (wmState.phase !== "recall") return;
  clearInterval(wmState.timer);
  let correct = 0, wrong = 0;
  wmState.selected.forEach((w) => { if (wmState.shown.includes(w)) correct += 1; else wrong += 1; });
  const total = wmState.shown.length;
  const accuracy = Math.max(0, Math.round(((correct - wrong) / total) * 100));
  const score = Math.max(0, correct * 20 - wrong * 10);

  document.getElementById("wmWordGrid").querySelectorAll(".word-chip").forEach((chip) => {
    chip.disabled = true;
    const word = chip.textContent;
    if (wmState.shown.includes(word)) chip.classList.add("correct");
    else if (wmState.selected.has(word)) chip.classList.add("wrong");
  });

  document.getElementById("wmStatus").textContent = "Round complete";
  document.getElementById("wmSubmitBtn").style.display = "none";
  document.getElementById("wmScore").textContent = score;
  document.getElementById("wmAccuracy").textContent = `${accuracy}%`;
  document.getElementById("wmResult").textContent = `You correctly recalled ${correct} / ${total} words — Score: ${score}`;
  document.getElementById("wmStartBtn").style.display = "inline-block";
  document.getElementById("wmStartBtn").textContent = "Play Again";
  document.querySelectorAll('#page-wordmemory .diff-btn').forEach((b) => (b.disabled = false));

  recordGameResult("wordmemory", score, accuracy, wmState.seconds, wmState.difficulty);
  showToast("Word Memory round complete!");
  wmState.phase = "idle";
}

function wmStart() {
  clearInterval(wmState.timer);
  clearInterval(wmState.studyTimer);
  wmState.seconds = 0;
  document.getElementById("wmResult").textContent = "";
  document.getElementById("wmScore").textContent = "0";
  document.getElementById("wmAccuracy").textContent = "0%";
  document.getElementById("wmStartBtn").style.display = "none";
  document.querySelectorAll('#page-wordmemory .diff-btn').forEach((b) => (b.disabled = true));
  wmBeginStudy();
  wmState.timer = setInterval(() => { wmState.seconds += 1; }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("wmWordGrid").innerHTML = "";
  document.getElementById("wmSubmitBtn").style.display = "none";
  document.getElementById("wmStartBtn").addEventListener("click", wmStart);
  document.getElementById("wmSubmitBtn").addEventListener("click", wmSubmit);
  document.querySelectorAll('#page-wordmemory .diff-btn').forEach((b) => b.addEventListener("click", () => wmSetDifficulty(b.dataset.diff)));
  wmSetDifficulty("easy");
});
