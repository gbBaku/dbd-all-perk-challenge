/* ========================================================
app.js
======================================================== */

const perkGrid = document.getElementById("perk-grid");
const selectedPerksContainer = document.getElementById("selected-perks");
const progressText = document.getElementById("progress-text");

const randomBuildBtn = document.getElementById("random-build-btn");
const escapeBtn = document.getElementById("escape-btn");
const deathBtn = document.getElementById("death-btn");
const undoBtn = document.getElementById("undo-btn");

const toggleRulesBtn = document.getElementById("toggle-rules-btn");
const rulesContent = document.getElementById("rules-content");

let selectedItem = "none";

let selectedPerks = [];
let clearedPerks = [];
let matchHistory = [];

loadState();
renderAll();

/* ========================================================
RENDER
======================================================== */

function renderAll() {
  renderPerkGrid();
  renderSelectedPerks();
  renderProgress();
  renderMatchHistory();
  renderSelectedItem();
}

function renderPerkGrid() {

  perkGrid.innerHTML = "";

  PERKS.forEach(perk => {

    const card = document.createElement("div");
    card.classList.add("perk-card");

    if (clearedPerks.includes(perk.id)) {
      card.classList.add("cleared");
    }

    if (selectedPerks.includes(perk.id)) {
      card.classList.add("selected");
    }

    card.innerHTML = `
      <img src="${perk.image}" alt="${perk.name}">
      <div>${perk.name}</div>
    `;

    card.addEventListener("click", () => {
      togglePerkSelection(perk.id);
    });

    perkGrid.appendChild(card);
  });
}

function renderSelectedPerks() {

  selectedPerksContainer.innerHTML = "";

  selectedPerks.forEach(id => {

    const perk = PERKS.find(p => p.id === id);

    const div = document.createElement("div");

    div.innerHTML = `
      <img src="${perk.image}" width="64">
      <div>${perk.name}</div>
    `;

    selectedPerksContainer.appendChild(div);
  });
}

function renderProgress() {
  const total = PERKS.length;
  const cleared = clearedPerks.length;
  const percent = total === 0 ? 0 : ((cleared / total) * 100).toFixed(1);

  progressText.textContent =
    `${cleared} / ${total} Cleared (${percent}%)`;
}

/* ========================================================
SELECTION
======================================================== */

function togglePerkSelection(id) {

  if (clearedPerks.includes(id)) return;

  if (selectedPerks.includes(id)) {
    selectedPerks = selectedPerks.filter(p => p !== id);
  }
  else {

    if (selectedPerks.length >= 4) return;

    selectedPerks.push(id);
  }

  renderAll();
}

/* ========================================================
RULE TOGGLE
======================================================== */

toggleRulesBtn.addEventListener("click", () => {

  const hidden = rulesContent.style.display === "none";

  rulesContent.style.display = hidden ? "block" : "none";

  toggleRulesBtn.textContent =
    hidden ? "▼ Rules" : "► Rules";
});

/* ========================================================
SAVE / LOAD
======================================================== */

function saveState() {
  const saveData = {
    clearedPerks,
    matchHistory,
    selectedItem
  };

  localStorage.setItem(
    "dbd-all-perk-save",
    JSON.stringify(saveData)
  );
}

function loadState() {
  const raw = localStorage.getItem("dbd-all-perk-save");

  if (!raw) return;

  const data = JSON.parse(raw);

  clearedPerks = data.clearedPerks || [];
  matchHistory = data.matchHistory || [];
  selectedItem = data.selectedItem || "none";
}
escapeBtn.addEventListener("click", handleEscape);
deathBtn.addEventListener("click", handleDeath);
undoBtn.addEventListener("click", undoLastMatch);
randomBuildBtn.addEventListener("click", generateRandomBuild);

function handleEscape() {
  if (selectedPerks.length !== 4) {
    alert("Select exactly 4 perks first.");
    return;
  }

  if (!selectedItem) {
    alert("Select an item type first.");
    return;
  }

  clearedPerks = [...new Set([...clearedPerks, ...selectedPerks])];

  matchHistory.push({
    result: "Escape",
    usedPerks: [...selectedPerks],
    item: selectedItem,
    checkedPerks: [...selectedPerks],
    uncheckedPerks: []
  });

  selectedPerks = [];
  selectedItem = null;

  saveState();
  renderAll();
}

function handleDeath() {
  if (selectedPerks.length !== 4) {
    alert("Select exactly 4 perks first.");
    return;
  }

  if (!selectedItem) {
    alert("Select an item type first.");
    return;
  }

  const lostPerks = shuffleArray([...clearedPerks]).slice(0, Math.min(4, clearedPerks.length));

  clearedPerks = clearedPerks.filter(id => !lostPerks.includes(id));

  matchHistory.push({
    result: "Death",
    usedPerks: [...selectedPerks],
    item: selectedItem,
    checkedPerks: [],
    uncheckedPerks: lostPerks
  });

  selectedPerks = [];
  selectedItem = null;

  saveState();
  renderAll();
}

function undoLastMatch() {
  if (matchHistory.length === 0) return;

  matchHistory.pop();
  rebuildClearedPerksFromHistory();

  selectedPerks = [];
  selectedItem = null;

  saveState();
  renderAll();
}

function rebuildClearedPerksFromHistory() {
  clearedPerks = [];

  matchHistory.forEach(match => {
    if (match.result === "Escape") {
      clearedPerks = [...new Set([...clearedPerks, ...match.checkedPerks])];
    }

    if (match.result === "Death") {
      clearedPerks = clearedPerks.filter(id => !match.uncheckedPerks.includes(id));
    }
  });
}

function generateRandomBuild() {
  const unchecked = PERKS
    .filter(perk => !clearedPerks.includes(perk.id))
    .map(perk => perk.id);

  const checked = PERKS
    .filter(perk => clearedPerks.includes(perk.id))
    .map(perk => perk.id);

  const shuffledUnchecked = shuffleArray(unchecked);
  const shuffledChecked = shuffleArray(checked);

  selectedPerks = [
    ...shuffledUnchecked.slice(0, 4),
    ...shuffledChecked.slice(0, Math.max(0, 4 - unchecked.length))
  ];

  renderAll();
}

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(item => item.value);
}

function renderMatchHistory() {
  const historyContainer = document.getElementById("match-history");
  historyContainer.innerHTML = "";

  matchHistory.slice().reverse().forEach((match, index) => {
    const div = document.createElement("div");
    const itemName = match.item || "none";

    const usedNames = match.usedPerks
      .map(id => PERKS.find(p => p.id === id)?.name || id)
      .join(", ");

    const lostNames = match.uncheckedPerks
      .map(id => PERKS.find(p => p.id === id)?.name || id)
      .join(", ");

    div.innerHTML = `
      <strong>${match.result}</strong><br>
      Item: ${itemName}<br>
      Used: ${usedNames}
      ${match.result === "Death" ? `<br>Lost: ${lostNames || "None"}` : ""}
      <hr>
    `;

    historyContainer.appendChild(div);
  });
}


function renderSelectedItem() {
  document.querySelectorAll(".item-button").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.item === selectedItem
    );
  });
}

function renderSelectedItem() {
  document.querySelectorAll(".item-button").forEach(button => {
    button.classList.toggle("selected", button.dataset.item === selectedItem);
  });
}

document.querySelectorAll(".item-button").forEach(button => {
  button.addEventListener("click", () => {
    const item = button.dataset.item;

    if (isItemLocked(item)) return;

    selectedItem = item;
    renderSelectedItem();
    saveState();
  });
});

function isItemLocked(item) {
  if (item === "none") return false;

  const recentItems = matchHistory
    .slice(-5)
    .map(match => match.item)
    .filter(item => item && item !== "none");

  return recentItems.includes(item);
}

function renderSelectedItem() {
  document.querySelectorAll(".item-button").forEach(button => {
    const item = button.dataset.item;

    button.classList.toggle("selected", item === selectedItem);
    button.classList.toggle("locked-item", isItemLocked(item));
  });
}