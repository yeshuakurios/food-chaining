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
const MEALS = ["breakfast", "lunch", "dinner", "snacks"];
const ACHIEVEMENTS = [
  {
    id: "first-log",
    name: "First Brave Log",
    description: "Log your first parent effort entry.",
    emoji: "🌟",
    qualifies: (game) => game.totalLogs >= 1
  },
  {
    id: "five-logs",
    name: "First Five Logs",
    description: "Show up for five food-chaining attempts.",
    emoji: "📝",
    qualifies: (game) => game.totalLogs >= 5
  },
  {
    id: "consistency-hero",
    name: "Consistency Hero",
    description: "Reach twenty-five total effort logs.",
    emoji: "💪",
    qualifies: (game) => game.totalLogs >= 25
  },
  {
    id: "routine-rockstar",
    name: "Routine Rockstar",
    description: "Reach seventy-five total effort logs.",
    emoji: "🎸",
    qualifies: (game) => game.totalLogs >= 75
  },
  {
    id: "three-day-streak",
    name: "3-Day Streak",
    description: "Log effort three days in a row.",
    emoji: "🔥",
    qualifies: (game) => game.streakDays >= 3
  },
  {
    id: "seven-day-streak",
    name: "7-Day Streak",
    description: "Keep the parent streak going for a full week.",
    emoji: "🏅",
    qualifies: (game) => game.streakDays >= 7
  }
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
let currentPage = window.location.hash === "#achievements" ? "achievements" : "planner";
let celebrationTimeouts = [];

const parentForm = document.getElementById("parentForm");
const childForm = document.getElementById("childForm");
const familySummary = document.getElementById("familySummary");
const dailyPlans = document.getElementById("dailyPlans");
const parentGamePanel = document.getElementById("parentGamePanel");
const exportPdfBtn = document.getElementById("exportPdf");
const reportPreview = document.getElementById("reportPreview");
const heroStatus = document.getElementById("heroStatus");
const quickStats = document.getElementById("quickStats");
const topQuestPanel = document.getElementById("topQuestPanel");
const plannerPage = document.getElementById("plannerPage");
const achievementsPage = document.getElementById("achievementsPage");
const pageTabs = Array.from(document.querySelectorAll(".page-tab"));
const celebrationLayer = document.getElementById("celebrationLayer");
const childDobInput = document.getElementById("childDob");

if (childDobInput) {
  childDobInput.max = getTodayIsoDate();
}

parentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.parent.name = document.getElementById("parentName").value.trim();
  saveState();
  render();
});

childForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const dob = childDobInput.value;
  if (!isValidDob(dob)) {
    childDobInput.setCustomValidity("Enter a valid birth date that is not in the future.");
    childDobInput.reportValidity();
    return;
  }
  childDobInput.setCustomValidity("");

  const meals = {
    breakfast: parseFoods(document.getElementById("breakfastFoods").value),
    lunch: parseFoods(document.getElementById("lunchFoods").value),
    dinner: parseFoods(document.getElementById("dinnerFoods").value),
    snacks: parseFoods(document.getElementById("snackFoods").value)
  };

  const child = {
    id: crypto.randomUUID(),
    name: document.getElementById("childName").value.trim(),
    dob,
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
  childDobInput.max = getTodayIsoDate();
  render();
});

exportPdfBtn.addEventListener("click", () => {
  window.print();
});

pageTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setCurrentPage(button.dataset.page);
  });
});

window.addEventListener("hashchange", () => {
  setCurrentPage(window.location.hash === "#achievements" ? "achievements" : "planner", { syncHash: false });
});

function parseFoods(input) {
  return input
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean)
    .map(parseFoodEntry)
    .filter((entry) => entry.name);
}

function parseFoodEntry(entry) {
  if (entry.includes("|")) {
    const [name, brand = "", pref = "3"] = entry.split("|").map((x) => x.trim());
    return { name, brand, preference: clampPreference(pref) };
  }

  const tokens = tokenizeFoodEntry(entry);
  const values = tokens.map((token) => token.value);
  if (!values.length) {
    return { name: "", brand: "", preference: 3 };
  }

  let preference = 3;
  let hasExplicitScore = false;
  const lastToken = values[values.length - 1];
  if (/^[1-5]$/.test(lastToken)) {
    hasExplicitScore = true;
    preference = clampPreference(lastToken);
    tokens.pop();
    values.pop();
  }

  if (!values.length) {
    return { name: "", brand: "", preference };
  }

  if (!hasExplicitScore) {
    return {
      name: values.join(" ").trim(),
      brand: "",
      preference
    };
  }

  if (values.length === 1) {
    return {
      name: values[0],
      brand: "",
      preference
    };
  }

  const fullName = values.join(" ").trim();
  const baseName = values.slice(0, -1).join(" ").trim();
  const brand = values[values.length - 1].trim();

  if (findFoodItem(baseName) && !findFoodItem(fullName)) {
    return { name: baseName, brand, preference };
  }

  if (values.length === 2) {
    const hasQuotedBoundary = tokens[0].quoted || tokens[1].quoted;
    if (findFoodItem(values[0]) || hasQuotedBoundary) {
      return { name: values[0].trim(), brand, preference };
    }
    return { name: fullName, brand: "", preference };
  }

  return {
    name: fullName,
    brand: "",
    preference
  };
}

function tokenizeFoodEntry(entry) {
  const matches = entry.match(/"([^"]+)"|'([^']+)'|\S+/g) || [];
  return matches
    .map((token) => ({
      value: token.replace(/^['"]|['"]$/g, "").trim(),
      quoted: /^['"]/.test(token) && /['"]$/.test(token)
    }))
    .filter((token) => token.value);
}

function clampPreference(value) {
  return Math.min(5, Math.max(1, Number(value) || 3));
}

function buildAllChains(child) {
  const result = {};
  MEALS.forEach((meal) => {
    result[meal] = child.acceptedFoods[meal].map((accepted) => ({
      baseFood: accepted,
      steps: buildChainForFood(child, meal, accepted)
    }));
  });
  return result;
}

function buildChainForFood(child, meal, accepted) {
  const childAge = getChildAge(child);
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
    .filter((item) => item.ageMin <= childAge)
    .filter((item) => !containsAllergen(item, child.allergies));

  const ranked = pool
    .map((item) => ({ item, score: scoreSimilarity(base, item, child.neurodivergent) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.item.name);

  return [accepted.name, ...ranked];
}

function findFoodItem(name, meal) {
  return FOOD_DATASET.find((item) => (!meal || item.meal === meal) && item.name.toLowerCase() === name.toLowerCase());
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
  score += (acceptedPreferenceBoost(base) + acceptedPreferenceBoost(candidate)) / 2;

  const overlap = base.tags.filter((tag) => candidate.tags.includes(tag)).length;
  score += overlap * 2;
  return score;
}

function acceptedPreferenceBoost(food) {
  return Number(food.preference) > 0 ? Number(food.preference) / 2 : 0;
}

function tokenize(foodName) {
  return foodName.toLowerCase().split(/\s+/).filter(Boolean);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultState();
  }

  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function defaultState() {
  return {
    parent: { name: "" },
    kids: [],
    game: {
      totalLogs: 0,
      streakDays: 0,
      lastLogDay: null,
      unlockedAchievements: [],
      highestLevelIndex: 0
    }
  };
}

function normalizeState(rawState) {
  const base = defaultState();
  const nextState = {
    parent: { name: rawState?.parent?.name || "" },
    kids: Array.isArray(rawState?.kids) ? rawState.kids.map(normalizeChild) : [],
    game: {
      ...base.game,
      ...(rawState?.game || {})
    }
  };

  nextState.kids.forEach((child) => {
    child.chains = buildAllChains(child);
  });

  const rewardSnapshot = getRewardSnapshot(nextState.game);
  nextState.game.unlockedAchievements = rewardSnapshot.unlockedAchievementIds;
  nextState.game.highestLevelIndex = Math.max(Number(nextState.game.highestLevelIndex) || 0, rewardSnapshot.levelIndex);
  return nextState;
}

function normalizeChild(child) {
  const acceptedFoods = {};
  MEALS.forEach((meal) => {
    acceptedFoods[meal] = Array.isArray(child?.acceptedFoods?.[meal])
      ? child.acceptedFoods[meal].map((food) => ({
        name: String(food?.name || "").trim(),
        brand: String(food?.brand || "").trim(),
        preference: clampPreference(food?.preference)
      })).filter((food) => food.name)
      : [];
  });

  return {
    id: child?.id || crypto.randomUUID(),
    name: String(child?.name || "").trim(),
    dob: typeof child?.dob === "string" ? child.dob : "",
    age: Number(child?.age) || Number(child?.ageYears) || 0,
    gender: String(child?.gender || "").trim(),
    neurodivergent: Boolean(child?.neurodivergent),
    allergies: Array.isArray(child?.allergies) ? child.allergies.map((allergy) => String(allergy).trim().toLowerCase()).filter(Boolean) : [],
    acceptedFoods,
    chains: child?.chains || {},
    outcomes: child?.outcomes || {}
  };
}

function saveState() {
  syncStateForRender();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncStateForRender() {
  state.kids.forEach((child) => {
    child.chains = buildAllChains(child);
    child.outcomes = child.outcomes || {};
  });

  const rewardSnapshot = getRewardSnapshot(state.game);
  state.game.unlockedAchievements = rewardSnapshot.unlockedAchievementIds;
  state.game.highestLevelIndex = Math.max(Number(state.game.highestLevelIndex) || 0, rewardSnapshot.levelIndex);
}

function render() {
  syncStateForRender();
  renderHeroStatus();
  renderTopQuestPanel();
  renderFamilySummary();
  renderAchievementsPage();
  renderReportPreview();
  renderPageView();
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
  const chainBlocks = MEALS.map((meal) => {
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
          <p class="list-muted">${escapeHtml(getChildAgeSummary(child))}</p>
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
  const stepProgress = state.kids.find((k) => k.id === child.id).outcomes[chainKey] || chain.steps.map(() => -1);
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
        <select class="stageSelect" aria-label="Stage reached for ${escapeHtml(chain.baseFood.name)}" data-child-id="${child.id}" data-meal="${meal}" data-chain-index="${chainIndex}">${options}</select>
        <button class="logBtn" data-child-id="${child.id}" data-meal="${meal}" data-chain-index="${chainIndex}">Log Parent Effort</button>
      </div>
    </div>
  `;
}

function renderDailyPlan(child) {
  const items = MEALS.map((meal) => {
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

  const celebrations = awardParentEffortPoints();
  saveState();
  render();
  triggerCelebrations(celebrations);
}

function awardParentEffortPoints() {
  const before = getRewardSnapshot(state.game);
  const today = getTodayIsoDate();
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

  const after = getRewardSnapshot(state.game);
  state.game.unlockedAchievements = after.unlockedAchievementIds;
  state.game.highestLevelIndex = Math.max(Number(state.game.highestLevelIndex) || 0, after.levelIndex);

  const celebrations = [];
  if (after.levelIndex > before.levelIndex) {
    celebrations.push({
      title: "Level up!",
      message: `You reached ${after.levelTitle}.`,
      emoji: "⭐"
    });
  }

  after.unlockedAchievements
    .filter((id) => !before.unlockedAchievementIds.includes(id))
    .map((id) => ACHIEVEMENTS.find((achievement) => achievement.id === id))
    .filter(Boolean)
    .forEach((achievement) => {
      celebrations.push({
        title: "Achievement unlocked!",
        message: `${achievement.emoji} ${achievement.name}`,
        emoji: achievement.emoji
      });
    });

  return celebrations;
}

function renderTopQuestPanel() {
  if (!topQuestPanel) return;
  const stats = getGameStats();
  const unlockedCount = getUnlockedAchievements().length;
  const levelProgressPercent = stats.pointsForNextLevel === 0
    ? 100
    : Math.round((stats.levelProgressPoints / stats.pointsForNextLevel) * 100);

  topQuestPanel.innerHTML = `
    <section class="quest-shell quest-overview-shell">
      <div class="quest-overview-grid">
        <div class="stat-card stat-card-highlight">
          <strong>${stats.points}</strong>
          <span>parent XP</span>
        </div>
        <div class="stat-card">
          <strong>${escapeHtml(stats.levelTitle)}</strong>
          <span>current level</span>
        </div>
        <div class="stat-card">
          <strong>${state.game.streakDays}</strong>
          <span>streak day(s)</span>
        </div>
        <div class="stat-card">
          <strong>${unlockedCount}</strong>
          <span>achievements unlocked</span>
        </div>
      </div>
      <div class="level-progress-card">
        <div class="level-progress-copy">
          <strong>${stats.nextLevelTitle ? `Next: ${escapeHtml(stats.nextLevelTitle)}` : "Max level reached"}</strong>
          <span>${stats.nextLevelTitle ? `${stats.pointsToNextLevel} XP to go` : "You unlocked every current level."}</span>
        </div>
        <div class="level-progress-track" aria-hidden="true"><span style="width: ${levelProgressPercent}%;"></span></div>
      </div>
    </section>
  `;
}

function renderAchievementsPage() {
  const stats = getGameStats();
  const unlockedAchievements = getUnlockedAchievements();
  const lockedAchievements = ACHIEVEMENTS.filter((achievement) => !unlockedAchievements.some((item) => item.id === achievement.id));

  parentGamePanel.innerHTML = `
    <section class="quest-shell">
      <div class="quest-header">
        <div>
          <h3>Effort drives the adventure</h3>
          <p class="status-copy">Celebrate consistency, not pressure. Every logged parent effort moves the story forward.</p>
        </div>
        <span class="level-chip">${escapeHtml(stats.levelTitle)}</span>
      </div>
      <div class="quest-stats">
        <div class="stat-card"><strong>${stats.points}</strong><span>parent XP</span></div>
        <div class="stat-card"><strong>${state.game.streakDays}</strong><span>streak day(s)</span></div>
        <div class="stat-card"><strong>${state.game.totalLogs}</strong><span>total effort logs</span></div>
      </div>
      <div class="achievement-columns">
        <section class="achievement-panel">
          <h4>Unlocked achievements</h4>
          <div class="achievement-grid">
            ${unlockedAchievements.length
              ? unlockedAchievements.map((achievement) => renderAchievementCard(achievement, true)).join("")
              : renderAchievementEmptyState("No achievements yet — log parent effort to unlock your first celebration.")}
          </div>
        </section>
        <section class="achievement-panel">
          <h4>Still to unlock</h4>
          <div class="achievement-grid">
            ${lockedAchievements.length
              ? lockedAchievements.map((achievement) => renderAchievementCard(achievement, false)).join("")
              : renderAchievementEmptyState("Everything is unlocked. Amazing work!")}
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderAchievementCard(achievement, unlocked) {
  return `
    <article class="achievement-card ${unlocked ? "is-unlocked" : "is-locked"}">
      <div class="achievement-icon" aria-hidden="true">${achievement.emoji}</div>
      <div>
        <strong>${escapeHtml(achievement.name)}</strong>
        <p>${escapeHtml(achievement.description)}</p>
      </div>
    </article>
  `;
}

function renderAchievementEmptyState(message) {
  return `<p class="list-muted">${escapeHtml(message)}</p>`;
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
          <li><strong>Parent level:</strong> ${escapeHtml(levelTitle)} (${points} XP)</li>
        </ul>
      </article>
      <div class="report-grid">
      ${state.kids.map((child) => {
        const acceptedFoodsMarkup = MEALS.map((meal) => {
          const foods = child.acceptedFoods[meal] || [];
          const acceptedText = foods.length
            ? foods.map((food) => escapeHtml(food.name)).join(", ")
            : "None listed";
          return `<li><strong>Accepted ${capitalize(meal)}:</strong> ${acceptedText}</li>`;
        }).join("");
        const chainsMarkup = MEALS.map((meal) => {
          const chains = child.chains[meal] || [];
          const chainItems = chains.length
            ? chains.map((chain, idx) => {
              const key = `${child.id}:${meal}:${idx}`;
              const progress = child.outcomes[key] || chain.steps.map(() => -1);
              return `<li><strong>${escapeHtml(chain.baseFood.name)}:</strong> ${chain.steps.map(escapeHtml).join(" → ")}<div class="report-detail">Stages: ${progress.map((value) => escapeHtml(value >= 0 ? STAGES[value] : "not started")).join(" | ")}</div></li>`;
            }).join("")
            : "<li><strong>No chains yet.</strong></li>";
          return `
          <h4>${capitalize(meal)}</h4>
          <ul class="report-list">
              ${chainItems}
            </ul>
          `;
        }).join("");

        return `<article class="report-card"><h3>${escapeHtml(child.name)}</h3><ul class="report-list"><li><strong>Date of birth:</strong> ${escapeHtml(formatDateForDisplay(child.dob) || "Not set")}</li><li><strong>Current age:</strong> ${escapeHtml(String(getChildAge(child)))} years old</li>${acceptedFoodsMarkup}</ul>${chainsMarkup}</article>`;
      }).join("")}
      </div>
      <article class="report-card">
        <h4>Parent Rewards</h4>
        <ul class="report-list">
          <li><strong>Total logs:</strong> ${state.game.totalLogs}</li>
          <li><strong>Streak:</strong> ${state.game.streakDays} day(s)</li>
          <li><strong>Achievements:</strong> ${getUnlockedAchievements().length}</li>
        </ul>
      </article>
    </div>
  `;
}

function renderHeroStatus() {
  if (!heroStatus) return;
  heroStatus.innerHTML = `
    <div class="stat-card"><strong>${state.kids.length}</strong><span>kids tracked</span></div>
    <div class="stat-card"><strong>${calculateTotalChains()}</strong><span>food chains</span></div>
    <div class="stat-card"><strong>${state.game.totalLogs}</strong><span>parent effort logs</span></div>
  `;
}

function renderQuickStats() {
  if (!quickStats) return;
  quickStats.innerHTML = `
    <div class="stat-card"><strong>${countAcceptedFoods()}</strong><span>accepted foods</span></div>
    <div class="stat-card"><strong>${state.game.totalLogs}</strong><span>parent efforts logged</span></div>
    <div class="stat-card"><strong>${getUnlockedAchievements().length}</strong><span>parent achievements</span></div>
  `;
}

function renderPageView() {
  const isAchievementsPage = currentPage === "achievements";
  plannerPage.hidden = isAchievementsPage;
  achievementsPage.hidden = !isAchievementsPage;
  pageTabs.forEach((button) => {
    const isActive = button.dataset.page === currentPage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setCurrentPage(page, options = {}) {
  const { syncHash = true } = options;
  currentPage = page === "achievements" ? "achievements" : "planner";
  if (syncHash) {
    const nextHash = currentPage === "achievements" ? "#achievements" : "#planner";
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
      return;
    }
  }
  renderPageView();
}

function getUnlockedAchievements(game = state.game) {
  return ACHIEVEMENTS.filter((achievement) => achievement.qualifies(game));
}

function getRewardSnapshot(game = state.game) {
  const stats = getGameStats(game);
  return {
    ...stats,
    unlockedAchievementIds: getUnlockedAchievements(game).map((achievement) => achievement.id)
  };
}

function getGameStats(game = state.game) {
  const points = game.totalLogs * 10 + Math.min(game.streakDays, 30) * 2;
  const levelIndex = Math.min(LEVELS.length - 1, Math.floor(points / 120));
  const levelTitle = LEVELS[levelIndex];
  const nextLevelTitle = LEVELS[levelIndex + 1] || "";
  const currentLevelStart = levelIndex * 120;
  const nextLevelStart = Math.min((levelIndex + 1) * 120, LEVELS.length * 120);
  const pointsForNextLevel = nextLevelTitle ? nextLevelStart - currentLevelStart : 0;
  const levelProgressPoints = nextLevelTitle ? points - currentLevelStart : points;
  const pointsToNextLevel = nextLevelTitle ? nextLevelStart - points : 0;
  return { points, levelIndex, levelTitle, nextLevelTitle, pointsForNextLevel, levelProgressPoints, pointsToNextLevel };
}

function triggerCelebrations(celebrations) {
  if (!celebrations.length || !celebrationLayer) return;
  celebrationLayer.innerHTML = "";
  celebrationLayer.classList.add("is-active");
  celebrationLayer.classList.remove("is-visible");
  celebrationTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
  celebrationTimeouts = [];

  celebrations.forEach((celebration, index) => {
    const timeoutId = window.setTimeout(() => {
      celebrationLayer.classList.remove("is-visible");
      celebrationLayer.innerHTML = renderCelebrationMarkup(celebration);
      void celebrationLayer.offsetWidth;
      celebrationLayer.classList.add("is-visible");
    }, index * 2300);
    celebrationTimeouts.push(timeoutId);
  });

  const hideTimeout = window.setTimeout(() => {
    celebrationLayer.classList.remove("is-visible");
    celebrationLayer.classList.remove("is-active");
    celebrationLayer.innerHTML = "";
  }, celebrations.length * 2300 + 2200);
  celebrationTimeouts.push(hideTimeout);
}

function renderCelebrationMarkup(celebration) {
  const confetti = Array.from({ length: 18 }, (_, index) => `<span class="confetti-piece confetti-${(index % 6) + 1}"></span>`).join("");
  return `
    <div class="celebration-confetti" aria-hidden="true">${confetti}</div>
    <div class="celebration-card">
      <div class="celebration-emoji" aria-hidden="true">${celebration.emoji}</div>
      <strong>${escapeHtml(celebration.title)}</strong>
      <p>${escapeHtml(celebration.message)}</p>
    </div>
  `;
}

function calculateTotalChains() {
  return state.kids.reduce((total, child) => total + Object.values(child.chains).reduce((mealTotal, chains) => mealTotal + chains.length, 0), 0);
}

function countAcceptedFoods() {
  return state.kids.reduce((total, child) => total + Object.values(child.acceptedFoods).reduce((mealTotal, foods) => mealTotal + foods.length, 0), 0);
}

function getChildAge(child) {
  if (isValidDob(child.dob)) {
    const today = new Date();
    const dob = new Date(`${child.dob}T00:00:00`);
    let age = today.getFullYear() - dob.getFullYear();
    const hasHadBirthday = today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hasHadBirthday) age -= 1;
    return Math.max(age, 0);
  }

  return Math.max(Number(child.age) || 0, 0);
}

function getChildAgeSummary(child) {
  const age = getChildAge(child);
  if (isValidDob(child.dob)) {
    return `${formatDateForDisplay(child.dob)} · ${age} year${age === 1 ? "" : "s"} old`;
  }
  return `${age} year${age === 1 ? "" : "s"} old`;
}

function isValidDob(dob) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(dob)) return false;
  const [yearText, monthText, dayText] = dob.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return false;
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return false;
  return dob <= getTodayIsoDate();
}

function getTodayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(value) {
  if (!isValidDob(value)) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function renderEmptyState(title, description) {
  return `<div class="empty-state"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div>`;
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
setCurrentPage(currentPage, { syncHash: false });
