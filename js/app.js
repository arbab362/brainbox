/* =========================================================
   app.js — Core application logic
   Handles: localStorage helpers, page navigation, sidebar,
   theme toggle, top-level stats rendering, toast + modal.
   ========================================================= */

// ---------- STORAGE ----------
// Wrapper around localStorage so the app never crashes if
// storage is unavailable (private browsing, quota, etc).
const Storage = {
  available: (function () {
    try {
      const t = "__bb_test__";
      localStorage.setItem(t, "1");
      localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  })(),
  memoryFallback: {},
  get(key, fallback) {
    try {
      if (this.available) {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      }
      return key in this.memoryFallback ? this.memoryFallback[key] : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      if (this.available) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        this.memoryFallback[key] = value;
      }
    } catch (e) {
      /* ignore quota errors */
    }
  },
};

// Default shape of all saved progress data
const DEFAULT_DATA = {
  totalScore: 0,
  bestScore: 0,
  gamesPlayed: 0,
  totalTimeSeconds: 0,
  theme: "dark",
  memory: { bestScore: 0, playCount: 0, avgAccuracy: 0 },
  number: { bestScore: 0, playCount: 0, avgAccuracy: 0 },
  reaction: { bestTimeMs: null, attempts: 0, avgAccuracy: 0 },
  logic: { bestScore: 0, playCount: 0, avgAccuracy: 0 },
  trend: [], // list of {date, score} pushed on each completed game, last 7 kept
};

function loadData() {
  return Storage.get("brainbox_data", DEFAULT_DATA);
}
function saveData(data) {
  Storage.set("brainbox_data", data);
}

// Records a completed game session and updates global + per-skill stats.
// accuracyPct: 0-100 number representing how well the player did.
function recordGameResult(game, score, accuracyPct, timeSeconds) {
  const data = loadData();
  data.totalScore += score;
  data.bestScore = Math.max(data.bestScore, score);
  data.gamesPlayed += 1;
  data.totalTimeSeconds += timeSeconds || 0;

  const g = data[game];
  g.playCount += 1;
  g.bestScore = Math.max(g.bestScore || 0, score);
  g.avgAccuracy = Math.round(
    ((g.avgAccuracy || 0) * (g.playCount - 1) + accuracyPct) / g.playCount
  );

  const today = new Date();
  const dayLabel = today.toLocaleDateString("en-US", { weekday: "short" });
  data.trend.push({ day: dayLabel, score, ts: Date.now() });
  if (data.trend.length > 7) data.trend = data.trend.slice(-7);

  saveData(data);
  renderGlobalStats();
}

// ---------- TOAST ----------
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

// ---------- MODAL ----------
function showConfirm(text, onConfirm) {
  const overlay = document.getElementById("modalOverlay");
  document.getElementById("modalText").textContent = text;
  overlay.classList.add("show");

  const confirmBtn = document.getElementById("modalConfirm");
  const cancelBtn = document.getElementById("modalCancel");

  function cleanup() {
    overlay.classList.remove("show");
    confirmBtn.removeEventListener("click", onYes);
    cancelBtn.removeEventListener("click", onNo);
  }
  function onYes() {
    cleanup();
    onConfirm();
  }
  function onNo() {
    cleanup();
  }
  confirmBtn.addEventListener("click", onYes);
  cancelBtn.addEventListener("click", onNo);
}

// ---------- NAVIGATION ----------
function goToPage(pageId) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + pageId).classList.add("active");

  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.toggle("active", n.dataset.page === pageId));

  document.getElementById("content").scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  closeSidebar();

  // Let each game module know its page became visible, so it can
  // render fresh questions / grids without auto-starting timers.
  if (pageId === "progress" && typeof renderProgressPage === "function") {
    renderProgressPage();
  }
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("show");
}
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarOverlay").classList.add("show");
}

// ---------- THEME ----------
function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    document.getElementById("themeToggle").textContent = "☀️";
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.getElementById("themeToggle").textContent = "🌙";
  }
}

// ---------- GLOBAL STATS RENDER ----------
function renderGlobalStats() {
  const data = loadData();
  document.getElementById("statTotalScore").textContent =
    data.totalScore.toLocaleString();
  document.getElementById("statBestScore").textContent =
    data.bestScore.toLocaleString();
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  const data = loadData();
  applyTheme(data.theme || "dark");
  renderGlobalStats();

  // Nav clicks (sidebar items + challenge cards + hero button)
  document.querySelectorAll("[data-page]").forEach((el) => {
    el.addEventListener("click", () => goToPage(el.dataset.page));
  });
  document
    .getElementById("startPlayingBtn")
    .addEventListener("click", () => goToPage("memory"));

  // Hamburger / sidebar overlay
  document.getElementById("hamburger").addEventListener("click", openSidebar);
  document
    .getElementById("sidebarOverlay")
    .addEventListener("click", closeSidebar);

  // Theme toggle
  document.getElementById("themeToggle").addEventListener("click", () => {
    const current = loadData();
    const next = current.theme === "light" ? "dark" : "light";
    current.theme = next;
    saveData(current);
    applyTheme(next);
  });

  // Reset progress
  document.getElementById("resetProgressBtn").addEventListener("click", () => {
    showConfirm("Are you sure you want to reset your progress?", () => {
      const theme = loadData().theme;
      const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
      fresh.theme = theme;
      saveData(fresh);
      renderGlobalStats();
      if (typeof renderProgressPage === "function") renderProgressPage();
      showToast("Progress reset");
    });
  });
});
/* =========================================
   BRAINBOX DEMO LOGIN
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

  const loginScreen = document.getElementById("loginScreen");
  const loginForm = document.getElementById("loginForm");
  const passwordInput = document.getElementById("loginPassword");
  const togglePassword = document.getElementById("togglePassword");

  // Check if user is already logged in
  const isLoggedIn = localStorage.getItem("brainbox_logged_in");

  if (isLoggedIn === "true") {
    loginScreen.style.display = "none";
  }

  // Show / Hide password
  if (togglePassword && passwordInput) {

    togglePassword.addEventListener("click", function () {

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        
      } else {
        passwordInput.type = "password";
        
      }

    });

  }

  // Login
  if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

      event.preventDefault();

      const email = document
        .getElementById("loginEmail")
        .value
        .trim();

      const password = passwordInput.value.trim();

      if (!email || !password) {
        alert("Please enter your email and password.");
        return;
      }

      // Save demo login state
      localStorage.setItem("brainbox_logged_in", "true");
      localStorage.setItem("brainbox_user_email", email);

      // Hide login screen
      loginScreen.style.display = "none";

    });

  }

});
