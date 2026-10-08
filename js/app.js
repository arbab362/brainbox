/* =========================================================
   app.js — BrainBox 2.0 core
   Data architecture, XP/Level, Streak, Daily Challenge,
   Achievements, navigation, theme, search, shared helpers.
   ========================================================= */

// ---------- GAME CATALOG (single source of truth) ----------
const GAMES_META = {
  memory:     { name: "Memory Match",        desc: "Remember and match the hidden pairs.",        icon: "🧠", accent: "purple", xp: 100, hasDifficulty: false },
  number:     { name: "Number Challenge",    desc: "Find the missing number in the pattern.",      icon: "🔢", accent: "blue",   xp: 120, hasDifficulty: true  },
  reaction:   { name: "Reaction Test",       desc: "Tap the instant the screen changes.",           icon: "⚡", accent: "orange", xp: 80,  hasDifficulty: false },
  logic:      { name: "Logic Challenge",     desc: "Analyze the statement, pick the answer.",       icon: "🧩", accent: "green",  xp: 120, hasDifficulty: false },
  pattern:    { name: "Pattern Recognition", desc: "Spot the rule, choose what comes next.",        icon: "🔷", accent: "cyan",   xp: 110, hasDifficulty: true  },
  quickmath:  { name: "Quick Math",          desc: "Solve arithmetic before the clock runs out.",   icon: "➗", accent: "blue",   xp: 100, hasDifficulty: true  },
  wordmemory: { name: "Word Memory",         desc: "Memorize the words, then recall them.",         icon: "📝", accent: "purple", xp: 110, hasDifficulty: true  },
  oddoneout:  { name: "Odd One Out",         desc: "Spot the item that doesn't belong.",            icon: "🔍", accent: "green",  xp: 90,  hasDifficulty: true  },
  sequence:   { name: "Sequence Master",     desc: "Crack advanced number & logic sequences.",      icon: "🧮", accent: "orange", xp: 120, hasDifficulty: true  },
  colorfocus: { name: "Color Focus",         desc: "Name the ink color, not the word.",             icon: "🎯", accent: "cyan",   xp: 100, hasDifficulty: true  },
};
const GAME_IDS = Object.keys(GAMES_META);
const DIFF_MULT = { easy: 0.8, medium: 1, hard: 1.3 };
const XP_PER_LEVEL = 1000;

const ACHIEVEMENTS = [
  { id: "first_step",      icon: "🏆", name: "First Step",      desc: "Complete your first challenge.",            check: d => d.gamesPlayed >= 1 },
  { id: "memory_master",   icon: "🧠", name: "Memory Master",   desc: "Complete 10 memory challenges.",             check: d => d.games.memory.playCount >= 10 },
  { id: "quick_reflex",    icon: "⚡", name: "Quick Reflex",    desc: "Record a reaction time under 300ms.",        check: d => d.games.reaction.bestTimeMs != null && d.games.reaction.bestTimeMs <= 300 },
  { id: "perfect_score",   icon: "🎯", name: "Perfect Score",   desc: "Achieve 100% accuracy in a challenge.",      check: d => d.hadPerfect === true },
  { id: "streak_7",        icon: "🔥", name: "7 Day Streak",    desc: "Maintain a 7-day streak.",                   check: d => d.streak.count >= 7 },
  { id: "brainbox_master", icon: "🏆", name: "BrainBox Master", desc: "Reach Level 10.",                            check: d => d.level >= 10 },
];

// ---------- STORAGE ----------
const Storage = {
  available: (function () {
    try { const t = "__bb_test__"; localStorage.setItem(t, "1"); localStorage.removeItem(t); return true; }
    catch (e) { return false; }
  })(),
  memoryFallback: {},
  get(key, fallback) {
    try {
      if (this.available) { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
      return key in this.memoryFallback ? this.memoryFallback[key] : fallback;
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { if (this.available) localStorage.setItem(key, JSON.stringify(value)); else this.memoryFallback[key] = value; }
    catch (e) { /* ignore quota errors */ }
  },
};

function emptyGameStat() { return { bestScore: 0, playCount: 0, avgAccuracy: 0 }; }

function freshData() {
  const games = {};
  GAME_IDS.forEach((id) => (games[id] = emptyGameStat()));
  games.reaction.bestTimeMs = null;
  games.reaction.attempts = 0;
  return {
    version: 2,
    theme: "dark",
    xp: 0,
    totalXP: 0,
    level: 1,
    streak: { count: 0, lastDate: null },
    daily: { date: null, gameId: null, completed: false },
    achievements: [],
    hadPerfect: false,
    totalScore: 0,
    bestScore: 0,
    gamesPlayed: 0,
    totalTimeSeconds: 0,
    trend: [],
    games,
  };
}

// Loads data, migrating the BrainBox 1.0 shape (flat memory/number/reaction/logic
// objects) into the 2.0 shape without losing anything the player already earned.
function loadData() {
  const raw = Storage.get("brainbox_data", null);
  if (!raw) return freshData();
  if (raw.version === 2 && raw.games) return raw;

  // Legacy v1 shape detected — migrate.
  const fresh = freshData();
  fresh.theme = raw.theme || "dark";
  fresh.totalScore = raw.totalScore || 0;
  fresh.bestScore = raw.bestScore || 0;
  fresh.gamesPlayed = raw.gamesPlayed || 0;
  fresh.totalTimeSeconds = raw.totalTimeSeconds || 0;
  fresh.trend = Array.isArray(raw.trend) ? raw.trend.slice(-7) : [];
  ["memory", "number", "logic"].forEach((id) => {
    if (raw[id]) {
      fresh.games[id].bestScore = raw[id].bestScore || 0;
      fresh.games[id].playCount = raw[id].playCount || 0;
      fresh.games[id].avgAccuracy = raw[id].avgAccuracy || 0;
    }
  });
  if (raw.reaction) {
    fresh.games.reaction.bestTimeMs = raw.reaction.bestTimeMs ?? null;
    fresh.games.reaction.attempts = raw.reaction.attempts || 0;
    fresh.games.reaction.bestScore = raw.reaction.bestScore || 0;
    fresh.games.reaction.playCount = raw.reaction.attempts || 0;
    fresh.games.reaction.avgAccuracy = raw.reaction.avgAccuracy || 0;
  }
  // Back-fill a reasonable starting XP/level from legacy total score so
  // returning players don't start completely from zero.
  const seedXP = Math.min(50000, Math.round((fresh.totalScore || 0) * 0.3));
  fresh.totalXP = seedXP;
  fresh.level = 1 + Math.floor(seedXP / XP_PER_LEVEL);
  fresh.xp = seedXP % XP_PER_LEVEL;

  Storage.set("brainbox_data", fresh);
  return fresh;
}
function saveData(data) { Storage.set("brainbox_data", data); }

// ---------- DATE HELPERS ----------
function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateKeyMinusOne(key) {
  const d = new Date(key + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayOfYear() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

// ---------- DAILY CHALLENGE (deterministic, no API) ----------
function getDailyChallenge(data) {
  const key = todayDateKey();
  if (data.daily.date !== key) {
    data.daily.date = key;
    data.daily.gameId = GAME_IDS[dayOfYear() % GAME_IDS.length];
    data.daily.completed = false;
  }
  return data.daily;
}

// ---------- STREAK ----------
function updateStreak(data, key) {
  if (data.streak.lastDate === key) return; // already counted today
  if (data.streak.lastDate === dateKeyMinusOne(key)) {
    data.streak.count += 1;
  } else {
    data.streak.count = 1;
  }
  data.streak.lastDate = key;
}

// ---------- XP / LEVEL ----------
function awardXP(data, amount, reason) {
  data.totalXP += amount;
  data.xp += amount;
  let leveledTo = null;
  while (data.xp >= XP_PER_LEVEL) {
    data.xp -= XP_PER_LEVEL;
    data.level += 1;
    leveledTo = data.level;
  }
  showToast(`+${amount} XP${reason ? " — " + reason : ""}`);
  if (leveledTo) showLevelUpModal(leveledTo);
}

// ---------- ACHIEVEMENTS ----------
function checkAchievements(data) {
  ACHIEVEMENTS.forEach((a) => {
    if (!data.achievements.includes(a.id) && a.check(data)) {
      data.achievements.push(a.id);
      showToast(`🏆 Achievement unlocked: ${a.name}`);
    }
  });
}

// ---------- GAME RESULT RECORDING (shared by every game module) ----------
function recordGameResult(gameId, score, accuracyPct, timeSeconds, difficulty) {
  const data = loadData();
  data.totalScore += score;
  data.bestScore = Math.max(data.bestScore, score);
  data.gamesPlayed += 1;
  data.totalTimeSeconds += timeSeconds || 0;
  if (accuracyPct >= 100) data.hadPerfect = true;

  const g = data.games[gameId];
  g.playCount += 1;
  g.bestScore = Math.max(g.bestScore || 0, score);
  g.avgAccuracy = Math.round(((g.avgAccuracy || 0) * (g.playCount - 1) + accuracyPct) / g.playCount);
  if (difficulty) g.lastDifficulty = difficulty;

  const dayLabel = new Date().toLocaleDateString("en-US", { weekday: "short" });
  data.trend.push({ day: dayLabel, score, ts: Date.now() });
  if (data.trend.length > 7) data.trend = data.trend.slice(-7);

  const mult = DIFF_MULT[difficulty] || 1;
  const xpGain = Math.round((GAMES_META[gameId]?.xp || 100) * mult);
  awardXP(data, xpGain, GAMES_META[gameId]?.name || gameId);

  const daily = getDailyChallenge(data);
  if (daily.gameId === gameId && !daily.completed) {
    daily.completed = true;
    const key = todayDateKey();
    updateStreak(data, key);
    awardXP(data, 150, "Daily Challenge bonus");
  }

  checkAchievements(data);
  saveData(data);

  renderGlobalStats();
  renderChallengeHub();
  renderDashboardExtras();
  if (document.getElementById("page-progress")?.classList.contains("active")) renderProgressPage();
  if (document.getElementById("page-achievements")?.classList.contains("active")) renderAchievementsPage();
}

// Reaction test records its own best-time logic in reaction.js, then calls this
// to keep best-time + attempts inside the shared data object.
function recordReactionTime(timeMs) {
  const data = loadData();
  data.games.reaction.attempts = (data.games.reaction.attempts || 0) + 1;
  const prevBest = data.games.reaction.bestTimeMs;
  const isNewBest = !prevBest || timeMs < prevBest;
  if (isNewBest) data.games.reaction.bestTimeMs = timeMs;
  saveData(data);
  return isNewBest;
}

// ---------- TOAST ----------
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ---------- CONFIRM MODAL ----------
function showConfirm(text, onConfirm) {
  const overlay = document.getElementById("modalOverlay");
  document.getElementById("modalText").textContent = text;
  overlay.classList.add("show");
  const confirmBtn = document.getElementById("modalConfirm");
  const cancelBtn = document.getElementById("modalCancel");
  function cleanup() { overlay.classList.remove("show"); confirmBtn.removeEventListener("click", onYes); cancelBtn.removeEventListener("click", onNo); }
  function onYes() { cleanup(); onConfirm(); }
  function onNo() { cleanup(); }
  confirmBtn.addEventListener("click", onYes);
  cancelBtn.addEventListener("click", onNo);
}

// ---------- LEVEL UP MODAL ----------
function showLevelUpModal(level) {
  const overlay = document.getElementById("levelUpOverlay");
  document.getElementById("levelUpText").textContent = `You reached Level ${String(level).padStart(2, "0")}`;
  overlay.classList.add("show");
}
function hideLevelUpModal() {
  document.getElementById("levelUpOverlay").classList.remove("show");
}

// ---------- NAVIGATION ----------
function goToPage(pageId) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const target = document.getElementById("page-" + pageId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.page === pageId));
  document.getElementById("content").scrollTop = 0;
  window.scrollTo({ top: 0 });
  closeSidebar();

  if (pageId === "progress") renderProgressPage();
  if (pageId === "achievements") renderAchievementsPage();
  if (pageId === "dashboard") { renderDashboardExtras(); renderChallengeHub(); }
}

function scrollToHub() {
  document.getElementById("challengeHub")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  if (theme === "light") { document.documentElement.setAttribute("data-theme", "light"); document.getElementById("themeToggle").textContent = "☀️"; }
  else { document.documentElement.removeAttribute("data-theme"); document.getElementById("themeToggle").textContent = "🌙"; }
}

// ---------- GLOBAL STATS (topbar + dashboard stat cards) ----------
function renderGlobalStats() {
  const data = loadData();
  document.getElementById("statTotalScore").textContent = data.totalScore.toLocaleString();
  document.getElementById("statBestScore").textContent = data.bestScore.toLocaleString();
  document.getElementById("userLevelTag").textContent = `Level ${data.level}`;

  // Header XP pill + player-chip mini bar (compact mirrors of the dashboard XP bar)
  const xpPct = Math.min(100, (data.xp / XP_PER_LEVEL) * 100);
  document.getElementById("headerLevelText").textContent = `${data.xp} / ${XP_PER_LEVEL}`;
  document.getElementById("headerXpFill").style.width = `${xpPct}%`;
  document.getElementById("chipXpFill").style.width = `${xpPct}%`;
}

// ---------- DASHBOARD EXTRAS: XP bar, streak, daily challenge ----------
function renderDashboardExtras() {
  const data = loadData();

  document.getElementById("xpLevelLabel").textContent = `LEVEL ${String(data.level).padStart(2, "0")}`;
  document.getElementById("xpFraction").textContent = `${data.xp} / ${XP_PER_LEVEL} XP`;
  document.getElementById("xpBarFill").style.width = `${Math.min(100, (data.xp / XP_PER_LEVEL) * 100)}%`;

  document.getElementById("streakValue").textContent = `${data.streak.count} Day Streak`;

  const daily = getDailyChallenge(data);
  saveData(data);
  const meta = GAMES_META[daily.gameId];
  document.getElementById("dailyGameName").textContent = meta.name;
  document.getElementById("dailyGameDesc").textContent = `Beat your personal record in ${meta.name}.`;
  const btn = document.getElementById("dailyStartBtn");
  if (daily.completed) {
    btn.textContent = "Completed ✓";
    btn.disabled = true;
  } else {
    btn.textContent = "Start Challenge";
    btn.disabled = false;
    btn.onclick = () => goToPage(daily.gameId);
  }
}

// ---------- CHALLENGE HUB (dynamic, search-filterable) ----------
function renderChallengeHub() {
  const data = loadData();
  const hub = document.getElementById("challengeHub");
  if (!hub) return;
  hub.innerHTML = "";

  GAME_IDS.forEach((id) => {
    const meta = GAMES_META[id];
    const g = data.games[id];
    const diffLabel = g.lastDifficulty ? g.lastDifficulty[0].toUpperCase() + g.lastDifficulty.slice(1) : meta.hasDifficulty ? "Easy / Medium / Hard" : "Standard";

    const card = document.createElement("article");
    card.className = `challenge-card accent-${meta.accent}`;
    card.dataset.page = id;
    card.dataset.name = meta.name.toLowerCase();
    card.innerHTML = `
      <div class="challenge-icon">${meta.icon}</div>
      <h3>${meta.name}</h3>
      <p>${meta.desc}</p>
      <div class="challenge-meta">
        <span class="chip">Difficulty: ${diffLabel}</span>
        <span class="chip">Best: ${g.bestScore || 0}</span>
      </div>
      <button class="btn-play">Play Now →</button>
    `;
    card.addEventListener("click", () => goToPage(id));
    hub.appendChild(card);
  });
}

function filterChallengeHub(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll("#challengeHub .challenge-card").forEach((card) => {
    const match = !q || card.dataset.name.includes(q);
    card.style.display = match ? "" : "none";
  });
}

// ---------- ACHIEVEMENTS PAGE ----------
function renderAchievementsPage() {
  const data = loadData();
  const grid = document.getElementById("achievementsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  ACHIEVEMENTS.forEach((a) => {
    const unlocked = data.achievements.includes(a.id);
    const card = document.createElement("div");
    card.className = `achievement-card glass${unlocked ? " unlocked" : " locked"}`;
    card.innerHTML = `
      <div class="achievement-icon">${a.icon}</div>
      <div class="achievement-body">
        <h3>${a.name}</h3>
        <p>${a.desc}</p>
      </div>
      <div class="achievement-status">${unlocked ? "Unlocked" : "Locked"}</div>
    `;
    grid.appendChild(card);
  });
}

// ---------- PROGRESS PAGE (advanced dashboard + brain profile) ----------
function progFormatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function renderProgressPage() {
  const data = loadData();

  document.getElementById("progXP").textContent = data.totalXP.toLocaleString();
  document.getElementById("progLevel").textContent = data.level;
  document.getElementById("progStreak").textContent = data.streak.count;
  document.getElementById("progGames").textContent = data.gamesPlayed;
  document.getElementById("progBest").textContent = data.bestScore.toLocaleString();
  document.getElementById("progTime").textContent = progFormatTime(data.totalTimeSeconds);

  const played = GAME_IDS.filter((id) => (data.games[id].playCount || 0) > 0);
  const overall = played.length
    ? Math.round(played.reduce((sum, id) => sum + (data.games[id].avgAccuracy || 0), 0) / played.length)
    : 0;
  document.getElementById("progOverall").textContent = `${overall}%`;

  // Skill bars — one per game, generated dynamically.
  const skillGrid = document.getElementById("skillGrid");
  skillGrid.innerHTML = "";
  GAME_IDS.forEach((id) => {
    const meta = GAMES_META[id];
    const pct = data.games[id].avgAccuracy || 0;
    const card = document.createElement("div");
    card.className = "skill-card glass";
    card.innerHTML = `
      <div class="skill-head"><span>${meta.name}</span><span>${pct}%</span></div>
      <div class="progress-bar"><div class="progress-fill ${meta.accent}" style="width:0%" data-target="${pct}"></div></div>
    `;
    skillGrid.appendChild(card);
  });
  requestAnimationFrame(() => {
    skillGrid.querySelectorAll(".progress-fill").forEach((bar) => {
      setTimeout(() => (bar.style.width = `${bar.dataset.target}%`), 30);
    });
  });

  // Brain Profile — derived only from real recorded accuracy, never randomized.
  const bp = {
    Memory: data.games.memory.avgAccuracy || 0,
    Logic: data.games.logic.avgAccuracy || 0,
    Speed: data.games.reaction.bestTimeMs ? Math.max(0, Math.round(100 - data.games.reaction.bestTimeMs / 6)) : 0,
    Numbers: Math.round(((data.games.number.avgAccuracy || 0) + (data.games.quickmath.avgAccuracy || 0)) / 2),
    Focus: data.games.colorfocus.avgAccuracy || 0,
    "Pattern Recognition": Math.round(((data.games.pattern.avgAccuracy || 0) + (data.games.sequence.avgAccuracy || 0)) / 2),
  };
  const bpGrid = document.getElementById("brainProfileGrid");
  bpGrid.innerHTML = "";
  Object.entries(bp).forEach(([label, pct]) => {
    const row = document.createElement("div");
    row.className = "skill-card glass";
    row.innerHTML = `
      <div class="skill-head"><span>${label}</span><span>${pct}%</span></div>
      <div class="progress-bar"><div class="progress-fill purple" style="width:0%" data-target="${pct}"></div></div>
    `;
    bpGrid.appendChild(row);
  });
  requestAnimationFrame(() => {
    bpGrid.querySelectorAll(".progress-fill").forEach((bar) => {
      setTimeout(() => (bar.style.width = `${bar.dataset.target}%`), 30);
    });
  });

  renderTrendChart(data.trend || []);
}

function renderTrendChart(trend) {
  const container = document.getElementById("trendChart");
  container.innerHTML = "";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxScore = Math.max(1, ...trend.map((t) => t.score));

  days.forEach((day) => {
    const entry = trend.find((t) => t.day === day);
    const heightPct = entry ? Math.max(6, Math.round((entry.score / maxScore) * 100)) : 4;
    const wrap = document.createElement("div");
    wrap.className = "trend-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "trend-bar";
    bar.style.height = "0%";
    wrap.appendChild(bar);
    const label = document.createElement("span");
    label.className = "trend-day";
    label.textContent = day;
    wrap.appendChild(label);
    container.appendChild(wrap);
    requestAnimationFrame(() => setTimeout(() => (bar.style.height = `${heightPct}%`), 30));
  });
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  const data = loadData();
  applyTheme(data.theme || "dark");
  renderGlobalStats();
  renderChallengeHub();
  renderDashboardExtras();
  checkAchievements(data);
  saveData(data);

  // Nav clicks (sidebar items + any element carrying data-page)
  document.querySelectorAll("[data-page]").forEach((el) => {
    if (el.id === "challengeHub") return;
    el.addEventListener("click", () => goToPage(el.dataset.page));
  });

  // "Back to Challenges" buttons on every game page
  document.querySelectorAll(".back-to-hub").forEach((btn) => {
    btn.addEventListener("click", () => { goToPage("dashboard"); setTimeout(scrollToHub, 60); });
  });

  // Start Playing → scroll to hub instead of opening a game directly
  document.getElementById("startPlayingBtn").addEventListener("click", () => {
    goToPage("dashboard");
    setTimeout(scrollToHub, 60);
  });

  // Hamburger / sidebar overlay
  document.getElementById("hamburger").addEventListener("click", openSidebar);
  document.getElementById("sidebarOverlay").addEventListener("click", closeSidebar);

  // Notification icon — cosmetic/informational only, no real notification backend
  document.getElementById("notifBtn").addEventListener("click", () => {
    showToast("You're all caught up — no new notifications");
  });

  // Theme toggle
  document.getElementById("themeToggle").addEventListener("click", () => {
    const current = loadData();
    const next = current.theme === "light" ? "dark" : "light";
    current.theme = next;
    saveData(current);
    applyTheme(next);
  });

  // Functional search — filters the Challenge Hub live
  document.getElementById("searchInput").addEventListener("input", (e) => {
    goToPage("dashboard");
    filterChallengeHub(e.target.value);
  });

  // Level-up modal close
  document.getElementById("levelUpClose").addEventListener("click", hideLevelUpModal);

  // Reset progress
  document.getElementById("resetProgressBtn").addEventListener("click", () => {
    showConfirm("Are you sure you want to reset your progress?", () => {
      const theme = loadData().theme;
      const fresh = freshData();
fresh.theme = theme;
      saveData(fresh);
      renderGlobalStats();
      renderChallengeHub();
      renderDashboardExtras();
      renderProgressPage();
      renderAchievementsPage();
      showToast("Progress reset");
    });
  });
});
