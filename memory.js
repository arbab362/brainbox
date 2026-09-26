/* =========================================================
   memory.js — Memory Challenge (card matching game)
   ========================================================= */

const MEM_SYMBOLS = ["⭐", "🧠", "⚡", "🎯", "🚀", "🧩"];

let memState = {
  cards: [],
  flipped: [],
  matches: 0,
  moves: 0,
  timer: null,
  seconds: 0,
  locked: false,
  running: false,
};

function memShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function memBuildGrid() {
  const grid = document.getElementById("memoryGrid");
  grid.innerHTML = "";
  const deck = memShuffle([...MEM_SYMBOLS, ...MEM_SYMBOLS]);
  memState.cards = deck;

  deck.forEach((symbol, idx) => {
    const card = document.createElement("div");
    card.className = "mem-card";
    card.dataset.index = idx;
    card.dataset.symbol = symbol;
    card.innerHTML = `
      <div class="mem-card-inner">
        <div class="mem-card-face mem-card-front">🧠</div>
        <div class="mem-card-face mem-card-back">${symbol}</div>
      </div>`;
    card.addEventListener("click", () => memHandleClick(card));
    grid.appendChild(card);
  });
}

function memFormatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function memUpdateStats() {
  document.getElementById("memMoves").textContent = memState.moves;
  document.getElementById("memMatches").textContent = `${memState.matches}/6`;
  document.getElementById("memTime").textContent = memFormatTime(memState.seconds);
}

function memHandleClick(card) {
  if (!memState.running) return;
  if (memState.locked) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
  if (memState.flipped.length === 2) return;

  card.classList.add("flipped");
  memState.flipped.push(card);

  if (memState.flipped.length === 2) {
    memState.moves += 1;
    memUpdateStats();
    const [a, b] = memState.flipped;
    if (a.dataset.symbol === b.dataset.symbol) {
      a.classList.add("matched");
      b.classList.add("matched");
      memState.matches += 1;
      memState.flipped = [];
      memUpdateStats();
      if (memState.matches === MEM_SYMBOLS.length) {
        memFinish();
      }
    } else {
      memState.locked = true;
      setTimeout(() => {
        a.classList.remove("flipped");
        b.classList.remove("flipped");
        memState.flipped = [];
        memState.locked = false;
      }, 800);
    }
  }
}

function memCalcScore() {
  // Base score minus penalties for extra moves and time taken.
  const idealMoves = MEM_SYMBOLS.length; // best possible = 6 moves
  const extraMoves = Math.max(0, memState.moves - idealMoves);
  let score = 1000 - extraMoves * 30 - memState.seconds * 4;
  return Math.max(100, Math.round(score));
}

function memFinish() {
  memState.running = false;
  clearInterval(memState.timer);
  const score = memCalcScore();
  document.getElementById("memScore").textContent = score;
  document.getElementById("memResult").textContent =
    `Completed in ${memState.moves} moves and ${memFormatTime(memState.seconds)} — Score: ${score}`;

  document.getElementById("memStartBtn").disabled = false;
  document.getElementById("memStartBtn").textContent = "Play Again";

  const accuracy = Math.round((MEM_SYMBOLS.length / memState.moves) * 100);
  recordGameResult("memory", score, Math.min(100, accuracy), memState.seconds);
  showToast("Memory challenge complete!");
}

function memStart() {
  clearInterval(memState.timer);
  memState = {
    cards: [],
    flipped: [],
    matches: 0,
    moves: 0,
    timer: null,
    seconds: 0,
    locked: false,
    running: true,
  };
  document.getElementById("memResult").textContent = "";
  document.getElementById("memScore").textContent = "0";
  memBuildGrid();
  memUpdateStats();
  document.getElementById("memStartBtn").textContent = "Restart";

  memState.timer = setInterval(() => {
    memState.seconds += 1;
    memUpdateStats();
  }, 1000);
}

function memEnd() {
  memState.running = false;
  clearInterval(memState.timer);
  document.getElementById("memResult").textContent = "Game ended.";
  document.getElementById("memStartBtn").textContent = "Start Game";
}

document.addEventListener("DOMContentLoaded", () => {
  memBuildGrid(); // show an inert preview grid before the user starts
  document.getElementById("memStartBtn").addEventListener("click", memStart);
  document.getElementById("memEndBtn").addEventListener("click", memEnd);
});
