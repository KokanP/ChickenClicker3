// src/ui.js
import { CONFIG, achievements, achievementConditions } from './config.js';
import { calculateCost, formatNumber } from './utils.js';
import { getEggsPerSecond, getEggsPerClick, getPrestigeCost, getMoonDarkMatterPerSecond, getMoonDarkMatterPerClick } from './logic.js';

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
    launchpadAsset: document.getElementById('launchpad-asset'),
    rocketAsset: document.getElementById('rocket-asset'),
    eagleAsset: document.getElementById('eagle-asset'),
    groundCritterAsset: document.getElementById('ground-critter-asset'),
    umbrellaAsset: document.getElementById('umbrella-asset'),
    brahmaAsset: document.getElementById('brahma-asset'),
    dojaAsset: document.getElementById('doja-asset'),
    roosterAsset: document.getElementById('rooster-asset'),
    weathervaneAsset: document.getElementById('weathervane-group'),
    oracleAsset: document.getElementById('oracle-asset'),
    loomAsset: document.getElementById('loom-asset'),
    piggybankAsset: document.getElementById('piggybank-asset'),
    cluckworkAsset: document.getElementById('cluckwork-asset'),
    helpIcon: document.getElementById('help-icon'),
    rainOverlay: document.getElementById('rain-overlay'),
    museumList: document.getElementById('museum-list'),
    geneticLabList: document.getElementById('genetic-lab-list'),
    chickenSVG: document.getElementById('chicken'),
    sceneSwitcherBtn: document.getElementById('scene-switcher-btn'),
    earthScene: document.getElementById('earth-scene'),
    moonScene: document.getElementById('moon-scene'),
    lunarCoopListContainer: document.getElementById('lunar-coop-list'),
    lunarUpgradesListContainer: document.getElementById('lunar-upgrades-list'),
    moonEggCounter: document.getElementById('moon-egg-counter'),
    darkMatterCounter: document.getElementById('dark-matter-counter'),
    moonEpsCounter: document.getElementById('moon-eps-counter'),
    moonEpcCounter: document.getElementById('moon-epc-counter'),
    // New elements
    shovelAsset: document.getElementById('shovel-asset'),
    diggingContainer: document.getElementById('digging-container'),
    confettiContainer: document.getElementById('confetti-container'),
};

/**
 * Renders the Genetic Lab modal with available skins.
 * @param {object} gameState - The current game state.
 * @param {function} equipSkinCallback - Callback function to equip a skin.
 */
export function renderGeneticLab(gameState, equipSkinCallback) {
    elements.geneticLabList.innerHTML = '';
    for (const id in CONFIG.SKINS) {
        const skin = CONFIG.SKINS[id];
        const isUnlocked = gameState.unlockedSkins.includes(id);
        const isActive = gameState.skin === id;

        const el = document.createElement('div');
        el.className = `shop-item`;
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.textAlign = 'center';
        el.style.opacity = isUnlocked ? '1' : '0.5';
        el.style.filter = isUnlocked ? 'none' : 'grayscale(100%)';
        el.style.border = isActive ? '2px solid gold' : '';

        el.innerHTML = `
            <svg viewBox="0 0 100 100" style="width: 60px; height: 60px;">${skin.svg}</svg>
            <h4 style="font-size: 1.2rem; margin-top: 5px;">${isUnlocked ? skin.name : '???' + skin.name.substring(1)}</h4>
            <p style="font-size: 0.9rem; color: #555;">${isUnlocked ? skin.desc : 'Unlock to reveal'}</p>
            <button id="equip-${id}" class="funky-button" ${!isUnlocked || isActive ? 'disabled' : ''}>${isActive ? 'Equipped' : 'Equip'}</button>
        `;
        elements.geneticLabList.appendChild(el);

        if (isUnlocked && !isActive) {
            document.getElementById(`equip-${id}`).addEventListener('click', () => equipSkinCallback(id));
        }
    }
}

/**
 * Updates the SVG content of the main chicken based on the selected skin.
 * @param {string} skinId - The ID of the skin to apply.
 */
export function updateChickenSkin(skinId) {
    const skin = CONFIG.SKINS[skinId];
    if (elements.chickenSVG && skin) {
        elements.chickenSVG.innerHTML = skin.svg;
    }
}

/**
 * Builds the Earth-side upgrade shop.
 * @param {object} gameState - The current game state.
 * @param {function} buyUpgradeCallback - Callback for buying upgrades.
 */
export function buildUpgradeShop(gameState, buyUpgradeCallback) {
    elements.upgradesListContainer.innerHTML = '';
    for (const id in CONFIG.UPGRADES) {
        const upgrade = CONFIG.UPGRADES[id];
        
        // Skip if one-time upgrade is maxed
        if (upgrade.oneTime && gameState.upgrades[id] >= 1) continue;

        let description = upgrade.desc;
        
        // Censor Space Program description until bought
        if (id === 'spaceProgram' && gameState.upgrades[id] === 0) {
            description = "???";
        }

        const el = document.createElement('div');
        el.className = `shop-item`;
        el.innerHTML = `
            <div>
                <h4>${upgrade.name}</h4>
                <p>${description}</p>
                <p>Lvl: <span id="${id}-level">0</span></p>
            </div>
            <button id="buy-${id}" class="funky-button">Buy: <span id="${id}-cost">10</span></button>
        `;
        elements.upgradesListContainer.appendChild(el);
        document.getElementById(`buy-${id}`).addEventListener('click', () => buyUpgradeCallback(id));
    }
}

/**
 * Builds the Earth-side chicken coop.
 * @param {object} gameState - The current game state.
 * @param {function} buyChickenCallback - Callback for buying chickens.
 */
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

/**
 * Builds the Lunar-side upgrade shop.
 * @param {object} gameState - The current game state.
 * @param {function} buyLunarUpgradeCallback - Callback for buying lunar upgrades.
 */
export function buildLunarUpgradeShop(gameState, buyLunarUpgradeCallback) {
    elements.lunarUpgradesListContainer.innerHTML = '';
    for (const id in CONFIG.LUNAR_UPGRADES) {
        const upgrade = CONFIG.LUNAR_UPGRADES[id];
        const el = document.createElement('div');
        el.className = `shop-item`;
        el.innerHTML = `
            <div>
                <h4>${upgrade.name}</h4>
                <p>${upgrade.desc}</p>
                <p>Lvl: <span id="lunar-${id}-level">0</span></p>
            </div>
            <button id="buy-lunar-${id}" class="funky-button">Buy: <span id="lunar-${id}-cost">10</span></button>
        `;
        elements.lunarUpgradesListContainer.appendChild(el);
        document.getElementById(`buy-lunar-${id}`).addEventListener('click', () => buyLunarUpgradeCallback(id));
    }
}

/**
 * Builds the Lunar-side chicken coop.
 * @param {object} gameState - The current game state.
 * @param {function} buyLunarChickenCallback - Callback for buying lunar chickens.
 */
export function buildLunarCoop(gameState, buyLunarChickenCallback) {
    elements.lunarCoopListContainer.innerHTML = '';
    for (const id in CONFIG.LUNAR_CHICKENS) {
        const chicken = CONFIG.LUNAR_CHICKENS[id];
        const el = document.createElement('div');
        el.className = `shop-item`;
        let buttonHtml = `<button id="buy-lunar-${id}" class="funky-button">Buy: <span id="lunar-${id}-cost">1000</span></button>`;
        
        el.innerHTML = `
            <div>
                <h4>${chicken.name}</h4>
                <p>${chicken.desc}</p>
                <p>Owned: <span id="lunar-${id}-chickens">0</span></p>
            </div>
            ${buttonHtml}
        `;
        elements.lunarCoopListContainer.appendChild(el);
        document.getElementById(`buy-lunar-${id}`).addEventListener('click', () => buyLunarChickenCallback(id));
    }
}


const uiCache = new Map();

/**
 * Helper function to set textContent of an element only if it has changed,
 * preventing unnecessary DOM updates.
 * @param {HTMLElement} element - The DOM element to update.
 * @param {string|number} value - The new text content.
 */
function setText(element, value) {
    if (!element) return;
    const strValue = String(value);
    if (uiCache.get(element) !== strValue) {
        element.textContent = strValue;
        uiCache.set(element, strValue);
    }
}

/**
 * Renders the Museum modal with artifacts, showing unlocked ones and placeholders for locked ones.
 * @param {object} gameState - The current game state.
 */
export function renderMuseum(gameState) {
    elements.museumList.innerHTML = '';
    for (const id in CONFIG.ARTIFACTS) {
        const art = CONFIG.ARTIFACTS[id];
        const isUnlocked = gameState.artifacts.includes(id);
        
        const el = document.createElement('div');
        el.className = `shop-item`;
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.textAlign = 'center';
        el.style.opacity = isUnlocked ? '1' : '0.5';
        el.style.filter = isUnlocked ? 'none' : 'grayscale(100%)';
        
        // Use SVG if available, otherwise fallback to emoji
        const icon = art.svg ? `<svg viewBox="0 0 100 100" style="width: 50px; height: 50px;">${art.svg}</svg>` : '🏺';

        el.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 5px;">${icon}</div>
            <h4 style="font-size: 1.2rem;">${isUnlocked ? art.name : '???'}</h4>
            <p style="font-size: 0.9rem; color: #555;">${isUnlocked ? art.desc : 'Undiscovered'}</p>
            <p style="font-size: 0.8rem; font-weight: bold; color: #c0392b;">${isUnlocked ? art.bonusDesc : ''}</p>
        `;
        elements.museumList.appendChild(el);
    }
}

/**
 * Updates the UI display based on the current game state.
 * This is an optimized function that only updates DOM elements if their value has changed.
 * @param {object} gameState - The current game state.
 */
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
        
        // If element doesn't exist (e.g. one-time upgrade bought and removed from DOM), skip
        if (!levelEl || !costEl || !buttonEl) continue;

        setText(levelEl, formatNumber(gameState.upgrades[id]));
        const cost = calculateCost(upgrade.baseCost, gameState.upgrades[id], upgrade.exponent, gameState);
        setText(costEl, formatNumber(cost));
        
        // Disable if can't afford OR if it's a one-time upgrade already bought
        const isMaxed = upgrade.oneTime && gameState.upgrades[id] >= 1;
        buttonEl.disabled = gameState[upgrade.currency] < cost || isMaxed;
        
        if (isMaxed) {
            buttonEl.textContent = "Owned";
            // Optional: Remove from DOM on next refresh or handle dynamically
        }
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
    if (elements.launchpadAsset) elements.launchpadAsset.style.display = gameState.upgrades.spaceProgram > 0 ? 'block' : 'none';
    
    // New Diorama Assets
    if (elements.brahmaAsset) elements.brahmaAsset.style.display = gameState.chickens.brahma > 0 ? 'block' : 'none';
    if (elements.dojaAsset) elements.dojaAsset.style.display = gameState.chickens.doja > 0 ? 'block' : 'none';
    if (elements.roosterAsset) elements.roosterAsset.style.display = gameState.chickens.rooster > 0 ? 'block' : 'none';
    if (elements.oracleAsset) elements.oracleAsset.style.display = gameState.chickens.orpington > 0 ? 'block' : 'none';
    if (elements.weathervaneAsset) elements.weathervaneAsset.style.display = gameState.upgrades.featherForecast > 0 ? 'block' : 'none';
    if (elements.loomAsset) elements.loomAsset.style.display = gameState.upgrades.loom > 0 ? 'block' : 'none';
    if (elements.piggybankAsset) elements.piggybankAsset.style.display = gameState.upgrades.nestEggIRA > 0 ? 'block' : 'none';
    if (elements.cluckworkAsset) elements.cluckworkAsset.style.display = gameState.upgrades.cluckworkAutomation > 0 ? 'block' : 'none';

    // Unlock Moon Button
    if (elements.sceneSwitcherBtn) {
        if (gameState.upgrades.spaceProgram > 0) {
            elements.sceneSwitcherBtn.style.display = 'flex';
        } else {
            elements.sceneSwitcherBtn.style.display = 'none';
        }
    }

    // Lunar UI
    if (gameState.activeScene === 'moon') {
        setText(elements.moonEggCounter, formatNumber(gameState.moonEggs));
        setText(elements.darkMatterCounter, formatNumber(gameState.darkMatter));
        // Need getMoonDarkMatterPerSecond and getMoonDarkMatterPerClick from logic
        // setText(elements.moonEpsCounter, `DM/s: ${formatNumber(getMoonDarkMatterPerSecond(gameState))}`);
        // setText(elements.moonEpcCounter, `DM/c: ${formatNumber(getMoonDarkMatterPerClick(gameState))}`);
    }

    for (const id in CONFIG.LUNAR_UPGRADES) {
        const upgrade = CONFIG.LUNAR_UPGRADES[id];
        const levelEl = document.getElementById(`lunar-${id}-level`);
        const costEl = document.getElementById(`lunar-${id}-cost`);
        const buttonEl = document.getElementById(`buy-lunar-${id}`);
        if (!levelEl || !costEl || !buttonEl) continue;

        setText(levelEl, formatNumber(gameState.lunarUpgrades[id]));
        const cost = calculateCost(upgrade.baseCost, gameState.lunarUpgrades[id], upgrade.exponent, gameState);
        setText(costEl, formatNumber(cost));
        buttonEl.disabled = gameState[upgrade.currency] < cost;
    }

    for (const id in CONFIG.LUNAR_CHICKENS) {
        const chicken = CONFIG.LUNAR_CHICKENS[id];
        const ownedEl = document.getElementById(`lunar-${id}-chickens`);
        const costEl = document.getElementById(`lunar-${id}-cost`);
        const buttonEl = document.getElementById(`buy-lunar-${id}`);
        if (!ownedEl || !costEl || !buttonEl) continue;

        setText(ownedEl, formatNumber(gameState.lunarChickens[id]));
        const cost = calculateCost(chicken.baseCost, gameState.lunarChickens[id], chicken.exponent, gameState);
        setText(costEl, formatNumber(cost));
        buttonEl.disabled = gameState.moonEggs < cost;
    }
}

/**
 * Conditionally shows/hides UI elements based on the active scene.
 * @param {string} scene - 'earth' or 'moon'.
 */
export function updateUIScene(scene) {
    if (elements.earthScene) elements.earthScene.style.display = scene === 'earth' ? 'block' : 'none';
    if (elements.moonScene) elements.moonScene.style.display = scene === 'moon' ? 'block' : 'none';

    // Adjust visibility of HUD elements that change between scenes
    const earthHudElements = [
        elements.eggCounter.parentElement.parentElement, // eggs div
        elements.featherCounter.parentElement.parentElement, // feathers/rep div
        elements.epsCounter.parentElement, // EPS/EPC div
        elements.epcCounter.parentElement,
        document.querySelector('.nav-btn[data-modal="upgrades-screen"]'),
        document.querySelector('.nav-btn[data-modal="coop-screen"]')
    ];
    const moonHudElements = [
        elements.moonEggCounter.parentElement.parentElement, // moon eggs div
        elements.darkMatterCounter.parentElement.parentElement, // dark matter div
        elements.moonEpsCounter.parentElement, // moon DM/s, DM/c
        elements.moonEpcCounter.parentElement,
        document.querySelector('.nav-btn[data-modal="lunar-upgrades-screen"]'),
        document.querySelector('.nav-btn[data-modal="lunar-coop-screen"]')
    ];

    earthHudElements.forEach(el => { if(el) el.style.display = scene === 'earth' ? 'flex' : 'none'; });
    moonHudElements.forEach(el => { if(el) el.style.display = scene === 'moon' ? 'flex' : 'none'; });
}

export function renderAchievements(gameState) {
    elements.achievementsList.innerHTML = '';
    elements.achievementsList.className = 'achievements-grid'; // Ensure grid class is applied

    Object.keys(achievements).forEach(id => {
        const ach = achievements[id];
        const isUnlocked = gameState.unlockedAchievements.includes(id);
        
        const el = document.createElement('div');
        el.dataset.id = id;
        
        // Determine state and classes
        if (isUnlocked) {
            el.className = 'achievement-card unlocked';
            el.innerHTML = `
                <div class="share-btn" title="Share" id="share-${id}">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-3V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zM9 6h6v2H9V6zm11 12H4v-8h16v8zm-9-4h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
                </div>
                <div style="font-size: 2rem;">🏆</div>
                <h4>${ach.name}</h4>
                <p>${ach.description}</p>
                <p style="font-size: 0.8rem; color: #d35400; font-weight:bold;">Bonus: x${ach.bonus}</p>
            `;
            
            // Add event listener for share button after appending to DOM
            // We'll do this at the end of the loop logic
        } else if (ach.hidden) {
            // Hidden and locked -> Secret Placeholder
            el.className = 'achievement-card secret';
            el.innerHTML = `
                <div style="font-size: 2rem;">❓</div>
                <h4>???</h4>
                <p>Secret Achievement</p>
            `;
        } else {
            // Visible but locked
            el.className = 'achievement-card locked';
            
            // Calculate progress
            let progressHtml = '';
            const condition = achievementConditions[id];
            if (condition) {
                const conditionStr = condition.toString();
                // Attempt to parse simple conditions for progress bars
                const match = conditionStr.match(/gs\.(totalClicks|totalEggs|upgrades\.(\w+)|chickens\.(\w+)|goldenChickensClicked|prestigeCount)\s*>=\s*([\d.e+]+)/);
                
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
                            <p style="font-size: 0.7rem; margin-top: 2px;">${formatNumber(current)} / ${formatNumber(target)}</p>
                        `;
                    }
                }
            }

            el.innerHTML = `
                <div style="font-size: 2rem;">🔒</div>
                <h4>${ach.name}</h4>
                <p>${ach.description}</p>
                ${progressHtml}
            `;
        }

        elements.achievementsList.appendChild(el);

        // Attach event listener for share button if unlocked
        if (isUnlocked) {
            const shareBtn = el.querySelector(`#share-${id}`);
            if (shareBtn) {
                shareBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    generateAchievementScreenshot(id, gameState);
                });
            }
        }
    });
}

export function updateAchievementProgress(gs) {
    const lockedCards = document.querySelectorAll('.achievement-card.locked');
    lockedCards.forEach(el => {
        const id = el.dataset.id;
        if (!id) return;

        const bar = el.querySelector('.achievement-progress');
        const text = el.querySelector('p:last-child'); // Assuming the progress text is the last p element
        
        if (bar && text && achievementConditions[id]) {
            const conditionStr = achievementConditions[id].toString();
            const match = conditionStr.match(/gs\.(totalClicks|totalEggs|upgrades\.(\w+)|chickens\.(\w+)|goldenChickensClicked|prestigeCount)\s*>=\s*([\d.e+]+)/);
            
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
    
    // Fix: Append to app-wrapper instead of missing game-scene
    const container = document.getElementById('app-wrapper') || document.body;
    container.appendChild(el);
    
    const containerRect = container.getBoundingClientRect();
    
    // Position relative to the container, ensuring we handle click events vs manual coordinates
    const clientX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
    const clientY = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : 0);

    if (clientX && clientY) {
        el.style.left = `${clientX - containerRect.left}px`;
        el.style.top = `${clientY - containerRect.top}px`;
    } else {
        // Fallback for events without coordinates (like automated clicks?)
        el.style.left = '50%';
        el.style.top = '50%';
    }
    
    // Ensure high z-index to float above everything
    el.style.zIndex = '1000';
    
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

export function updateChangelogSpoilers(gs) {
    const spoilers = document.querySelectorAll('.spoiler');
    spoilers.forEach(el => {
        const type = el.dataset.unlock;
        let revealed = false;
        
        if (type === 'moon' && gs.upgrades.spaceProgram > 0) revealed = true;
        if (type === 'events' && (gs.eagleClicks > 0 || gs.foxClicks > 0 || gs.umbrellaClicks > 0)) revealed = true;
        if (type === 'artifacts' && gs.artifacts.length > 0) revealed = true;
        if (type === 'skins' && gs.unlockedSkins.length > 1) revealed = true;

        if (revealed) {
            el.classList.add('revealed');
        } else {
            el.classList.remove('revealed');
        }
    });
}

export function animateDigging(artifact) {
    if (!elements.shovelAsset || !elements.diggingContainer) return;

    // 1. Random position near bottom
    const containerRect = elements.diggingContainer.getBoundingClientRect();
    const randomX = 20 + Math.random() * 60; // 20% to 80%
    const startY = 50; // Relative % from top
    
    // Clone shovel
    const shovel = elements.shovelAsset.cloneNode(true);
    shovel.id = '';
    shovel.style.display = 'block';
    shovel.style.left = `${randomX}%`;
    shovel.style.top = '40%';
    shovel.style.transform = 'rotate(-45deg)';
    shovel.style.transition = 'all 0.5s ease-in-out';
    
    elements.diggingContainer.appendChild(shovel);

    // Animation Sequence
    // Move down (dig)
    setTimeout(() => {
        shovel.style.top = '60%';
        shovel.style.transform = 'rotate(0deg)';
    }, 100);

    // Move up (lift)
    setTimeout(() => {
        shovel.style.top = '30%';
        shovel.style.transform = 'rotate(45deg)';
        
        // Create artifact element flying out
        const artEl = document.createElement('div');
        artEl.innerHTML = `<svg viewBox="0 0 100 100" style="width: 60px; height: 60px;">${artifact.svg}</svg>`;
        artEl.style.position = 'absolute';
        artEl.style.left = `${randomX}%`;
        artEl.style.top = '60%';
        artEl.style.transition = 'all 1s ease-out';
        artEl.style.zIndex = '145';
        elements.diggingContainer.appendChild(artEl);

        setTimeout(() => {
            artEl.style.top = '20%';
            artEl.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            if (artEl.parentElement) artEl.parentElement.removeChild(artEl);
        }, 1100);

    }, 600);

    // Cleanup shovel
    setTimeout(() => {
        if (shovel.parentElement) shovel.parentElement.removeChild(shovel);
    }, 1500);
}

export function triggerConfetti() {
    if (!elements.confettiContainer) return;
    elements.confettiContainer.style.display = 'block';
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.position = 'absolute';
        confetti.style.left = '50%';
        confetti.style.top = '50%';
        confetti.style.transition = 'all 2s ease-out';
        elements.confettiContainer.appendChild(confetti);

        setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 300;
            confetti.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${Math.random() * 720}deg)`;
            confetti.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            if (confetti.parentElement) confetti.parentElement.removeChild(confetti);
        }, 2100);
    }

    setTimeout(() => {
        elements.confettiContainer.style.display = 'none';
    }, 2200);
}
