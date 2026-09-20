const STORAGE_KEY = "foodChainingAdventureV1";
const STAGES = ["touch", "play with", "smell", "lick", "nibble", "bite", "swallow", "ate"];
const LEVELS = [
  "Tiny Taster",
  "Snack Scout",
  "Texture Tracker",
  "Flavor Explorer",
  "Meal Adventurer",
  "Chain Champion",
  "Super Parent Questmaster"
];

const FOOD_DATASET = [
  { name: "oatmeal", meal: "breakfast", texture: "soft", flavor: "mild", temp: "warm", tags: ["grain"], ageMin: 1 },
  { name: "banana pancakes", meal: "breakfast", texture: "soft", flavor: "sweet", temp: "warm", tags: ["banana", "grain"], ageMin: 2 },
  { name: "yogurt parfait", meal: "breakfast", texture: "creamy", flavor: "sweet", temp: "cold", tags: ["dairy", "fruit"], ageMin: 2 },
  { name: "scrambled eggs", meal: "breakfast", texture: "soft", flavor: "savory", temp: "warm", tags: ["egg"], ageMin: 1 },
  { name: "french toast sticks", meal: "breakfast", texture: "soft", flavor: "sweet", temp: "warm", tags: ["grain", "egg"], ageMin: 2 },

  { name: "grilled cheese", meal: "lunch", texture: "crispy-soft", flavor: "savory", temp: "warm", tags: ["dairy", "grain"], ageMin: 2 },
  { name: "turkey sandwich", meal: "lunch", texture: "soft", flavor: "savory", temp: "cool", tags: ["grain", "protein"], ageMin: 3 },
  { name: "quesadilla", meal: "lunch", texture: "soft", flavor: "savory", temp: "warm", tags: ["dairy", "grain"], ageMin: 2 },
  { name: "chicken wrap", meal: "lunch", texture: "soft", flavor: "savory", temp: "cool", tags: ["grain", "protein"], ageMin: 4 },
  { name: "pasta salad", meal: "lunch", texture: "mixed", flavor: "mild", temp: "cool", tags: ["grain"], ageMin: 4 },

  { name: "mac and cheese", meal: "dinner", texture: "creamy", flavor: "savory", temp: "warm", tags: ["dairy", "grain"], ageMin: 2 },
  { name: "chicken nuggets", meal: "dinner", texture: "crispy-soft", flavor: "savory", temp: "warm", tags: ["protein"], ageMin: 2 },
  { name: "baked salmon", meal: "dinner", texture: "soft", flavor: "savory", temp: "warm", tags: ["fish"], ageMin: 4 },
  { name: "mashed potatoes", meal: "dinner", texture: "soft", flavor: "mild", temp: "warm", tags: ["starch"], ageMin: 2 },
  { name: "rice and beans", meal: "dinner", texture: "soft", flavor: "mild", temp: "warm", tags: ["grain", "protein"], ageMin: 3 },

  { name: "apple slices", meal: "snacks", texture: "crunchy", flavor: "sweet", temp: "cool", tags: ["fruit"], ageMin: 2 },
  { name: "crackers", meal: "snacks", texture: "crunchy", flavor: "mild", temp: "room", tags: ["grain"], ageMin: 1 },
  { name: "hummus and pita", meal: "snacks", texture: "creamy", flavor: "savory", temp: "room", tags: ["legume", "grain"], ageMin: 3 },
  { name: "cheese cubes", meal: "snacks", texture: "firm", flavor: "savory", temp: "cool", tags: ["dairy"], ageMin: 2 },
  { name: "smoothie", meal: "snacks", texture: "smooth", flavor: "sweet", temp: "cold", tags: ["fruit"], ageMin: 2 }
];

let state = loadState();

const parentForm = document.getElementById("parentForm");
const childForm = document.getElementById("childForm");
const familySummary = document.getElementById("familySummary");
const dailyPlans = document.getElementById("dailyPlans");
const parentGamePanel = document.getElementById("parentGamePanel");
const exportPdfBtn = document.getElementById("exportPdf");
const reportPreview = document.getElementById("reportPreview");
const heroStatus = document.getElementById("heroStatus");
const quickStats = document.getElementById("quickStats");

parentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.parent.name = document.getElementById("parentName").value.trim();
  saveState();
  render();
});

childForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const meals = {
    breakfast: parseFoods(document.getElementById("breakfastFoods").value),
    lunch: parseFoods(document.getElementById("lunchFoods").value),
    dinner: parseFoods(document.getElementById("dinnerFoods").value),
    snacks: parseFoods(document.getElementById("snackFoods").value)
  };

  const child = {
    id: crypto.randomUUID(),
    name: document.getElementById("childName").value.trim(),
    age: Number(document.getElementById("childAge").value),
    gender: document.getElementById("childGender").value.trim(),
    neurodivergent: document.getElementById("childNeuro").value === "yes",
    allergies: document.getElementById("childAllergies").value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
    acceptedFoods: meals,
    chains: {},
    outcomes: {}
  };

  child.chains = buildAllChains(child);
  state.kids.push(child);
  saveState();
  childForm.reset();
  render();
});

exportPdfBtn.addEventListener("click", () => {
  window.print();
});

function parseFoods(input) {
  return input
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, brand = "", pref = "3"] = entry.split("|").map((x) => x.trim());
      return { name, brand, preference: Math.min(5, Math.max(1, Number(pref) || 3)) };
    });
}

function buildAllChains(child) {
  const result = {};
  ["breakfast", "lunch", "dinner", "snacks"].forEach((meal) => {
    result[meal] = child.acceptedFoods[meal].map((accepted) => ({
      baseFood: accepted,
      steps: buildChainForFood(child, meal, accepted)
    }));
  });
  return result;
}

function buildChainForFood(child, meal, accepted) {
  const base = findFoodItem(accepted.name, meal) || {
    name: accepted.name,
    meal,
    texture: "soft",
    flavor: "mild",
    temp: "room",
    tags: tokenize(accepted.name),
    ageMin: 1
  };

  const pool = FOOD_DATASET
    .filter((item) => item.meal === meal)
    .filter((item) => item.name.toLowerCase() !== accepted.name.toLowerCase())
    .filter((item) => item.ageMin <= child.age)
    .filter((item) => !containsAllergen(item, child.allergies));

  const ranked = pool
    .map((item) => ({ item, score: scoreSimilarity(base, item, child.neurodivergent) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.item.name);

  return [accepted.name, ...ranked];
}

function findFoodItem(name, meal) {
  return FOOD_DATASET.find((item) => item.meal === meal && item.name.toLowerCase() === name.toLowerCase());
}

function containsAllergen(food, allergens) {
  const name = food.name.toLowerCase();
  const tags = food.tags.join(" ").toLowerCase();
  return allergens.some((allergen) => name.includes(allergen) || tags.includes(allergen));
}

function scoreSimilarity(base, candidate, neurodivergent) {
  let score = 0;
  if (base.texture === candidate.texture) score += neurodivergent ? 5 : 3;
  if (base.flavor === candidate.flavor) score += 3;
  if (base.temp === candidate.temp) score += 2;

  const overlap = base.tags.filter((tag) => candidate.tags.includes(tag)).length;
  score += overlap * 2;
  return score;
}

function tokenize(foodName) {
  return foodName.toLowerCase().split(/\s+/).filter(Boolean);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      parent: { name: "" },
      kids: [],
      game: { totalLogs: 0, streakDays: 0, lastLogDay: null }
    };
  }
  return JSON.parse(raw);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderHeroStatus();
  renderFamilySummary();
  renderGamePanel();
  renderReportPreview();
}

function renderFamilySummary() {
  renderQuickStats();

  const childCount = state.kids.length;
  const chainCount = calculateTotalChains();
  const summaryBanner = `
    <div class="summary-banner">
      <div>
        <strong>${escapeHtml(state.parent.name || "Welcome")}</strong>
        <p>${state.parent.name ? "Your family dashboard is ready for gentle food chaining wins." : "Add a parent profile to personalize your planner."}</p>
      </div>
      <div class="summary-grid">
        <span class="summary-chip">${childCount} ${childCount === 1 ? "child" : "children"}</span>
        <span class="summary-chip">${chainCount} active ${chainCount === 1 ? "chain" : "chains"}</span>
      </div>
    </div>
  `;

  if (!state.kids.length) {
    familySummary.innerHTML = `${summaryBanner}${renderEmptyState("No children added yet", "Add your first child to unlock personalized food chains, progress tracking, and printable daily plans.")}`;
    dailyPlans.innerHTML = `<div class="empty-state"><h3>Daily plans will appear here</h3><p>As soon as you add accepted foods, the planner will spotlight the next gentle exposure steps for each meal.</p></div>`;
    return;
  }

  familySummary.innerHTML = `${summaryBanner}<div class="dashboard-grid">${state.kids.map(renderChildCard).join("")}</div>`;
  dailyPlans.innerHTML = `
    <div class="section-head">
      <div>
        <span class="section-kicker">Today</span>
        <h3>📅 Daily Plans</h3>
      </div>
    </div>
    <div class="dashboard-grid">${state.kids.map(renderDailyPlan).join("")}</div>
  `;

  document.querySelectorAll(".logBtn").forEach((button) => {
    button.addEventListener("click", handleLogAttempt);
  });
}

function renderChildCard(child) {
  const meals = ["breakfast", "lunch", "dinner", "snacks"];
  const chainBlocks = meals.map((meal) => {
    const chains = child.chains[meal] || [];
    const body = chains.length
      ? chains.map((chain, index) => renderChain(child, meal, index, chain)).join("")
      : "<p class='list-muted'>No accepted foods yet.</p>";

    return `<section class="meal-card"><h4>${capitalize(meal)}</h4>${body}</section>`;
  }).join("");

  return `
    <article class="child-card">
      <div class="child-header">
        <div>
          <h3>${escapeHtml(child.name)}</h3>
          <p class="list-muted">${child.age} years old</p>
        </div>
        <span class="meta-pill">${child.neurodivergent ? "Neurodivergent support on" : "Standard support"}</span>
      </div>
      <div class="child-meta">
        <span class="summary-chip">Gender: ${escapeHtml(child.gender)}</span>
        <span class="summary-chip">Allergies: ${child.allergies.length ? child.allergies.map(escapeHtml).join(", ") : "None listed"}</span>
      </div>
      <div class="child-sections">${chainBlocks}</div>
    </article>
  `;
}

function renderChain(child, meal, chainIndex, chain) {
  const chainKey = `${child.id}:${meal}:${chainIndex}`;
  const stepProgress = state.kids
    .find((k) => k.id === child.id)
    .outcomes[chainKey] || chain.steps.map(() => -1);

  const activeStep = Math.min(stepProgress.findIndex((stageIdx) => stageIdx < STAGES.length - 1), chain.steps.length - 1);
  const currentStep = activeStep === -1 ? chain.steps.length - 1 : activeStep;
  const currentStage = stepProgress[currentStep] ?? -1;
  const stageText = currentStage >= 0 ? STAGES[currentStage] : "not started";
  const stepPills = chain.steps.map((step, index) => {
    const statusClass = index < currentStep ? "completed" : index === currentStep ? "active" : "";
    const statusPrefix = index < currentStep ? "Done: " : index === currentStep ? "Current: " : "";
    const statusLabel = index < currentStep ? "Completed step" : index === currentStep ? "Current step" : "Upcoming step";
    return `<span class="step-pill ${statusClass}" aria-label="${statusLabel}: ${escapeHtml(step)}">${statusPrefix}${escapeHtml(step)}</span>`;
  }).join("");

  const options = STAGES.map((stage, idx) => `<option value="${idx}">${stage}</option>`).join("");

  return `
    <div class="chain-row">
      <div class="chain-title">${escapeHtml(chain.baseFood.name)} chain</div>
      <div class="chain-steps">${stepPills}</div>
      <div class="status"><span class="status-dot"></span>Current step: ${escapeHtml(chain.steps[currentStep])} · Stage: ${stageText}</div>
      <div class="log-row">
        <select class="stageSelect" data-child-id="${child.id}" data-meal="${meal}" data-chain-index="${chainIndex}">${options}</select>
        <button class="logBtn" data-child-id="${child.id}" data-meal="${meal}" data-chain-index="${chainIndex}">Log Attempt</button>
      </div>
    </div>
  `;
}

function renderDailyPlan(child) {
  const meals = ["breakfast", "lunch", "dinner", "snacks"];
  const items = meals.map((meal) => {
    const chains = child.chains[meal] || [];
    if (!chains.length) return `<li><strong>${capitalize(meal)}:</strong> no chains yet</li>`;

    const activeFoods = chains.map((chain, chainIndex) => {
      const key = `${child.id}:${meal}:${chainIndex}`;
      const progress = child.outcomes[key] || chain.steps.map(() => -1);
      const activeStep = progress.findIndex((stageIdx) => stageIdx < STAGES.length - 1);
      const stepIndex = activeStep === -1 ? chain.steps.length - 1 : activeStep;
      return `${chain.steps[stepIndex]} (${chain.baseFood.name})`;
    });

    return `<li><strong>${capitalize(meal)}:</strong> ${activeFoods.map(escapeHtml).join(", ")}</li>`;
  }).join("");

  return `<article class="plan-card"><h4>${escapeHtml(child.name)}'s Plan</h4><ul class="plan-list">${items}</ul></article>`;
}

function handleLogAttempt(event) {
  const button = event.currentTarget;
  const childId = button.dataset.childId;
  const meal = button.dataset.meal;
  const chainIndex = Number(button.dataset.chainIndex);
  const select = button.previousElementSibling;
  const stageIdx = Number(select.value);

  const child = state.kids.find((kid) => kid.id === childId);
  const chain = child.chains[meal][chainIndex];
  const key = `${childId}:${meal}:${chainIndex}`;

  if (!child.outcomes[key]) {
    child.outcomes[key] = chain.steps.map(() => -1);
  }

  const progress = child.outcomes[key];
  let activeStep = progress.findIndex((value) => value < STAGES.length - 1);
  if (activeStep === -1) activeStep = chain.steps.length - 1;

  progress[activeStep] = Math.max(progress[activeStep], stageIdx);

  awardParentEffortPoints();
  saveState();
  render();
}

function awardParentEffortPoints() {
  const today = new Date().toISOString().slice(0, 10);
  state.game.totalLogs += 1;

  if (!state.game.lastLogDay) {
    state.game.streakDays = 1;
  } else if (state.game.lastLogDay === today) {
    state.game.streakDays = Math.max(1, state.game.streakDays);
  } else {
    const prev = new Date(state.game.lastLogDay);
    const now = new Date(today);
    const diffDays = Math.round((now - prev) / (1000 * 60 * 60 * 24));
    state.game.streakDays = diffDays === 1 ? state.game.streakDays + 1 : 1;
  }

  state.game.lastLogDay = today;
}

function renderGamePanel() {
  const { points, levelTitle } = getGameStats();

  const badges = [];
  if (state.game.totalLogs >= 5) badges.push("First Five Logs");
  if (state.game.totalLogs >= 25) badges.push("Consistency Hero");
  if (state.game.totalLogs >= 75) badges.push("Routine Rockstar");
  if (state.game.streakDays >= 3) badges.push("3-Day Streak");
  if (state.game.streakDays >= 7) badges.push("7-Day Streak");

  parentGamePanel.innerHTML = `
    <section class="quest-shell">
     <div class="quest-header">
      <div>
        <h3>Effort drives the adventure</h3>
        <p class="status-copy">Celebrate consistency, not pressure. Every logged attempt moves the story forward.</p>
      </div>
      <span class="level-chip">${escapeHtml(levelTitle)}</span>
     </div>
     <div class="quest-stats">
      <div class="stat-card"><strong>${points}</strong><span>effort points</span></div>
      <div class="stat-card"><strong>${state.game.streakDays}</strong><span>streak day(s)</span></div>
      <div class="stat-card"><strong>${state.game.totalLogs}</strong><span>total logs</span></div>
     </div>
     <div class="badge-row">
      ${badges.length ? badges.map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("") : "<p class='list-muted'>No badges yet — start logging attempts to unlock them.</p>"}
     </div>
    </section>
  `;
}

function renderReportPreview() {
  const { points, levelTitle } = getGameStats();
  reportPreview.innerHTML = `
    <div class="report-toolbar">
     <div>
      <h3>Full Report Snapshot</h3>
      <p class="report-intro">A quick export preview of the current family setup, chaining progress, and parent rewards.</p>
     </div>
    </div>
    <div class="report-stack">
     <article class="report-card">
      <h4>Family Summary</h4>
      <ul class="report-list">
        <li><strong>Parent:</strong> ${escapeHtml(state.parent.name || "Not set")}</li>
        <li><strong>Children:</strong> ${state.kids.length}</li>
        <li><strong>Active chains:</strong> ${calculateTotalChains()}</li>
        <li><strong>Quest level:</strong> ${escapeHtml(levelTitle)} (${points} points)</li>
      </ul>
     </article>
     <div class="report-grid">
     ${state.kids.map((child) => {
      const meals = ["breakfast", "lunch", "dinner", "snacks"];
      const chainsMarkup = meals.map((meal) => {
        const chains = child.chains[meal] || [];
        return `
        <h4>${capitalize(meal)}</h4>
        <ul class="report-list">
            ${chains.map((chain, idx) => {
              const key = `${child.id}:${meal}:${idx}`;
              const progress = child.outcomes[key] || chain.steps.map(() => -1);
              return `<li><strong>${escapeHtml(chain.baseFood.name)}:</strong> ${chain.steps.map(escapeHtml).join(" → ")}<span class="report-detail">Stages: ${progress.map((value) => escapeHtml(value >= 0 ? STAGES[value] : "not started")).join(" | ")}</span></li>`;
            }).join("")}
          </ul>
        `;
      }).join("");

      return `<article class="report-card"><h3>${escapeHtml(child.name)}</h3>${chainsMarkup}</article>`;
    }).join("")}
     </div>
     <article class="report-card">
      <h4>Parent Rewards</h4>
      <ul class="report-list">
        <li><strong>Total logs:</strong> ${state.game.totalLogs}</li>
        <li><strong>Streak:</strong> ${state.game.streakDays} day(s)</li>
      </ul>
     </article>
    </div>
  `;
}

function renderHeroStatus() {
  if (!heroStatus) return;
  const { points, levelTitle } = getGameStats();
  heroStatus.innerHTML = `
    <div class="stat-card"><strong>${state.kids.length}</strong><span>kids tracked</span></div>
    <div class="stat-card"><strong>${calculateTotalChains()}</strong><span>food chains</span></div>
    <div class="stat-card"><strong>${points}</strong><span>${escapeHtml(levelTitle)}</span></div>
  `;
}

function renderQuickStats() {
  if (!quickStats) return;
  quickStats.innerHTML = `
    <div class="stat-card"><strong>${countAcceptedFoods()}</strong><span>accepted foods</span></div>
    <div class="stat-card"><strong>${state.game.totalLogs}</strong><span>attempts logged</span></div>
    <div class="stat-card"><strong>${state.game.streakDays}</strong><span>day streak</span></div>
  `;
}

function renderEmptyState(title, description) {
  return `<div class="empty-state"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div>`;
}

function calculateTotalChains() {
  return state.kids.reduce((total, child) => total + Object.values(child.chains).reduce((mealTotal, chains) => mealTotal + chains.length, 0), 0);
}

function countAcceptedFoods() {
  return state.kids.reduce((total, child) => total + Object.values(child.acceptedFoods).reduce((mealTotal, foods) => mealTotal + foods.length, 0), 0);
}

function getGameStats() {
  const points = state.game.totalLogs * 10 + Math.min(state.game.streakDays, 30) * 2;
  const levelIndex = Math.min(LEVELS.length - 1, Math.floor(points / 120));
  const levelTitle = LEVELS[levelIndex];
  return { points, levelTitle };
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

render();
