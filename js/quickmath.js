/* =========================================================
   quickmath.js — Quick Math
   Timed arithmetic with difficulty-controlled operations.
   ========================================================= */

const QM_TOTAL = 10;

function qmRandInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function qmGenerateQuestion(difficulty) {
  let a, b, op, answer;
  if (difficulty === "easy") {
    op = Math.random() < 0.5 ? "+" : "-";
    a = qmRandInt(1, 20);
    b = qmRandInt(1, 20);
    if (op === "-" && b > a) [a, b] = [b, a];
    answer = op === "+" ? a + b : a - b;
  } else if (difficulty === "medium") {
    const ops = ["+", "-", "×"];
    op = ops[qmRandInt(0, 2)];
    if (op === "×") { a = qmRandInt(2, 12); b = qmRandInt(2, 12); answer = a * b; }
    else { a = qmRandInt(10, 60); b = qmRandInt(10, 60); if (op === "-" && b > a) [a, b] = [b, a]; answer = op === "+" ? a + b : a - b; }
  } else {
    const ops = ["+", "-", "×", "÷"];
    op = ops[qmRandInt(0, 3)];
    if (op === "×") { a = qmRandInt(6, 15); b = qmRandInt(6, 15); answer = a * b; }
    else if (op === "÷") { b = qmRandInt(2, 12); answer = qmRandInt(2, 12); a = b * answer; }
    else { a = qmRandInt(30, 99); b = qmRandInt(30, 99); if (op === "-" && b > a) [a, b] = [b, a]; answer = op === "+" ? a + b : a - b; }
  }
  const options = new Set([answer]);
  while (options.size < 4) {
    const delta = qmRandInt(-6, 6) || 1;
    const fake = answer + delta;
    if (fake !== answer) options.add(fake);
  }
  return { text: `${a}   ${op}   ${b}   =   ?`, options: Array.from(options).sort(() => Math.random() - 0.5), answer };
}

let qmState = { difficulty: "easy", index: 0, score: 0, streak: 0, correctCount: 0, seconds: 0, timer: null, answered: false, questions: [] };

function qmFormatTime(sec) { const m = String(Math.floor(sec / 60)).padStart(2, "0"); const s = String(sec % 60).padStart(2, "0"); return `${m}:${s}`; }

function qmSetDifficulty(diff) {
  qmState.difficulty = diff;
  document.querySelectorAll('#page-quickmath .diff-btn').forEach((b) => b.classList.toggle("active", b.dataset.diff === diff));
}

function qmRenderQuestion() {
  const q = qmState.questions[qmState.index];
  document.getElementById("qmQCount").textContent = `${qmState.index + 1} / ${QM_TOTAL}`;
  document.getElementById("qmQuestion").textContent = q.text;
  document.getElementById("qmFeedback").textContent = "";

  const optionsEl = document.getElementById("qmOptions");
  optionsEl.innerHTML = "";
  q.options.forEach((val) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.textContent = val;
    btn.addEventListener("click", () => qmHandleAnswer(val, btn));
    optionsEl.appendChild(btn);
  });
  document.getElementById("qmNextBtn").style.display = "none";
  qmState.answered = false;
}

function qmHandleAnswer(value, btn) {
  if (qmState.answered) return;
  qmState.answered = true;
  const q = qmState.questions[qmState.index];
  const buttons = document.querySelectorAll("#qmOptions .opt-btn");
  buttons.forEach((b) => (b.disabled = true));

  if (value === q.answer) {
    btn.classList.add("correct");
    qmState.streak += 1;
    qmState.correctCount += 1;
    const gain = 10 + qmState.streak * 2;
    qmState.score += gain;
    document.getElementById("qmFeedback").textContent = `Correct! +${gain} points`;
  } else {
    btn.classList.add("wrong");
    qmState.streak = 0;
    buttons.forEach((b) => { if (Number(b.textContent) === q.answer) b.classList.add("correct"); });
    document.getElementById("qmFeedback").textContent = `Not quite — the answer was ${q.answer}`;
  }
  document.getElementById("qmScore").textContent = qmState.score;
  document.getElementById("qmStreak").textContent = qmState.streak;
  document.getElementById("qmNextBtn").style.display = "inline-block";
}

function qmNext() {
  qmState.index += 1;
  if (qmState.index >= QM_TOTAL) qmFinish();
  else qmRenderQuestion();
}

function qmFinish() {
  clearInterval(qmState.timer);
  document.getElementById("qmQuizBody").style.display = "none";
  document.getElementById("qmNextBtn").style.display = "none";
  document.getElementById("qmStartBtn").style.display = "inline-block";
  document.getElementById("qmStartBtn").textContent = "Play Again";
  document.querySelectorAll('#page-quickmath .diff-btn').forEach((b) => (b.disabled = false));

  document.getElementById("qmResult").textContent = `Challenge Complete — Score: ${qmState.correctCount} / ${QM_TOTAL} (${qmState.score} pts)`;
  const accuracy = Math.round((qmState.correctCount / QM_TOTAL) * 100);
  recordGameResult("quickmath", qmState.score, accuracy, qmState.seconds, qmState.difficulty);
  showToast("Quick Math challenge complete!");
}

function qmStart() {
  clearInterval(qmState.timer);
  const diff = qmState.difficulty;
  const questions = Array.from({ length: QM_TOTAL }, () => qmGenerateQuestion(diff));
  qmState = { difficulty: diff, index: 0, score: 0, streak: 0, correctCount: 0, seconds: 0, timer: null, answered: false, questions };
  document.getElementById("qmResult").textContent = "";
  document.getElementById("qmQuizBody").style.display = "block";
  document.getElementById("qmStartBtn").style.display = "none";
  document.getElementById("qmScore").textContent = "0";
  document.getElementById("qmStreak").textContent = "0";
  document.querySelectorAll('#page-quickmath .diff-btn').forEach((b) => (b.disabled = true));
  qmRenderQuestion();
  qmState.timer = setInterval(() => { qmState.seconds += 1; document.getElementById("qmTimer").textContent = qmFormatTime(qmState.seconds); }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("qmQuizBody").style.display = "none";
  document.getElementById("qmStartBtn").addEventListener("click", qmStart);
  document.getElementById("qmNextBtn").addEventListener("click", qmNext);
  document.querySelectorAll('#page-quickmath .diff-btn').forEach((b) => b.addEventListener("click", () => qmSetDifficulty(b.dataset.diff)));
  qmSetDifficulty("easy");
});
