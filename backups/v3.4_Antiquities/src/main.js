// src/main.js
import { CONFIG, FOWL_INSULTS } from './config.js';
import { formatNumber, calculateCost, deepMerge, isObject } from './utils.js';
import { initialGameState } from './state.js';
import { getEggsPerSecond, getEggsPerClick, getPrestigeCost, checkAchievements, getBuffModifier, tryDigArtifact, getMoonDarkMatterPerSecond, getMoonDarkMatterPerClick } from './logic.js';
import { 
    elements, buildUpgradeShop, buildCoop, updateUI, 
    renderAchievements, updateAchievementProgress, showToast, showFloatingText, renderMuseum, renderGeneticLab, updateChickenSkin, buildLunarUpgradeShop, buildLunarCoop, updateUIScene, updateChangelogSpoilers,
    animateDigging, triggerConfetti
} from './ui.js';

let gameState = {};

function clickChicken(event) {
    if (gameState.activeScene === 'moon') {
        let dmc = getMoonDarkMatterPerClick(gameState);
        gameState.darkMatter += dmc;
        showFloatingText(`+${formatNumber(dmc)} DM`, event);
    } else {
        let epc = getEggsPerClick(gameState);
        if (gameState.upgrades.eggstraClicks > 0 && Math.random() < (gameState.upgrades.eggstraClicks * 0.05)) {
            epc *= 10;
        }
        gameState.eggs += epc;
        gameState.totalEggs += epc;
        showFloatingText(`+${formatNumber(epc)}`, event);
    }
    
    // Artifact Digging (only on Earth)
    if (gameState.activeScene === 'earth') {
        const artifact = tryDigArtifact(gameState);
        if (artifact) {
            animateDigging(artifact);
            if (artifact.name === 'Donator Pack') {
                triggerConfetti();
                showToast("THE BIG FIND!", "You found the Donator Pack! Please screenshot this and contact the developer!");
                checkAchievements(gameState, (name) => showToast("Achievement Unlocked!", name)); // Check for Big Find achievement immediately
            } else {
                showToast("Artifact Found!", `You dug up: ${artifact.name}`);
            }
            renderMuseum(gameState); // Update UI if open
        }
    }
    
    // Check for Fowl Language upgrade and occasionally show an insult
    if (gameState.upgrades.fowlLanguage > 0 && Math.random() < 0.00008333) { 
        const insult = FOWL_INSULTS[Math.floor(Math.random() * FOWL_INSULTS.length)];
        const el = document.createElement('div');
        el.className = 'floating-insult';
        el.textContent = insult;

		const scene = document.getElementById('game-scene');
		if (scene) {
			scene.appendChild(el);
			const containerRect = scene.getBoundingClientRect();
			el.style.left = `${(containerRect.width / 2) - (el.offsetWidth / 2)}px`;
			el.style.top = `${containerRect.height * 0.6}px`;
			setTimeout(() => {
				if (el.parentElement) {
					el.parentElement.removeChild(el);
				}
			}, 1450);
		}
        gameState.firstInsultFired = true;
    }

    const superClickChance = (gameState.chickens.doja * 0.001) * (gameState.activeBuffs.superClickFrenzy ? gameState.activeBuffs.superClickFrenzy.value : 1);
    if (gameState.chickens.doja > 0 && Math.random() < superClickChance) {
        const now = Date.now();
        if (now - gameState.lastSuperClickTime < 10000) {
            gameState.superClickChain++;
        } else {
            gameState.superClickChain = 0;
        }
        gameState.lastSuperClickTime = now;
        const superClickBonus = (getEggsPerSecond(gameState) * 3600) * (1 + gameState.superClickChain * 0.1);
        gameState.eggs += superClickBonus;
        gameState.totalEggs += superClickBonus;
        showFloatingText(`+${formatNumber(superClickBonus)}!`, event, true);
    }
    gameState.totalClicks++;
    gameState.timeSinceLastClick = 0;
}

function buyUpgrade(id) {
    const upgrade = CONFIG.UPGRADES[id];
    const cost = calculateCost(upgrade.baseCost, gameState.upgrades[id], upgrade.exponent, gameState);
    if (gameState[upgrade.currency] >= cost) {
        gameState[upgrade.currency] -= cost;
        gameState.upgrades[id]++;
        
        if (id === 'spaceProgram') {
            launchRocketAnimation();
            // Rebuild shop to reveal description
            buildUpgradeShop(gameState, buyUpgrade);
        }

        updateUI(gameState); // Immediate update
    } else {
        gameState.failedBuys++;
    }
}

function buyChicken(id) {
    const chicken = CONFIG.CHICKENS[id];
    const cost = calculateCost(chicken.baseCost, gameState.chickens[id], chicken.exponent, gameState);
    if (gameState.eggs >= cost) {
        gameState.eggs -= cost;
        gameState.chickens[id]++;
        // Unlock skin associated with this chicken
        if (CONFIG.SKINS[id] && !gameState.unlockedSkins.includes(id)) {
            gameState.unlockedSkins.push(id);
            showToast("New Skin Unlocked!", `You can now use the ${CONFIG.SKINS[id].name} skin!`);
            renderGeneticLab(gameState, equipSkin); // Update lab if open
        }
        updateUI(gameState); // Immediate update
    } else {
        gameState.failedBuys++;
    }
}

function buyLunarUpgrade(id) {
    const upgrade = CONFIG.LUNAR_UPGRADES[id];
    const cost = calculateCost(upgrade.baseCost, gameState.lunarUpgrades[id], upgrade.exponent, gameState);
    if (gameState[upgrade.currency] >= cost) {
        gameState[upgrade.currency] -= cost;
        gameState.lunarUpgrades[id]++;
        updateUI(gameState); // Immediate update
    } else {
        gameState.failedBuys++;
    }
}

function buyLunarChicken(id) {
    const chicken = CONFIG.LUNAR_CHICKENS[id];
    const cost = calculateCost(chicken.baseCost, gameState.lunarChickens[id], chicken.exponent, gameState);
    if (gameState.moonEggs >= cost) {
        gameState.moonEggs -= cost;
        gameState.lunarChickens[id]++;
        updateUI(gameState); // Immediate update
    } else {
        gameState.failedBuys++;
    }
}

function spawnGoldenChicken() {
    const containerRect = elements.coloredEggContainer.getBoundingClientRect();
    const groundTop = containerRect.height * 0.65; 
    const randomY = groundTop + Math.random() * (containerRect.height * 0.2);
    
    elements.goldenChicken.style.top = `${randomY}px`;
    elements.goldenChicken.style.left = '0px'; 
    elements.goldenChicken.style.display = 'block';
    elements.goldenChicken.style.opacity = '1';
    elements.goldenChicken.style.pointerEvents = 'auto';
    
    elements.goldenChicken.classList.remove('run-animation');
    void elements.goldenChicken.offsetWidth; 
    elements.goldenChicken.classList.add('run-animation');

    setTimeout(() => {
        elements.goldenChicken.style.opacity = '0';
        setTimeout(() => {
            elements.goldenChicken.style.display = 'none';
            elements.goldenChicken.classList.remove('run-animation');
        }, 500);
    }, 10000);
}

function clickGoldenChicken(event) {
    const compassBonus = 1 + (gameState.upgrades.goldenCompass * 0.25);
    const bonus = Math.max(getEggsPerClick(gameState) * 100, getEggsPerSecond(gameState) * 10 * 60) * compassBonus;
    gameState.eggs += bonus;
    gameState.totalEggs += bonus;
    gameState.goldenChickensClicked++;
    showFloatingText(`+${formatNumber(bonus)}!`, event);
    elements.goldenChicken.style.display = 'none';
}

function launchRocketAnimation() {
    if (!elements.rocketAsset) return;
    elements.rocketAsset.style.display = 'block';
    elements.rocketAsset.classList.add('launch-animation');
    showToast("LIFTOFF!", "The space program has begun!");
    
    setTimeout(() => {
        elements.rocketAsset.style.display = 'none';
        elements.rocketAsset.classList.remove('launch-animation');
    }, 4000);
}

function spawnColoredEgg() {
    if (Math.random() > CONFIG.COLORED_EGG_SPAWN_CHANCE) return;
    const roll = Math.random() * 100;
    let cumulativeLikelihood = 0;
    for (const id in CONFIG.COLORED_EGGS) {
        const egg = CONFIG.COLORED_EGGS[id];
        cumulativeLikelihood += egg.likelihood;
        if (roll < cumulativeLikelihood) {
            const eggEl = document.createElement('div');
            eggEl.className = 'colored-egg bounce-animation';
            eggEl.style.backgroundColor = egg.color;
            eggEl.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
            eggEl.style.boxShadow = `inset -5px -5px 10px rgba(0,0,0,0.3), 0 0 10px ${egg.color}`;
            eggEl.style.pointerEvents = 'auto';
            
            const containerRect = elements.coloredEggContainer.getBoundingClientRect();
            eggEl.style.left = `${Math.random() * (containerRect.width - 40)}px`;
            
            eggEl.style.display = 'block';
            eggEl.addEventListener('click', () => { applyEggEffect(id); eggEl.remove(); }, { once: true });
            elements.coloredEggContainer.appendChild(eggEl);
            setTimeout(() => { if (eggEl.parentElement) eggEl.parentElement.removeChild(el); }, 10000);
            return;
        }
    }
}

function applyEggEffect(id) {
    const egg = CONFIG.COLORED_EGGS[id];
    gameState.clickedColoredEggs[id] = (gameState.clickedColoredEggs[id] || 0) + 1;
    let bonusTitle = `${id.charAt(0).toUpperCase() + id.slice(1)} Egg Bonus!`;
    let bonusDescription = '';
    switch(egg.effect) {
        case 'discount': bonusDescription = `Next ${egg.duration} upgrades are ${egg.value * 100}% cheaper!`; break;
        case 'clickFrenzy': bonusDescription = `Click power is ${egg.value}x for ${egg.duration} seconds!`; break;
        case 'instantGain': const gain = getEggsPerSecond(gameState) * egg.value; gameState.eggs += gain; gameState.totalEggs += gain; bonusDescription = `Instantly gained ${formatNumber(gain)} eggs!`; break;
        case 'featherFrenzy': bonusDescription = `Golden Feather chance is doubled for ${egg.duration / 60} minutes!`; break;
        case 'goldRush': bonusDescription = `A rush of ${egg.value} Golden Chickens has appeared!`; for(let i=0; i<egg.value; i++) spawnGoldenChicken(); break;
        case 'boostMultiplier': bonusDescription = `All egg production is doubled for ${egg.duration} seconds!`; break;
        case 'superClickFrenzy': bonusDescription = `Super Click chance is doubled for ${egg.duration} seconds!`; break;
        case 'prestigeBuff': bonusDescription = `Your next prestige will grant an extra ${egg.value * 100}% Reputation!`; break;
        case 'prestigePercent': const prestigeGain = getPrestigeCost(gameState) * egg.value; gameState.eggs += prestigeGain; gameState.totalEggs += prestigeGain; bonusDescription = `Gained ${formatNumber(prestigeGain)} eggs toward your next prestige!`; break;
        case 'permanentBonus': bonusDescription = `Permanently increased all egg production by ${egg.value * 100}%!`; break;
    }
    showToast(bonusTitle, bonusDescription);

    if (egg.duration > 0) {
        const durationBonus = 1 + (gameState.upgrades.prismaticFeed * 0.10);
        const addedDuration = egg.duration * durationBonus;
        if (gameState.activeBuffs[egg.effect]) {
            gameState.activeBuffs[egg.effect].duration += addedDuration;
            gameState.activeBuffs[egg.effect].value = egg.value;
        } else {
            gameState.activeBuffs[egg.effect] = { value: egg.value, duration: addedDuration };
        }
    } else if (egg.effect === 'permanentBonus') {
        gameState.permanentBonus += egg.value;
    } else if (egg.effect === 'prestigeBuff') {
        gameState.activeBuffs[egg.effect] = { value: (gameState.activeBuffs[egg.effect]?.value || 0) + egg.value };
    }
    checkAchievements(gameState, (name) => showToast("Achievement Unlocked!", name));
}

function saveGame() { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(gameState)); }

function loadGame() {
    const savedState = localStorage.getItem(CONFIG.SAVE_KEY);
    gameState = savedState ? JSON.parse(savedState) : { ...initialGameState };
    gameState = deepMerge(initialGameState, gameState);

    const resetCount = localStorage.getItem('chickenClickerResetCount');
    if (resetCount) {
        gameState.resets = parseInt(resetCount, 10);
        localStorage.removeItem('chickenClickerResetCount');
    }

    if (!gameState.nickname) {
        elements.nameModal.style.display = 'flex';
    } else {
        elements.playerNameDisplay.textContent = gameState.nickname;
    }
    elements.nicknameInput.value = gameState.nickname;
}

function hardReset() {
    if (confirm("Are you sure you want to completely reset your game? This cannot be undone.")) {
        localStorage.setItem('chickenClickerResetCount', (gameState.resets || 0) + 1);
        localStorage.removeItem(CONFIG.SAVE_KEY);
        location.reload();
    }
}

function exportSave(toFile = false) {
    try {
        const saveString = btoa(JSON.stringify(gameState));
        if (toFile) {
            const blob = new Blob([saveString], {type: "text/plain;charset=utf-8"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chicken_clicker_save_${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Success", "Save file downloaded!");
        } else {
            navigator.clipboard.writeText(saveString).then(() => {
                showToast("Success", "Save data copied to clipboard!");
            }, () => {
                showToast("Error", "Could not copy to clipboard.");
            });
        }
    } catch (e) {
        showToast("Error", "Could not export save data.");
        console.error("Export failed:", e);
    }
}

function importSave(saveString) {
    if (!saveString) {
        showToast("Error", "No save data provided.");
        return;
    }
    try {
        const decodedString = atob(saveString);
        const newGameState = JSON.parse(decodedString);
        
        if (typeof newGameState.eggs !== 'number' || typeof newGameState.upgrades.worker !== 'number') {
            throw new Error("Invalid save file structure.");
        }

        localStorage.setItem(CONFIG.SAVE_KEY, decodedString);
        showToast("Success", "Game imported! Reloading...");
        setTimeout(() => location.reload(), 1500);

    } catch (e) {
        showToast("Error", "Invalid or corrupt save data.");
        console.error("Import failed:", e);
    }
}

function calculateOfflineProgress() {
    const lastTime = localStorage.getItem('chickenClickerExitTime');
    if (!lastTime) return;

    localStorage.removeItem('chickenClickerExitTime');

    let offlineSeconds = (Date.now() - parseInt(lastTime, 10)) / 1000;
    if (offlineSeconds <= 10) return;

    const maxOfflineSeconds = 86400 + (gameState.upgrades.comfyCoopBedding * 7200);
    offlineSeconds = Math.min(offlineSeconds, maxOfflineSeconds);

    let eggsGained = 0;
    let dmGained = 0;
    let moonEggsGained = 0;

    if (gameState.activeScene === 'moon') {
        const offlineDps = getMoonDarkMatterPerSecond(gameState);
        dmGained = offlineDps * offlineSeconds;
        moonEggsGained = gameState.lunarChickens.lunar * offlineSeconds;
        gameState.darkMatter += dmGained;
        gameState.moonEggs += moonEggsGained;
    } else {
        const offlineEps = getEggsPerSecond(gameState);
        eggsGained = offlineEps * offlineSeconds;
        gameState.eggs += eggsGained;
        gameState.totalEggs += eggsGained;
    }
    
    const featherChancePerSecond = (gameState.chickens.silkie * (0.1 + (gameState.upgrades.featherForecast * 0.01)));
    const feathersGained = Math.floor(featherChancePerSecond * offlineSeconds);

    const repChancePerSecond = gameState.chickens.rooster * 0.01;
    const repGained = repChancePerSecond * offlineSeconds;

    if (eggsGained <= 0 && feathersGained <= 0 && repGained <= 0 && dmGained <= 0 && moonEggsGained <= 0) return;

    const timeAwayHours = Math.floor(offlineSeconds / 3600);
    const timeAwayMinutes = Math.floor((offlineSeconds % 3600) / 60);
    document.getElementById('offline-time').textContent = `${timeAwayHours}h ${timeAwayMinutes}m`;
    
    const offlineEggsLine = document.getElementById('offline-eggs-line');
    if (eggsGained > 0) {
        offlineEggsLine.textContent = `+${formatNumber(eggsGained)} Eggs`;
        offlineEggsLine.classList.remove('hidden');
    } else {
        offlineEggsLine.classList.add('hidden');
    }

    const offlineFeathersLine = document.getElementById('offline-feathers-line');
     if (feathersGained > 0) {
        offlineFeathersLine.textContent = `+${formatNumber(feathersGained)} Golden Feathers`;
        offlineFeathersLine.classList.remove('hidden');
    } else {
        offlineFeathersLine.classList.add('hidden');
    }

    const offlineRepLine = document.getElementById('offline-rep-line');
     if (repGained > 0) {
        offlineRepLine.textContent = `+${formatNumber(repGained)} Reputation`;
        offlineRepLine.classList.remove('hidden');
    } else {
        offlineRepLine.classList.add('hidden');
    }

    // Dynamic Moon Lines
    let moonLine = document.getElementById('offline-moon-line');
    if (!moonLine) {
        moonLine = document.createElement('p');
        moonLine.id = 'offline-moon-line';
        document.getElementById('offline-recap').appendChild(moonLine);
    }
    if (moonEggsGained > 0 || dmGained > 0) {
        let text = [];
        if (moonEggsGained > 0) text.push(`+${formatNumber(moonEggsGained)} Moon Eggs`);
        if (dmGained > 0) text.push(`+${formatNumber(dmGained)} Dark Matter`);
        moonLine.textContent = text.join(', ');
        moonLine.style.display = 'block';
    } else {
        moonLine.style.display = 'none';
    }

    document.getElementById('offline-progress-modal').style.display = 'flex';
}

let lastTick = Date.now();

function gameLoop() {
    try {
        const now = Date.now();
        let secondsPassed = (now - lastTick) / 1000;
        lastTick = now;
        
        if (secondsPassed > 3600) secondsPassed = 0.1; 

        if (gameState.activeScene === 'moon') {
            const dps = getMoonDarkMatterPerSecond(gameState);
            gameState.darkMatter += dps * secondsPassed;
            gameState.moonEggs += gameState.lunarChickens.lunar * secondsPassed;
        } else {
            const eps = getEggsPerSecond(gameState);
            gameState.eggs += eps * secondsPassed;
            gameState.totalEggs += eps * secondsPassed;
        }
        
        gameState.timePlayed += secondsPassed;
        gameState.timeSinceLastClick = (gameState.timeSinceLastClick || 0) + secondsPassed;
        const activeBuffKeys = Object.keys(gameState.activeBuffs);
        for (const buffKey of activeBuffKeys) {
            const buff = gameState.activeBuffs[buffKey];
            if (buff && typeof buff.duration === 'number' && buff.duration > 0) {
                buff.duration -= secondsPassed;
                if (buff.duration <= 0) {
                    delete gameState.activeBuffs[buffKey];
                }
            }
        }
        if(gameState.event.active) {
            gameState.event.duration -= secondsPassed;
            if(gameState.event.duration <= 0) gameState.event.active = false;
        }
        const featherChance = 0.1 + (gameState.upgrades.featherForecast * 0.01);
        const featherFrenzyBonus = getBuffModifier(gameState, 'featherFrenzy');
        if(Math.random() < (gameState.chickens.silkie * featherChance * featherFrenzyBonus * secondsPassed)) {
            gameState.feathers++;
            gameState.totalFeathers++;
        }
        gameState.reputation += gameState.chickens.rooster * 0.01 * secondsPassed;
        if (gameState.chickens.serama > 0 && Math.random() < (gameState.chickens.serama * 0.01 * secondsPassed)) {
            let cheapest = null, minCost = Infinity;
            for(const id in CONFIG.UPGRADES) {
                const cost = calculateCost(CONFIG.UPGRADES[id].baseCost, gameState.upgrades[id], CONFIG.UPGRADES[id].exponent, gameState);
                if(cost < minCost) { minCost = cost; cheapest = id; }
            }
            if(cheapest) gameState.upgrades[cheapest]++;
        }

        if (gameState.chickens.orpington > 0) {
            gameState.oracleTimer = (gameState.oracleTimer || 0) + secondsPassed;
            if (gameState.oracleTimer >= 600) {
                const oracles = gameState.chickens.orpington;
                const baseBonus = getEggsPerSecond(gameState) * 1800;
                const randomMultiplier = Math.random() + 0.5;
                const totalBonus = Math.floor(baseBonus * oracles * randomMultiplier);

                if (totalBonus > 0) {
                    gameState.eggs += totalBonus;
                    gameState.totalEggs += totalBonus;
                    showToast("Oracle's Blessing!", `Your Orpington Oracles granted you ${formatNumber(totalBonus)} eggs!`);
                }
                gameState.oracleTimer = 0;
            }
        }

        updateUI(gameState);
        updateAchievementProgress(gameState);
        checkAchievements(gameState, (name) => showToast("Achievement Unlocked!", name));
    } catch (error) {
        console.error("Game loop crashed:", error);
    }
}

function prestige() {
    const requiredCost = getPrestigeCost(gameState);
    if (gameState.eggs >= requiredCost) {
        if(confirm(`Are you sure you want to sell the coop? This will reset your eggs, upgrades, and chickens for Reputation points.`)){
            const { nickname, unlockedAchievements, permanentBonus, resets, prestigeUpgrades } = gameState;
            const eggsForPrestige = Math.floor(Math.sqrt(gameState.totalEggs / 1e11));
            const prestigeBuff = gameState.activeBuffs.prestigeBuff ? gameState.activeBuffs.prestigeBuff.value : 0;

            const reputationFromEggs = Math.floor((eggsForPrestige > 0 ? eggsForPrestige : 1) * (1 + prestigeBuff));
            const reputationFromRoosters = (gameState.chickens.rooster || 0) * (CONFIG.CHICKENS.rooster.repValue || 0);
            const totalReputationGained = reputationFromEggs + reputationFromRoosters;

            const wyandotteBonus = 1 + (gameState.chickens.wyandotte * 0.05);
            const finalGainedRep = Math.floor(totalReputationGained * wyandotteBonus);

            let newRep = (gameState.reputation || 0) + finalGainedRep;

            if (!isFinite(newRep)) {
                newRep = gameState.reputation || 0;
            }

            const prestigeCount = (gameState.prestigeCount || 0) + 1;
            const unlockedHidden = unlockedAchievements.filter(id => achievements[id]?.hidden);
            
            let newGameState = deepMerge(initialGameState, {});
            newGameState.nickname = nickname;
            newGameState.reputation = newRep;
            newGameState.prestigeCount = prestigeCount;
            newGameState.unlockedAchievements = unlockedHidden;
            newGameState.permanentBonus = permanentBonus;
            newGameState.resets = resets;
            newGameState.prestigeUpgrades = prestigeUpgrades;

            if (newGameState.prestigeUpgrades.ancestralBlueprints > 0) {
                newGameState.upgrades.worker = newGameState.prestigeUpgrades.ancestralBlueprints * 5;
            }

            gameState = newGameState;

            saveGame();
            location.reload();
        }
    }
}

function triggerEvent() {
    if(gameState.event.active) return;
    gameState.event = { active: true, type: "Feeding Frenzy", duration: 60, modifier: 2 };
}

function setupEventListeners() {
    elements.startGameBtn.addEventListener('click', () => {
        const name = elements.initialNicknameInput.value.trim();
        if (name) {
            gameState.nickname = name;
            elements.nicknameInput.value = name;
            elements.nameModal.style.display = 'none';
            elements.playerNameDisplay.textContent = name;
            saveGame();
        }
    });
    elements.chicken.addEventListener('click', clickChicken);
    elements.goldenChicken.addEventListener('click', clickGoldenChicken);
    const navButtons = document.querySelectorAll('.nav-btn');
    const closeButtons = document.querySelectorAll('.close-modal-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.dataset.modal;
            document.getElementById(modalId).style.display = 'flex';
            gameState.modalOpens++;
            // Specific renders for each modal
            if (modalId === 'achievements-screen') renderAchievements(gameState);
            if (modalId === 'museum-screen') renderMuseum(gameState);
            if (modalId === 'genetic-lab-screen') renderGeneticLab(gameState, equipSkin);
            if (modalId === 'settings-screen' || modalId === 'help-screen') updateChangelogSpoilers(gameState);
        });
    });
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal-screen').style.display = 'none';
        });
    });
    elements.nicknameInput.addEventListener('change', (e) => { 
        const name = e.target.value || "A Farmer";
        gameState.nickname = name;
        elements.playerNameDisplay.textContent = gameState.nickname;

        // Easter Egg: Faction Password
        if (name.toLowerCase() === 'banty shack' && !gameState.unlockedAchievements.includes('bantySecret')) {
            gameState.unlockedAchievements.push('bantySecret');
            gameState.feathers += 500;
            gameState.totalFeathers += 500;
            showToast("Faction Reward!", "Banty Shack Forever! +500 Feathers & Bonus unlocked.");
            saveGame();
            renderAchievements(gameState);
            updateUI(gameState);
        }
    });
    elements.prestigeButton.addEventListener('click', prestige);
    elements.resetButton.addEventListener('click', hardReset);
    elements.licenseSummary.addEventListener('click', () => { gameState.licenseClicked = true; });
    elements.sceneSwitcherBtn.addEventListener('click', toggleScene);
    
    const saveExitTime = () => localStorage.setItem('chickenClickerExitTime', Date.now());
    window.addEventListener('beforeunload', saveExitTime);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveExitTime();
        }
    });
    
    elements.exportSaveClipboardBtn.addEventListener('click', () => exportSave(false));
    elements.exportSaveFileBtn.addEventListener('click', () => exportSave(true));
    elements.importSaveTextBtn.addEventListener('click', () => importSave(elements.importSaveText.value));
    elements.importSaveFileBtn.addEventListener('click', () => elements.importFileInput.click());
    elements.importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => importSave(e.target.result);
            reader.readAsText(file);
        }
    });

    document.getElementById('buy-ancestralBlueprints').addEventListener('click', () => {
        const level = gameState.prestigeUpgrades.ancestralBlueprints;
        const cost = 10 * Math.pow(2, level);
        if (gameState.reputation >= cost) {
            gameState.reputation -= cost;
            gameState.prestigeUpgrades.ancestralBlueprints++;
        }
    });

    // Event listeners for Lunar Upgrades and Chickens
    for (const id in CONFIG.LUNAR_UPGRADES) {
        document.getElementById(`buy-lunar-${id}`).addEventListener('click', () => buyLunarUpgrade(id));
    }
    for (const id in CONFIG.LUNAR_CHICKENS) {
        document.getElementById(`buy-lunar-${id}`).addEventListener('click', () => buyLunarChicken(id));
    }

    // Interactive Event Listeners
    elements.eagleAsset.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("Eagle Clicked!");
        gameState.eagleClicks++;
        
        // Visual Feedback
        elements.eagleAsset.style.transition = "all 0.2s";
        elements.eagleAsset.style.transform = "scale(0)";
        elements.eagleAsset.style.opacity = "0";

        const bonus = getEggsPerSecond(gameState) * 600; // 10 minutes of production
        gameState.eggs += bonus;
        gameState.totalEggs += bonus;
        showFloatingText(`+${formatNumber(bonus)} (Scared!)`, e);
        
        if (gameState.eagleClicks === 1) {
            showToast("Guide Updated!", "New information revealed in the Farmer's Guide.");
        }
        
        saveGame();
        setTimeout(() => { elements.eagleAsset.style.display = 'none'; }, 200);
        checkAchievements(gameState, (name) => showToast("Achievement Unlocked!", name));
    });

    elements.groundCritterAsset.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("Critter Clicked!");
        
        // Visual Feedback
        elements.groundCritterAsset.style.transition = "all 0.2s";
        elements.groundCritterAsset.style.transform = "scale(0)";
        elements.groundCritterAsset.style.opacity = "0";

        // 10% chance to be a Badger, else Fox
        const isBadger = Math.random() < 0.1;
        if (isBadger) {
            gameState.badgerClicks++;
            showToast("Mushroom Mushroom!", "You found a Badger!");
        } else {
            gameState.foxClicks++;
            showToast("What Does It Say?", "You shooed a Fox!");
        }
        // Bonus: Golden Feather
        gameState.feathers++;
        gameState.totalFeathers++;
        showFloatingText("+1 Feather", e);
        
        if ((isBadger && gameState.badgerClicks === 1) || (!isBadger && gameState.foxClicks === 1)) {
             // Only show guide toast if we haven't seen ANY critter yet? 
             // The spoiler unlock condition is (eagle OR fox OR umbrella).
             // So if eagleClicks==0 AND foxClicks==1 AND umbrellaClicks==0, show it.
             if (gameState.eagleClicks === 0 && (gameState.foxClicks + gameState.badgerClicks === 1) && gameState.umbrellaClicks === 0) {
                 showToast("Guide Updated!", "New information revealed in the Farmer's Guide.");
             }
        }

        saveGame();
        setTimeout(() => { elements.groundCritterAsset.style.display = 'none'; }, 200);
        checkAchievements(gameState, (name) => showToast("Achievement Unlocked!", name));
    });

    elements.umbrellaAsset.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("Umbrella Clicked!");
        gameState.umbrellaClicks++;

        // Visual Feedback
        elements.umbrellaAsset.style.transition = "all 0.2s";
        elements.umbrellaAsset.style.transform = "scale(0)";
        elements.umbrellaAsset.style.opacity = "0";

        const bonus = getEggsPerClick(gameState) * 500;
        gameState.eggs += bonus;
        gameState.totalEggs += bonus;
        showFloatingText("Stay Dry!", e);
        
        // Stop rain immediately
        elements.rainOverlay.style.display = 'none'; 
        
        if (gameState.umbrellaClicks === 1) {
            showToast("Guide Updated!", "New information revealed in the Farmer's Guide.");
        }

        saveGame();
        setTimeout(() => { elements.umbrellaAsset.style.display = 'none'; }, 200);
        checkAchievements(gameState, (name) => showToast("Achievement Unlocked!", name));
    });

    // Guide / Help Icon Listener
    if (elements.helpIcon) {
        elements.helpIcon.addEventListener('click', () => {
            document.getElementById('help-screen').style.display = 'flex';
            updateChangelogSpoilers(gameState);
        });
    }
}

function equipSkin(skinId) {
    if (gameState.unlockedSkins.includes(skinId)) {
        gameState.skin = skinId;
        updateChickenSkin(skinId);
        renderGeneticLab(gameState, equipSkin); // Re-render to update 'Equipped' state
        showToast("Skin Changed!", `You are now a ${CONFIG.SKINS[skinId].name}!`);
    } else {
        showToast("Locked Skin", "You haven't unlocked this skin yet!");
    }
}

function toggleScene() {
    if (gameState.activeScene === 'earth') {
        gameState.activeScene = 'moon';
        showToast("To the Moon!", "Welcome to your Lunar Coop!");
    } else {
        gameState.activeScene = 'earth';
        showToast("Back to Earth!", "Welcome back to the farm!");
    }
    updateUIScene(gameState.activeScene);
    updateUI(gameState);
}

function triggerInteractiveEvent() {
    const roll = Math.random();
    
    if (roll < 0.4) {
        // Eagle (40% chance)
        elements.eagleAsset.style.display = 'block';
        elements.eagleAsset.classList.remove('run-animation');
        // Re-use run-animation logic but maybe we need a fly-animation? 
        // For now, just place it and move it via CSS or reuse the class if it works horizontally.
        elements.eagleAsset.style.top = '50px';
        elements.eagleAsset.style.left = '-100px';
        void elements.eagleAsset.offsetWidth;
        elements.eagleAsset.classList.add('run-animation');
        
        setTimeout(() => { elements.eagleAsset.style.display = 'none'; }, 10000);

    } else if (roll < 0.7) {
        // Ground Critter (30% chance)
        elements.groundCritterAsset.style.display = 'block';
        // Random position in the "bush" layer (bottom 30%)
        const randomX = 10 + Math.random() * 80;
        elements.groundCritterAsset.style.left = `${randomX}%`;
        elements.groundCritterAsset.style.bottom = '25%';
        
        setTimeout(() => { elements.groundCritterAsset.style.display = 'none'; }, 5000);

    } else {
        // Rain (30% chance)
        elements.rainOverlay.style.display = 'block';
        elements.umbrellaAsset.style.display = 'block';
        elements.umbrellaAsset.style.top = `${20 + Math.random() * 60}%`;
        elements.umbrellaAsset.style.left = `${20 + Math.random() * 60}%`;
        
        setTimeout(() => { 
            elements.rainOverlay.style.display = 'none';
            elements.umbrellaAsset.style.display = 'none';
        }, 8000);
    }
}

function initialize() {
    loadGame();
    if (elements.versionNumberEl) {
        elements.versionNumberEl.textContent = CONFIG.GAME_VERSION;
    }
    buildUpgradeShop(gameState, buyUpgrade);
    buildCoop(gameState, buyChicken);
    buildLunarUpgradeShop(gameState, buyLunarUpgrade); // New lunar shop
    buildLunarCoop(gameState, buyLunarChicken); // New lunar coop
    
    calculateOfflineProgress();

    renderAchievements(gameState);
    renderMuseum(gameState);
    renderGeneticLab(gameState, equipSkin); // Initial render
    updateChickenSkin(gameState.skin); // Apply active skin on load
    updateUIScene(gameState.activeScene); // Set initial scene visibility
    updateUI(gameState);
    setupEventListeners();
    setInterval(gameLoop, CONFIG.GAME_TICK_INTERVAL * 1000);
    setInterval(saveGame, CONFIG.SAVE_INTERVAL * 1000);
    setInterval(spawnGoldenChicken, CONFIG.GOLDEN_CHICKEN_SPAWN_INTERVAL * 1000);
    setInterval(triggerEvent, CONFIG.RANDOM_EVENT_INTERVAL * 1000);
    setInterval(spawnColoredEgg, CONFIG.COLORED_EGG_ATTEMPT_INTERVAL * 1000);
    setInterval(triggerInteractiveEvent, CONFIG.INTERACTIVE_EVENT_INTERVAL * 1000);
}

initialize();