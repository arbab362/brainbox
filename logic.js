/* =========================================================
   logic.js — Logic Challenge (multiple-choice reasoning)
   ========================================================= */

const LOGIC_QUESTIONS = [
  {
    statement: "If all A are B, and some B are C, which statement is possible?",
    options: [
      "Some A are C",
      "All A are C",
      "No A are C",
      "Some C are A but no A are B",
    ],
    answerIndex: 0,
    explain: "Since all A are B, and some B overlap with C, it's possible (not certain) that some A are C.",
  },
  {
    statement: "All cats are animals. All animals need food. What can we conclude?",
    options: [
      "All cats need food",
      "All animals are cats",
      "Some food is an animal",
      "No cats need food",
    ],
    answerIndex: 0,
    explain: "This follows a valid chain: cats → animals → need food.",
  },
  {
    statement: "If it rains, the ground gets wet. The ground is wet. Can we conclude it rained?",
    options: [
      "Yes, definitely",
      "No — the ground could be wet for another reason",
      "Only on weekends",
      "Yes, because wet ground always means rain",
    ],
    answerIndex: 1,
    explain: "This is the logical fallacy of affirming the consequent — other causes (a sprinkler, spilled water) could explain wet ground.",
  },
  {
    statement: "No fish are mammals. All whales are mammals. What follows?",
    options: [
      "No whales are fish",
      "All whales are fish",
      "Some fish are whales",
      "All mammals are whales",
    ],
    answerIndex: 0,
    explain: "Since whales are mammals and no mammals are fish, whales cannot be fish.",
  },
  {
    statement: "Some students are athletes. All athletes are disciplined. What must be true?",
    options: [
      "All students are disciplined",
      "Some students are disciplined",
      "No students are disciplined",
      "All disciplined people are students",
    ],
    answerIndex: 1,
    explain: "Only the students who are athletes are guaranteed to be disciplined — so 'some' is correct, not 'all'.",
  },
  {
    statement: "If today is Monday, tomorrow is Tuesday. Tomorrow is not Tuesday. What can we conclude?",
    options: [
      "Today is Monday",
      "Today is not Monday",
      "Tomorrow is Wednesday",
      "Nothing can be concluded",
    ],
    answerIndex: 1,
    explain: "This is modus tollens: if the consequent is false, the antecedent must be false too.",
  },
  {
    statement: "Every square is a rectangle. This shape is not a rectangle. What follows?",
    options: [
      "This shape is a square",
      "This shape is not a square",
      "This shape might be a square",
      "All rectangles are squares",
    ],
    answerIndex: 1,
    explain: "Since all squares are rectangles, anything that isn't a rectangle definitely isn't a square.",
  },
  {
    statement: "Some doctors are teachers. Some teachers are parents. Can we conclude some doctors are parents?",
    options: [
      "Yes, definitely",
      "No — the overlaps might not connect",
      "Yes, but only on weekdays",
      "All doctors are parents",
    ],
    answerIndex: 1,
    explain: "Two separate 'some' overlaps don't guarantee a shared group — the teacher-doctors and teacher-parents might be different people.",
  },
  {
    statement: "If a number is divisible by 4, it is divisible by 2. 18 is divisible by 2. Is 18 divisible by 4?",
    options: [
      "Yes, always",
      "No — divisibility by 2 doesn't guarantee divisibility by 4",
      "Only even numbers over 10",
      "Cannot be determined without a calculator",
    ],
    answerIndex: 1,
    explain: "This is another case of affirming the consequent — 18 is divisible by 2 but not by 4.",
  },
  {
    statement: "All engineers can code. Maria can code. Is Maria an engineer?",
    options: [
      "Yes, definitely",
      "Not necessarily — others can code too",
      "No, never",
      "Only if she has a degree",
    ],
    answerIndex: 1,
    explain: "Being able to code doesn't guarantee being an engineer — many non-engineers can code as well.",
  },
];

let logState = {
  index: 0,
  score: 0,
  correctCount: 0,
  seconds: 0,
  answered: false,
};

function logRenderQuestion() {
  const q = LOGIC_QUESTIONS[logState.index];
  document.getElementById("logQCount").textContent = `${logState.index + 1} / ${LOGIC_QUESTIONS.length}`;
  document.getElementById("logStatement").textContent = q.statement;
  document.getElementById("logFeedback").textContent = "";

  const optionsEl = document.getElementById("logOptions");
  optionsEl.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => logHandleAnswer(i, btn));
    optionsEl.appendChild(btn);
  });

  document.getElementById("logNextBtn").style.display = "none";
  logState.answered = false;
}

function logHandleAnswer(i, btn) {
  if (logState.answered) return;
  logState.answered = true;
  const q = LOGIC_QUESTIONS[logState.index];
  const buttons = document.querySelectorAll("#logOptions .opt-btn");
  buttons.forEach((b) => (b.disabled = true));

  if (i === q.answerIndex) {
    btn.classList.add("correct");
    logState.correctCount += 1;
    logState.score += 15;
    document.getElementById("logFeedback").textContent = `Correct! ${q.explain}`;
  } else {
    btn.classList.add("wrong");
    buttons[q.answerIndex].classList.add("correct");
    document.getElementById("logFeedback").textContent = `Not quite. ${q.explain}`;
  }

  document.getElementById("logScore").textContent = logState.score;
  document.getElementById("logNextBtn").style.display = "inline-block";
}

function logNext() {
  logState.index += 1;
  if (logState.index >= LOGIC_QUESTIONS.length) {
    logFinish();
  } else {
    logRenderQuestion();
  }
}

function logFinish() {
  document.getElementById("logQuizBody").style.display = "none";
  document.getElementById("logNextBtn").style.display = "none";
  document.getElementById("logStartBtn").style.display = "inline-block";
  document.getElementById("logStartBtn").textContent = "Play Again";
  document.getElementById("logStartBtn").disabled = false;

  const total = LOGIC_QUESTIONS.length;
  document.getElementById("logResult").textContent =
    `Challenge Complete — Score: ${logState.correctCount} / ${total} (${logState.score} pts)`;

  const accuracy = Math.round((logState.correctCount / total) * 100);
  recordGameResult("logic", logState.score, accuracy, logState.seconds);
  showToast("Logic challenge complete!");
}

function logStart() {
  logState = { index: 0, score: 0, correctCount: 0, seconds: 0, answered: false };
  document.getElementById("logResult").textContent = "";
  document.getElementById("logQuizBody").style.display = "block";
  document.getElementById("logStartBtn").style.display = "none";
  document.getElementById("logScore").textContent = "0";
  logRenderQuestion();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logQuizBody").style.display = "none";
  document.getElementById("logStartBtn").addEventListener("click", logStart);
  document.getElementById("logNextBtn").addEventListener("click", logNext);
});
