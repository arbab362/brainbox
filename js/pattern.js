/* =========================================================
   pattern.js — Pattern Recognition
   Visual symbol sequences; pick the element that continues
   the pattern. Difficulty changes the rule complexity.
   ========================================================= */

const PATTERN_QUESTIONS = {
  easy: [
    { seq: "🔵 🔴 🔵 🔴 🔵 ?", options: ["🔴", "🔵", "🟢", "🟡"], answer: "🔴" },
    { seq: "⭐ ⭐ 🔺 ⭐ ⭐ 🔺 ⭐ ⭐ ?", options: ["⭐", "🔺", "🟢", "🔵"], answer: "🔺" },
    { seq: "🟩 🟦 🟩 🟦 🟩 ?", options: ["🟩", "🟦", "🟥", "🟨"], answer: "🟦" },
    { seq: "🔸 🔹 🔸 🔹 🔸 ?", options: ["🔹", "🔸", "⭐", "🔺"], answer: "🔹" },
    { seq: "🟡 🟡 🔵 🟡 🟡 🔵 ?", options: ["🔵", "🟡", "🟢", "🔺"], answer: "🟡" },
    { seq: "⬛ ⬜ ⬛ ⬜ ⬛ ?", options: ["⬜", "⬛", "🟫", "🟪"], answer: "⬜" },
    { seq: "🔺 🔺 🔺 🔵 🔺 🔺 🔺 ?", options: ["🔺", "🔵", "⭐", "🟢"], answer: "🔵" },
    { seq: "🟢 🔴 🟢 🔴 🟢 ?", options: ["🔴", "🟢", "🔵", "🟡"], answer: "🔴" },
    { seq: "🔷 🔷 🔶 🔷 🔷 🔶 ?", options: ["🔷", "🔶", "⭐", "🔺"], answer: "🔷" },
    { seq: "⚪ ⚫ ⚪ ⚫ ⚪ ?", options: ["⚫", "⚪", "🔴", "🔵"], answer: "⚫" },
  ],
  medium: [
    { seq: "🔵 🔴 🔴 🔵 🔴 🔴 🔵 ?", options: ["🔵", "🔴", "🟢", "🟡"], answer: "🔴" },
    { seq: "⭐ 🔺 ⭐ ⭐ 🔺 ⭐ ⭐ ⭐ 🔺 ?", options: ["⭐", "🔺", "🔵", "🟢"], answer: "⭐" },
    { seq: "🟩 🟩 🟦 🟦 🟦 🟩 🟩 ?", options: ["🟦", "🟩", "🟥", "🟨"], answer: "🟦" },
    { seq: "🔸 🔹 🔹 🔸 🔹 🔹 🔸 ?", options: ["🔹", "🔸", "⭐", "🔺"], answer: "🔹" },
    { seq: "🔴 🔴 🟡 🟡 🟡 🔴 🔴 ?", options: ["🟡", "🔴", "🟢", "🔵"], answer: "🟡" },
    { seq: "⬛ ⬜ ⬜ ⬛ ⬜ ⬜ ⬛ ?", options: ["⬜", "⬛", "🟫", "🟪"], answer: "⬜" },
    { seq: "🔺 🔵 🔵 🔺 🔵 🔵 🔺 ?", options: ["🔺", "🔵", "⭐", "🟢"], answer: "🔵" },
    { seq: "🟢 🟢 🔴 🔴 🟢 🟢 🔴 ?", options: ["🔴", "🟢", "🔵", "🟡"], answer: "🔴" },
    { seq: "🔷 🔶 🔶 🔷 🔶 🔶 🔷 ?", options: ["🔷", "🔶", "⭐", "🔺"], answer: "🔶" },
    { seq: "⚪ ⚪ ⚫ ⚫ ⚪ ⚪ ⚫ ?", options: ["⚫", "⚪", "🔴", "🔵"], answer: "⚫" },
  ],
  hard: [
    { seq: "🔵 🔴 🟢 🔵 🔴 🟢 🔵 🔴 ?", options: ["🔵", "🔴", "🟢", "🟡"], answer: "🟢" },
    { seq: "⭐ ⭐ 🔺 🔺 🔺 ⭐ ⭐ ⭐ 🔺 🔺 ?", options: ["⭐", "🔺", "🔵", "🟢"], answer: "🔺" },
    { seq: "🟩 🟦 🟨 🟩 🟦 🟨 🟩 🟦 ?", options: ["🟦", "🟩", "🟨", "🟥"], answer: "🟨" },
    { seq: "🔸 🔸 🔹 🔹 🔹 🔸 🔸 🔸 🔹 ?", options: ["🔹", "🔸", "⭐", "🔺"], answer: "🔹" },
    { seq: "🔴 🟡 🟡 🔴 🔴 🟡 🟡 🟡 🔴 ?", options: ["🟡", "🔴", "🟢", "🔵"], answer: "🔴" },
    { seq: "⬛ ⬜ ⬛ ⬛ ⬜ ⬛ ⬛ ⬛ ⬜ ?", options: ["⬜", "⬛", "🟫", "🟪"], answer: "⬛" },
    { seq: "🔺 🔵 🟢 🟢 🔺 🔵 🟢 🟢 🔺 ?", options: ["🔺", "🔵", "🟢", "⭐"], answer: "🔵" },
    { seq: "🟢 🔴 🔴 🟢 🟢 🔴 🔴 🔴 🟢 ?", options: ["🔴", "🟢", "🔵", "🟡"], answer: "🟢" },
    { seq: "🔷 🔶 🔷 🔷 🔶 🔷 🔷 🔷 🔶 ?", options: ["🔷", "🔶", "⭐", "🔺"], answer: "🔷" },
    { seq: "⚪ ⚫ ⚫ ⚪ ⚪ ⚫ ⚫ ⚫ ⚪ ?", options: ["⚫", "⚪", "🔴", "🔵"], answer: "⚪" },
  ],
};

let patState = { difficulty: "easy", index: 0, score: 0, correctCount: 0, seconds: 0, timer: null, answered: false };

function patFormatTime(sec) { const m = String(Math.floor(sec / 60)).padStart(2, "0"); const s = String(sec % 60).padStart(2, "0"); return `${m}:${s}`; }

function patSetDifficulty(diff) {
  patState.difficulty = diff;
  document.querySelectorAll('#page-pattern .diff-btn').forEach((b) => b.classList.toggle("active", b.dataset.diff === diff));
}

function patRenderQuestion() {
  const list = PATTERN_QUESTIONS[patState.difficulty];
  const q = list[patState.index];
  document.getElementById("patQCount").textContent = `${patState.index + 1} / ${list.length}`;
  document.getElementById("patSequence").textContent = q.seq;
  document.getElementById("patFeedback").textContent = "";

  const optionsEl = document.getElementById("patOptions");
  optionsEl.innerHTML = "";
  const shuffled = q.options.map((v) => ({ v, r: Math.random() })).sort((a, b) => a.r - b.r).map((o) => o.v);
  shuffled.forEach((val) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.textContent = val;
    btn.addEventListener("click", () => patHandleAnswer(val, btn));
    optionsEl.appendChild(btn);
  });
  document.getElementById("patNextBtn").style.display = "none";
  patState.answered = false;
}

function patHandleAnswer(value, btn) {
  if (patState.answered) return;
  patState.answered = true;
  const q = PATTERN_QUESTIONS[patState.difficulty][patState.index];
  const buttons = document.querySelectorAll("#patOptions .opt-btn");
  buttons.forEach((b) => (b.disabled = true));

  if (value === q.answer) {
    btn.classList.add("correct");
    patState.correctCount += 1;
    patState.score += 15;
    document.getElementById("patFeedback").textContent = "Correct! You spotted the rule.";
  } else {
    btn.classList.add("wrong");
    buttons.forEach((b) => { if (b.textContent === q.answer) b.classList.add("correct"); });
    document.getElementById("patFeedback").textContent = `Not quite — the pattern continues with ${q.answer}`;
  }
  document.getElementById("patScore").textContent = patState.score;
  document.getElementById("patNextBtn").style.display = "inline-block";
}

function patNext() {
  patState.index += 1;
  if (patState.index >= PATTERN_QUESTIONS[patState.difficulty].length) patFinish();
  else patRenderQuestion();
}

function patFinish() {
  clearInterval(patState.timer);
  document.getElementById("patQuizBody").style.display = "none";
  document.getElementById("patNextBtn").style.display = "none";
  document.getElementById("patStartBtn").style.display = "inline-block";
  document.getElementById("patStartBtn").textContent = "Play Again";
  document.querySelectorAll('#page-pattern .diff-btn').forEach((b) => (b.disabled = false));

  const total = PATTERN_QUESTIONS[patState.difficulty].length;
  document.getElementById("patResult").textContent = `Challenge Complete — Score: ${patState.correctCount} / ${total} (${patState.score} pts)`;
  const accuracy = Math.round((patState.correctCount / total) * 100);
  recordGameResult("pattern", patState.score, accuracy, patState.seconds, patState.difficulty);
  showToast("Pattern challenge complete!");
}

function patStart() {
  clearInterval(patState.timer);
  const diff = patState.difficulty;
  patState = { difficulty: diff, index: 0, score: 0, correctCount: 0, seconds: 0, timer: null, answered: false };
  document.getElementById("patResult").textContent = "";
  document.getElementById("patQuizBody").style.display = "block";
  document.getElementById("patStartBtn").style.display = "none";
  document.getElementById("patScore").textContent = "0";
  document.querySelectorAll('#page-pattern .diff-btn').forEach((b) => (b.disabled = true));
  patRenderQuestion();
  patState.timer = setInterval(() => { patState.seconds += 1; document.getElementById("patTimer").textContent = patFormatTime(patState.seconds); }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("patQuizBody").style.display = "none";
  document.getElementById("patStartBtn").addEventListener("click", patStart);
  document.getElementById("patNextBtn").addEventListener("click", patNext);
  document.querySelectorAll('#page-pattern .diff-btn').forEach((b) => b.addEventListener("click", () => patSetDifficulty(b.dataset.diff)));
  patSetDifficulty("easy");
});
