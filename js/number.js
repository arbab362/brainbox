/* =========================================================
   number.js — Number Challenge (pattern quizzes)
   ========================================================= */

const NUMBER_QUESTIONS = [
  { seq: "2   4   8   16   ?", options: [24, 32, 36, 40], answer: 32 },
  { seq: "1   1   2   3   5   ?", options: [7, 8, 9, 6], answer: 8 },
  { seq: "3   6   9   12   ?", options: [14, 15, 16, 18], answer: 15 },
  { seq: "1   4   9   16   ?", options: [20, 24, 25, 27], answer: 25 },
  { seq: "5   10   20   40   ?", options: [60, 70, 80, 90], answer: 80 },
  { seq: "100   90   80   70   ?", options: [55, 60, 65, 50], answer: 60 },
  { seq: "2   3   5   7   11   ?", options: [12, 13, 14, 15], answer: 13 },
  { seq: "1   2   4   7   11   ?", options: [15, 16, 18, 14], answer: 16 },
  { seq: "10   20   19   29   28   ?", options: [27, 38, 36, 30], answer: 38 },
  { seq: "6   12   24   48   ?", options: [72, 96, 100, 84], answer: 96 },
];

let numState = {
  index: 0,
  score: 0,
  streak: 0,
  correctCount: 0,
  seconds: 0,
  timer: null,
  answered: false,
};

function numFormatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function numRenderQuestion() {
  const q = NUMBER_QUESTIONS[numState.index];
  document.getElementById("numQCount").textContent = `${numState.index + 1} / ${NUMBER_QUESTIONS.length}`;
  document.getElementById("numSequence").textContent = q.seq;
  document.getElementById("numFeedback").textContent = "";

  const optionsEl = document.getElementById("numOptions");
  optionsEl.innerHTML = "";
  // Shuffle option display order so the answer position varies.
  const shuffled = q.options
    .map((v) => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((o) => o.v);

  shuffled.forEach((val) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.textContent = val;
    btn.addEventListener("click", () => numHandleAnswer(val, btn));
    optionsEl.appendChild(btn);
  });

  document.getElementById("numNextBtn").style.display = "none";
  numState.answered = false;
}

function numHandleAnswer(value, btn) {
  if (numState.answered) return;
  numState.answered = true;
  const q = NUMBER_QUESTIONS[numState.index];
  const buttons = document.querySelectorAll("#numOptions .opt-btn");
  buttons.forEach((b) => (b.disabled = true));

  if (value === q.answer) {
    btn.classList.add("correct");
    numState.streak += 1;
    numState.correctCount += 1;
    const gain = 10 + numState.streak * 2;
    numState.score += gain;
    document.getElementById("numFeedback").textContent = `Correct! +${gain} points`;
  } else {
    btn.classList.add("wrong");
    numState.streak = 0;
    document.getElementById("numFeedback").textContent = `Not quite — the answer was ${q.answer}`;
    buttons.forEach((b) => {
      if (Number(b.textContent) === q.answer) b.classList.add("correct");
    });
  }

  document.getElementById("numScore").textContent = numState.score;
  document.getElementById("numStreak").textContent = numState.streak;
  document.getElementById("numNextBtn").style.display = "inline-block";
}

function numNext() {
  numState.index += 1;
  if (numState.index >= NUMBER_QUESTIONS.length) {
    numFinish();
  } else {
    numRenderQuestion();
  }
}

function numFinish() {
  clearInterval(numState.timer);
  document.getElementById("numQuizBody").style.display = "none";
  document.getElementById("numNextBtn").style.display = "none";
  document.getElementById("numStartBtn").style.display = "inline-block";
  document.getElementById("numStartBtn").textContent = "Play Again";
  document.getElementById("numStartBtn").disabled = false;

  const total = NUMBER_QUESTIONS.length;
  document.getElementById("numResult").textContent =
    `Challenge Complete — Score: ${numState.correctCount} / ${total} (${numState.score} pts)`;

  const accuracy = Math.round((numState.correctCount / total) * 100);
  recordGameResult("number", numState.score, accuracy, numState.seconds);
  showToast("Number challenge complete!");
}

function numStart() {
  clearInterval(numState.timer);
  numState = {
    index: 0,
    score: 0,
    streak: 0,
    correctCount: 0,
    seconds: 0,
    timer: null,
    answered: false,
  };
  document.getElementById("numResult").textContent = "";
  document.getElementById("numQuizBody").style.display = "block";
  document.getElementById("numStartBtn").style.display = "none";
  document.getElementById("numScore").textContent = "0";
  document.getElementById("numStreak").textContent = "0";
  numRenderQuestion();

  numState.timer = setInterval(() => {
    numState.seconds += 1;
    document.getElementById("numTimer").textContent = numFormatTime(numState.seconds);
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("numQuizBody").style.display = "none";
  document.getElementById("numStartBtn").addEventListener("click", numStart);
  document.getElementById("numNextBtn").addEventListener("click", numNext);
});
