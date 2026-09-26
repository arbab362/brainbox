/* =========================================================
   progress.js — Progress page rendering
   ========================================================= */

function progFormatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function renderProgressPage() {
  const data = loadData();

  // Overall score = average accuracy across the four skills that have been played.
  const skills = ["memory", "number", "reaction", "logic"];
  const played = skills.filter((s) => (data[s].playCount || data[s].attempts || 0) > 0);
  const overall = played.length
    ? Math.round(
        played.reduce((sum, s) => sum + (data[s].avgAccuracy || 0), 0) / played.length
      )
    : 0;

  document.getElementById("progOverall").textContent = `${overall}%`;
  document.getElementById("progGames").textContent = data.gamesPlayed;
  document.getElementById("progBest").textContent = data.bestScore.toLocaleString();
  document.getElementById("progTime").textContent = progFormatTime(data.totalTimeSeconds);

  // Skill bars
  setSkillBar("Memory", data.memory.avgAccuracy || 0);
  setSkillBar("Number", data.number.avgAccuracy || 0);
  setSkillBar("Reaction", data.reaction.avgAccuracy || 0);
  setSkillBar("Logic", data.logic.avgAccuracy || 0);

  renderTrendChart(data.trend || []);
}

function setSkillBar(name, pct) {
  document.getElementById(`skill${name}Pct`).textContent = `${pct}%`;
  document.getElementById(`skill${name}Bar`).style.width = `${pct}%`;
}

function renderTrendChart(trend) {
  const container = document.getElementById("trendChart");
  container.innerHTML = "";

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Build a 7-slot view: use recent trend entries mapped onto the week,
  // falling back to empty bars if no data exists yet for a day.
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

    // Animate to final height shortly after insertion.
    requestAnimationFrame(() => {
      setTimeout(() => (bar.style.height = `${heightPct}%`), 30);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderProgressPage();
});
