/* =========================================================
   sequence.js — Sequence Master
   Advanced numerical & logical sequences (harder variants
   than the Number Challenge — alternating rules, Fibonacci-
   style growth, multi-step operations).
   ========================================================= */

const SEQUENCE_QUESTIONS = {
  easy: [
    { seq: "A   C   E   G   ?", options: ["H", "I", "J", "F"], answer: "I" },
    { seq: "2   4   6   8   ?", options: ["9", "10", "12", "11"], answer: "10" },
    { seq: "1   3   5   7   ?", options: ["8", "9", "10", "11"], answer: "9" },
    { seq: "Z   X   V   T   ?", options: ["S", "R", "U", "Q"], answer: "R" },
    { seq: "10   9   8   7   ?", options: ["5", "6", "7", "4"], answer: "6" },
    { seq: "B   D   F   H   ?", options: ["I", "J", "K", "G"], answer: "J" },
    { seq: "5   10   15   20   ?", options: ["22", "24", "25", "30"], answer: "25" },
    { seq: "1   2   4   8   ?", options: ["10", "12", "16", "14"], answer: "16" },
    { seq: "20   17   14   11   ?", options: ["8", "9", "7", "10"], answer: "8" },
    { seq: "C   F   I   L   ?", options: ["M", "N", "O", "P"], answer: "O" },
  ],
  medium: [
    { seq: "1   1   2   3   5   8   ?", options: ["11", "12", "13", "14"], answer: "13" },
    { seq: "2   6   12   20   30   ?", options: ["40", "42", "44", "46"], answer: "42" },
    { seq: "A   B   D   G   K   ?", options: ["O", "P", "Q", "N"], answer: "P" },
    { seq: "3   4   6   9   13   ?", options: ["16", "17", "18", "19"], answer: "18" },
    { seq: "100   50   25   12.5   ?", options: ["6", "6.25", "5", "7"], answer: "6.25" },
    { seq: "1   4   9   16   25   ?", options: ["30", "32", "36", "34"], answer: "36" },
    { seq: "2   3   5   8   13   ?", options: ["18", "20", "21", "19"], answer: "21" },
    { seq: "90   80   70   60   ?", options: ["45", "50", "55", "40"], answer: "50" },
    { seq: "J   L   N   P   ?", options: ["Q", "R", "S", "T"], answer: "R" },
    { seq: "4   8   13   19   26   ?", options: ["32", "33", "34", "35"], answer: "34" },
  ],
  hard: [
    { seq: "2   3   5   7   11   13   ?", options: ["15", "16", "17", "19"], answer: "17" },
    { seq: "1   2   6   24   120   ?", options: ["480", "600", "720", "840"], answer: "720" },
    { seq: "3   6   11   18   27   ?", options: ["36", "38", "40", "42"], answer: "38" },
    { seq: "A   D   H   M   S   ?", options: ["Y", "Z", "W", "X"], answer: "Z" },
    { seq: "2   5   10   17   26   ?", options: ["35", "36", "37", "38"], answer: "37" },
    { seq: "1   3   6   10   15   ?", options: ["18", "20", "21", "22"], answer: "21" },
    { seq: "5   11   23   47   ?", options: ["93", "94", "95", "96"], answer: "95" },
    { seq: "1   2   4   7   11   16   ?", options: ["20", "21", "22", "23"], answer: "22" },
    { seq: "100   97   91   79   ?", options: ["53", "55", "57", "59"], answer: "55" },
    { seq: "B   E   J   Q   ?", options: ["Z", "Y", "X", "W"], answer: "Z" },
  ],
};

let seqState = { difficulty: "easy", index: 0, score: 0, correctCount: 0, seconds: 0, timer: null, answered: false };

function seqFormatTime(sec) { const m = String(Math.floor(sec / 60)).padStart(2, "0"); const s = String(sec % 60).padStart(2, "0"); return `${m}:${s}`; }

function seqSetDifficulty(diff) {
  seqState.difficulty = diff;
  document.querySelectorAll('#page-sequence .diff-btn').forEach((b) => b.classList.toggle("active", b.dataset.diff === diff));
}

function seqRenderQuestion() {
  const list = SEQUENCE_QUESTIONS[seqState.difficulty];
  const q = list[seqState.index];
  document.getElementById("seqQCount").textContent = `${seqState.index + 1} / ${list.length}`;
  document.getElementById("seqSequence").textContent = q.seq;
  document.getElementById("seqFeedback").textContent = "";

  const optionsEl = document.getElementById("seqOptions");
  optionsEl.innerHTML = "";
  const shuffled = q.options.map((v) => ({ v, r: Math.random() })).sort((a, b) => a.r - b.r).map((o) => o.v);
  shuffled.forEach((val) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.textContent = val;
    btn.addEventListener("click", () => seqHandleAnswer(val, btn));
    optionsEl.appendChild(btn);
  });
  document.getElementById("seqNextBtn").style.display = "none";
  seqState.answered = false;
}

function seqHandleAnswer(value, btn) {
  if (seqState.answered) return;
  seqState.answered = true;
  const q = SEQUENCE_QUESTIONS[seqState.difficulty][seqState.index];
  const buttons = document.querySelectorAll("#seqOptions .opt-btn");
  buttons.forEach((b) => (b.disabled = true));

  if (value === q.answer) {
    btn.classList.add("correct");
    seqState.correctCount += 1;
    seqState.score += 18;
    document.getElementById("seqFeedback").textContent = "Correct!";
  } else {
    btn.classList.add("wrong");
    buttons.forEach((b) => { if (b.textContent === q.answer) b.classList.add("correct"); });
    document.getElementById("seqFeedback").textContent = `Not quite — the answer was ${q.answer}`;
  }
  document.getElementById("seqScore").textContent = seqState.score;
  document.getElementById("seqNextBtn").style.display = "inline-block";
}

function seqNext() {
  seqState.index += 1;
  if (seqState.index >= SEQUENCE_QUESTIONS[seqState.difficulty].length) seqFinish();
  else seqRenderQuestion();
}

function seqFinish() {
  clearInterval(seqState.timer);
  document.getElementById("seqQuizBody").style.display = "none";
  document.getElementById("seqNextBtn").style.display = "none";
  document.getElementById("seqStartBtn").style.display = "inline-block";
  document.getElementById("seqStartBtn").textContent = "Play Again";
  document.querySelectorAll('#page-sequence .diff-btn').forEach((b) => (b.disabled = false));

  const total = SEQUENCE_QUESTIONS[seqState.difficulty].length;
  document.getElementById("seqResult").textContent = `Challenge Complete — Score: ${seqState.correctCount} / ${total} (${seqState.score} pts)`;
  const accuracy = Math.round((seqState.correctCount / total) * 100);
  recordGameResult("sequence", seqState.score, accuracy, seqState.seconds, seqState.difficulty);
  showToast("Sequence Master complete!");
}

function seqStart() {
  clearInterval(seqState.timer);
  const diff = seqState.difficulty;
  seqState = { difficulty: diff, index: 0, score: 0, correctCount: 0, seconds: 0, timer: null, answered: false };
  document.getElementById("seqResult").textContent = "";
  document.getElementById("seqQuizBody").style.display = "block";
  document.getElementById("seqStartBtn").style.display = "none";
  document.getElementById("seqScore").textContent = "0";
  document.querySelectorAll('#page-sequence .diff-btn').forEach((b) => (b.disabled = true));
  seqRenderQuestion();
  seqState.timer = setInterval(() => { seqState.seconds += 1; document.getElementById("seqTimer").textContent = seqFormatTime(seqState.seconds); }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("seqQuizBody").style.display = "none";
  document.getElementById("seqStartBtn").addEventListener("click", seqStart);
  document.getElementById("seqNextBtn").addEventListener("click", seqNext);
  document.querySelectorAll('#page-sequence .diff-btn').forEach((b) => b.addEventListener("click", () => seqSetDifficulty(b.dataset.diff)));
  seqSetDifficulty("easy");
});
