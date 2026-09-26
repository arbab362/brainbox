/* =========================================================
   reaction.js — Reaction Test
   ========================================================= */

let reaState = {
  waiting: false,
  live: false,
  startTime: 0,
  timeoutId: null,
  attempts: 0,
};

function reaLoadBest() {
  const data = loadData();
  const best = data.reaction.bestTimeMs;
  document.getElementById("reaBest").textContent = best ? `${best} ms` : "–";
  document.getElementById("reaAttempts").textContent = data.reaction.attempts || 0;
}

function reaSetLabel(text) {
  document.getElementById("reactionLabel").textContent = text;
}

function reaBegin() {
  const area = document.getElementById("reactionArea");
  area.classList.remove("go", "early");
  reaSetLabel("WAIT...");
  reaState.waiting = true;
  reaState.live = false;

  const delay = 1500 + Math.random() * 3500; // 1.5s – 5s
  clearTimeout(reaState.timeoutId);
  reaState.timeoutId = setTimeout(() => {
    reaState.waiting = false;
    reaState.live = true;
    reaState.startTime = performance.now();
    area.classList.add("go");
    reaSetLabel("CLICK NOW!");
  }, delay);

  document.getElementById("reaStartBtn").disabled = true;
  document.getElementById("reaStartBtn").textContent = "Running...";
}

function reaHandleAreaClick() {
  const area = document.getElementById("reactionArea");

  if (reaState.waiting) {
    // Clicked too early
    clearTimeout(reaState.timeoutId);
    reaState.waiting = false;
    area.classList.add("early");
    reaSetLabel("Too early! Wait for the signal.");
    document.getElementById("reaStartBtn").disabled = false;
    document.getElementById("reaStartBtn").textContent = "Try Again";
    return;
  }

  if (reaState.live) {
    const time = Math.round(performance.now() - reaState.startTime);
    reaState.live = false;
    area.classList.remove("go");
    reaSetLabel(`${time} ms — nice!`);

    document.getElementById("reaTime").textContent = `${time} ms`;

    const data = loadData();
    data.reaction.attempts = (data.reaction.attempts || 0) + 1;
    const prevBest = data.reaction.bestTimeMs;
    const isNewBest = !prevBest || time < prevBest;
    if (isNewBest) data.reaction.bestTimeMs = time;
    saveData(data);
    reaLoadBest();

    // Score: faster reaction = higher score, capped between 50 and 1000.
    const score = Math.max(50, Math.min(1000, Math.round(1000 - time * 1.5)));
    const accuracy = Math.max(0, Math.min(100, Math.round(100 - time / 6)));
    recordGameResult("reaction", score, accuracy, 0);

    if (isNewBest) showToast("New best reaction time!");

    document.getElementById("reaStartBtn").disabled = false;
    document.getElementById("reaStartBtn").textContent = "Try Again";
    return;
  }

  // Idle state — clicking the area does nothing until Start is pressed.
}

document.addEventListener("DOMContentLoaded", () => {
  reaLoadBest();
  document.getElementById("reaStartBtn").addEventListener("click", reaBegin);
  document.getElementById("reactionArea").addEventListener("click", reaHandleAreaClick);
});
