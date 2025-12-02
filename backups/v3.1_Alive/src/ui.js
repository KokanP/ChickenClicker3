// src/ui.js
import { CONFIG, achievements, achievementConditions } from './config.js';
import { calculateCost, formatNumber } from './utils.js';
import { getEggsPerSecond, getEggsPerClick, getPrestigeCost } from './logic.js';

export const elements = {
    nicknameInput: document.getElementById('nickname-input'),
    chicken: document.getElementById('chicken-container'),
    eggCounter: document.getElementById('egg-counter'),
    featherCounter: document.getElementById('feather-counter'),
    epsCounter: document.getElementById('eggs-per-second'),
    epcCounter: document.getElementById('eggs-per-click'),
    achievementsList: document.getElementById('achievements-list'),
    goldenChicken: document.getElementById('golden-chicken'),
    toast: document.getElementById('achievement-toast'),
    toastTitle: document.getElementById('toast-title'),
    toastDescription: document.getElementById('toast-description'),
    prestigeButton: document.getElementById('prestige-button'),
    reputationPointsEl: document.getElementById('reputation-points'),
    resetButton: document.getElementById('reset-button'),
    licenseSummary: document.getElementById('license-summary'),
    eventBanner: document.getElementById('event-banner'),
    nameModal: document.getElementById('name-modal'),
    initialNicknameInput: document.getElementById('initial-nickname-input'),
    startGameBtn: document.getElementById('start-game-btn'),
    playerNameDisplay: document.getElementById('player-name-display'),
    upgradesListContainer: document.getElementById('upgrades-list'),
    coopListContainer: document.getElementById('coop-list'),
    coloredEggContainer: document.getElementById('colored-egg-container'),
    versionNumberEl: document.getElementById('version-number'),
    exportSaveClipboardBtn: document.getElementById('export-save-clipboard'),
    exportSaveFileBtn: document.getElementById('export-save-file'),
    importSaveText: document.getElementById('import-save-text'),
    importSaveTextBtn: document.getElementById('import-save-text-btn'),
    importSaveFileBtn: document.getElementById('import-save-file-btn'),
    importFileInput: document.getElementById('import-file-input'),
    coopAsset: document.getElementById('coop-asset'),
    incubatorAsset: document.getElementById('incubator-asset'),
    silkieAsset: document.getElementById('silkie-asset'),
    fenceAsset: document.getElementById('fence-asset'),
    flagpoleAsset: document.getElementById('flagpole-asset'),
    eagleAsset: document.getElementById('eagle-asset'),
    groundCritterAsset: document.getElementById('ground-critter-asset'),
    umbrellaAsset: document.getElementById('umbrella-asset'),
    rainOverlay: document.getElementById('rain-overlay'),
};

export function buildUpgradeShop(gameState, buyUpgradeCallback) {
    elements.upgradesListContainer.innerHTML = '';
    for (const id in CONFIG.UPGRADES) {
        const upgrade = CONFIG.UPGRADES[id];
        const el = document.createElement('div');
        el.className = `shop-item`;
        el.innerHTML = `
            <div>
                <h4>${upgrade.name}</h4>
                <p>${upgrade.desc}</p>
                <p>Lvl: <span id="${id}-level">0</span></p>
            </div>
            <button id="buy-${id}" class="funky-button">Buy: <span id="${id}-cost">10</span></button>
        `;
        elements.upgradesListContainer.appendChild(el);
        document.getElementById(`buy-${id}`).addEventListener('click', () => buyUpgradeCallback(id));
    }
}

export function buildCoop(gameState, buyChickenCallback) {
    elements.coopListContainer.innerHTML = '';
    for (const id in CONFIG.CHICKENS) {
        const chicken = CONFIG.CHICKENS[id];
        const el = document.createElement('div');
        el.className = `shop-item`;
        let buttonHtml = `<button id="buy-${id}" class="funky-button">Buy: <span id="${id}-cost">1000</span></button>`;
        
        el.innerHTML = `
            <div>
                <h4>${chicken.name}</h4>
                <p>${chicken.desc}</p>
                <p>Owned: <span id="${id}-chickens">0</span></p>
            </div>
            ${buttonHtml}
        `;
        elements.coopListContainer.appendChild(el);
        document.getElementById(`buy-${id}`).addEventListener('click', () => buyChickenCallback(id));
    }
}

const uiCache = new Map();

function setText(element, value) {
    if (!element) return;
    const strValue = String(value);
    if (uiCache.get(element) !== strValue) {
        element.textContent = strValue;
        uiCache.set(element, strValue);
    }
}

export function updateUI(gameState) {
    // HUD Stats
    setText(elements.eggCounter, formatNumber(gameState.eggs));
    setText(elements.featherCounter, formatNumber(gameState.feathers));
    setText(elements.reputationPointsEl, formatNumber(gameState.reputation));
    setText(elements.epsCounter, `EPS: ${formatNumber(getEggsPerSecond(gameState))}`);
    setText(elements.epcCounter, `EPC: ${formatNumber(getEggsPerClick(gameState))}`);

    // Update Shop Costs & Levels
    for (const id in CONFIG.UPGRADES) {
        const upgrade = CONFIG.UPGRADES[id];
        const levelEl = document.getElementById(`${id}-level`);
        const costEl = document.getElementById(`${id}-cost`);
        const buttonEl = document.getElementById(`buy-${id}`);
        if (!levelEl || !costEl || !buttonEl) continue;

        setText(levelEl, formatNumber(gameState.upgrades[id]));
        const cost = calculateCost(upgrade.baseCost, gameState.upgrades[id], upgrade.exponent, gameState);
        setText(costEl, formatNumber(cost));
        buttonEl.disabled = gameState[upgrade.currency] < cost;
    }

    for (const id in CONFIG.CHICKENS) {
        const chicken = CONFIG.CHICKENS[id];
        const ownedEl = document.getElementById(`${id}-chickens`);
        const costEl = document.getElementById(`${id}-cost`);
        const buttonEl = document.getElementById(`buy-${id}`);
        if (!ownedEl || !costEl || !buttonEl) continue;

        setText(ownedEl, formatNumber(gameState.chickens[id]));
        const cost = calculateCost(chicken.baseCost, gameState.chickens[id], chicken.exponent, gameState);
        setText(costEl, formatNumber(cost));
        buttonEl.disabled = gameState.eggs < cost;
    }
    
    // Prestige Button
    const requiredPrestigeCost = getPrestigeCost(gameState);
    const prestigeCostTextEl = document.getElementById('prestige-cost-text');
    if (prestigeCostTextEl) {
         setText(prestigeCostTextEl, `Cost: ${formatNumber(requiredPrestigeCost)} Eggs`);
    }
    elements.prestigeButton.disabled = gameState.eggs < requiredPrestigeCost;

    // Ancestral Blueprints
    const blueprintsLevelEl = document.getElementById('ancestralBlueprints-level');
    const blueprintsCostEl = document.getElementById('ancestralBlueprints-cost');
    const buyBlueprintsBtn = document.getElementById('buy-ancestralBlueprints');
    if (blueprintsLevelEl) {
        const level = gameState.prestigeUpgrades.ancestralBlueprints;
        const cost = 10 * Math.pow(2, level);
        setText(blueprintsLevelEl, level);
        setText(blueprintsCostEl, formatNumber(cost));
        buyBlueprintsBtn.disabled = gameState.reputation < cost;
    }

    // --- Scene Visuals (The Diorama) ---
    if (elements.coopAsset) elements.coopAsset.style.display = gameState.upgrades.worker > 0 ? 'block' : 'none';
    if (elements.incubatorAsset) elements.incubatorAsset.style.display = gameState.upgrades.incubator > 0 ? 'block' : 'none';
    if (elements.silkieAsset) elements.silkieAsset.style.display = gameState.chickens.silkie > 0 ? 'block' : 'none';
    if (elements.fenceAsset) elements.fenceAsset.style.display = gameState.totalEggs >= 1000000 ? 'block' : 'none';
    if (elements.flagpoleAsset) elements.flagpoleAsset.style.display = gameState.prestigeCount > 0 ? 'block' : 'none';
}

export function renderAchievements(gameState) {
    elements.achievementsList.innerHTML = '';
    Object.keys(achievements).forEach(id => {
        const ach = achievements[id];
        const isUnlocked = gameState.unlockedAchievements.includes(id);
        if (ach.hidden && !isUnlocked) return;

        const el = document.createElement('div');
        el.dataset.id = id;
        el.className = `achievement-item p-2 rounded-lg transition-all duration-300 font-semibold ${isUnlocked ? 'bg-yellow-300 text-yellow-800' : 'bg-gray-200 text-gray-500'}`;

        let progressHtml = '';
        if (!isUnlocked) {
            const condition = achievementConditions[id];
            const conditionStr = condition.toString();
            const match = conditionStr.match(/gs\.(totalClicks|totalEggs|upgrades\.(\w+)|chickens\.(\w+)|goldenChickensClicked)\s*>=\s*([\d.e+]+)/);
            if (match) {
                const key = match[1];
                const target = parseFloat(match[4]);
                let current = 0;
                if (key.startsWith('upgrades.')) {
                    current = gameState.upgrades[match[2]] || 0;
                } else if (key.startsWith('chickens.')) {
                    current = gameState.chickens[match[3]] || 0;
                } else {
                    current = gameState[key] || 0;
                }
                const progress = Math.min(current / target, 1);
                if (progress > 0) {
                    progressHtml = `
                        <div class="achievement-progress-bar">
                            <div class="achievement-progress" style="width: ${progress * 100}%"></div>
                        </div>
                        <p class="achievement-progress-text text-xs text-gray-600 text-right mt-1">${formatNumber(current)} / ${formatNumber(target)}</p>
                    `;
                }
            }
        }

        el.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <strong>${ach.name}</strong>
                    <p class="text-sm font-normal">${ach.description}</p>
                </div>
                ${isUnlocked ? `<span id="share-${id}" class="cursor-pointer hover:scale-110 transition-transform"><svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-3V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zM9 6h6v2H9V6zm11 12H4v-8h16v8zm-9-4h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg></span>` : ''}
            </div>
            ${progressHtml}
        `;

        elements.achievementsList.appendChild(el);

        if (isUnlocked) {
            const shareIcon = el.querySelector(`#share-${id}`);
            if (shareIcon) {
                shareIcon.title = "Share Achievement";
                shareIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    generateAchievementScreenshot(id, gameState);
                });
            }
        }
    });
}

export function updateAchievementProgress(gs) {
    const achievementItems = document.querySelectorAll('.achievement-item');
    achievementItems.forEach(el => {
        const id = el.dataset.id;
        if (!id || gs.unlockedAchievements.includes(id)) return;

        const bar = el.querySelector('.achievement-progress');
        const text = el.querySelector('.achievement-progress-text');
        
        if (bar && text && achievementConditions[id]) {
            const conditionStr = achievementConditions[id].toString();
            const match = conditionStr.match(/gs\.(totalClicks|totalEggs|upgrades\.(\w+)|chickens\.(\w+)|goldenChickensClicked)\s*>=\s*([\d.e+]+)/);
            
            if (match) {
                const key = match[1];
                const target = parseFloat(match[4]);
                let current = 0;
                
                if (key.startsWith('upgrades.')) {
                    current = gs.upgrades[match[2]] || 0;
                } else if (key.startsWith('chickens.')) {
                    current = gs.chickens[match[3]] || 0;
                } else {
                    current = gs[key] || 0;
                }
                
                const progress = Math.min(current / target, 1);
                bar.style.width = `${progress * 100}%`;
                text.textContent = `${formatNumber(current)} / ${formatNumber(target)}`;
            }
        }
    });
}

export function showToast(title, description) {
    elements.toastTitle.textContent = title;
    elements.toastDescription.textContent = description;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 4000);
}

export function showFloatingText(text, event, isSuper = false) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    if (isSuper) {
        el.classList.add('super-click-text');
    }
    el.textContent = text;
    const scene = document.getElementById('game-scene');
    if (!scene) return;
    scene.appendChild(el);
    
    const containerRect = scene.getBoundingClientRect();
    // Position relative to the scene
    el.style.left = `${event.clientX - containerRect.left}px`;
    el.style.top = `${event.clientY - containerRect.top}px`;
    
    setTimeout(() => {
        if (el.parentElement) {
            el.parentElement.removeChild(el);
        }
    }, 1450);
}

function generateAchievementScreenshot(id, gameState) {
    if (!id || !achievements[id]) return;
    const ach = achievements[id];
    const nickname = gameState.nickname || "A Farmer";
    const timestamp = new Date().toLocaleString();
    document.getElementById('screenshot-nickname').textContent = nickname;
    document.getElementById('screenshot-ach-name').textContent = `"${ach.name}"`;
    document.getElementById('screenshot-ach-desc').textContent = ach.description;
    document.getElementById('screenshot-date').textContent = `Unlocked on ${timestamp}`;
    const template = document.getElementById('achievement-screenshot-template');
    html2canvas(template, { useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `chicken-clicker-achievement-${id}.png`;
        link.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        link.click();
    });
};
