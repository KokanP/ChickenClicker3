// src/logic.js
import { CONFIG, achievements, achievementConditions } from './config.js';
import { calculateCost } from './utils.js';

/**
 * Calculates the reputation bonus multiplier.
 * @param {object} gs - The game state.
 * @returns {number} The multiplier (e.g., 1.05 for +5%).
 */
export const getReputationBonus = (gs) => 1 + (gs.reputation || 0) * 0.05;

/**
 * Gets the current event modifier if active.
 * @param {object} gs - The game state.
 * @returns {number} The event multiplier.
 */
export const getEventModifier = (gs) => gs.event.active ? gs.event.modifier : 1;

/**
 * Helper to get a specific active buff's value.
 * @param {object} gs - The game state.
 * @param {string} buffType - The key of the buff.
 * @param {number} defaultValue - Default value if not active.
 * @returns {number} The buff value.
 */
export const getBuffModifier = (gs, buffType, defaultValue = 1) => {
    const buff = gs.activeBuffs[buffType];
    if (buff && buff.duration > 0) {
        return buff.value;
    }
    return defaultValue;
};

export const getBoostMultiplier = (gs) => getBuffModifier(gs, 'boostMultiplier');

export const getArtifactBonus = (gs, effectType) => {
    return gs.artifacts.reduce((total, id) => {
        const art = CONFIG.ARTIFACTS[id];
        if (art && (art.effect === effectType || art.effect === 'global')) {
            return total + art.value;
        }
        return total;
    }, 0);
};

export const getAchievementBonus = (gs) => {
    const totalBonus = gs.unlockedAchievements.reduce((sum, id) => {
        const bonusValue = achievements[id]?.bonus || 1;
        return sum + (bonusValue - 1);
    }, 0);
    return 1 + totalBonus;
};

export const getBaseEggsPerSecond = (gs) => {
    let baseEps = gs.upgrades.worker * gs.chickens.leghorn * 1;
    baseEps += gs.chickens.brahma * (baseEps * 5);
    return baseEps;
};

/**
 * Calculates the final Eggs Per Second including all multipliers.
 * @param {object} gs - The game state.
 * @returns {number} Final EPS.
 */
export const getEggsPerSecond = (gs) => {
    const baseEps = getBaseEggsPerSecond(gs);
    const interestCap = baseEps > 0 ? baseEps * 10 : 1000;
    const nestEggInterest = gs.upgrades.nestEggIRA > 0 ? Math.min(baseEps * 0.001 * gs.upgrades.nestEggIRA, interestCap) : 0;
    const peckingOrderBonus = 1 + (gs.upgrades.peckingOrder * 0.1);
    const bantyBonus = Math.pow(1.1, gs.chickens.banty);
    const quantumBonus = gs.chickens.quantum > 0 ? Math.pow(1 + (gs.unlockedAchievements.length * 0.1), gs.chickens.quantum) : 1;
    const eventHorizonBonus = 1 + (gs.upgrades.eventHorizon * 0.01 * gs.prestigeCount);
    const artifactBonus = 1 + getArtifactBonus(gs, 'eps');
    
    const totalBuildings = Object.values(gs.upgrades).reduce((a, b) => a + b, 0) + Object.values(gs.chickens).reduce((a, b) => a + b, 0);
    const cluckworkBonus = 1 + (gs.upgrades.cluckworkAutomation * 0.05 * totalBuildings);
    return (baseEps + nestEggInterest) * getAchievementBonus(gs) * getReputationBonus(gs) * getEventModifier(gs) * getBoostMultiplier(gs) * gs.permanentBonus * peckingOrderBonus * bantyBonus * quantumBonus * eventHorizonBonus * cluckworkBonus * artifactBonus;
};

/**
 * Calculates Eggs Per Click.
 * @param {object} gs - The game state.
 * @returns {number} EPC.
 */
export const getEggsPerClick = (gs) => {
    const loomBoost = 1 + (gs.upgrades.loom * 0.25);
    const baseEpc = 1 + gs.upgrades.incubator;
    const peckingOrderBonus = 1 + (gs.upgrades.peckingOrder * 0.1);
    const bantyBonus = Math.pow(1.1, gs.chickens.banty);
    const artifactBonus = 1 + getArtifactBonus(gs, 'click');
    return Math.floor(baseEpc * loomBoost * getAchievementBonus(gs) * getReputationBonus(gs) * getEventModifier(gs) * getBoostMultiplier(gs) * gs.permanentBonus * peckingOrderBonus * bantyBonus * getBuffModifier(gs, 'clickFrenzy') * artifactBonus);
};

/**
 * Calculates Dark Matter per second for lunar operations.
 * @param {object} gs - The game state.
 * @returns {number} DM/s.
 */
export const getMoonDarkMatterPerSecond = (gs) => {
    let baseDps = gs.lunarUpgrades.moonMiner * gs.lunarChickens.lunar * 1;
    baseDps += gs.lunarChickens.alien * 0.1; // Alien chickens produce a flat rate
    // Add cosmicDustFilter bonus
    baseDps *= (1 + gs.lunarUpgrades.cosmicDustFilter * 0.10); 
    return baseDps;
};

/**
 * Calculates Dark Matter per click for lunar operations.
 * @param {object} gs - The game state.
 * @returns {number} DM/c.
 */
export const getMoonDarkMatterPerClick = (gs) => {
    let baseDpc = CONFIG.DARK_MATTER_PER_CLICK + gs.lunarUpgrades.gravStabilizer * 1;
    return baseDpc;
};

/**
 * Calculates the cost to prestige.
 * @param {object} gs - The game state.
 * @returns {number} Cost in eggs.
 */
export function getPrestigeCost(gs) {
    const baseCost = CONFIG.PRESTIGE_COST;
    const prestigeCount = gs.prestigeCount || 0;
    return baseCost * Math.pow(2, prestigeCount);
}

/**
 * Attempts to dig up an artifact.
 * @param {object} gs - The game state.
 * @returns {object|null} The found artifact object or null.
 */
export function tryDigArtifact(gs) {
    if (Math.random() < CONFIG.ARTIFACT_DIG_CHANCE) {
        const available = Object.keys(CONFIG.ARTIFACTS).filter(id => !gs.artifacts.includes(id));
        if (available.length > 0) {
            const id = available[Math.floor(Math.random() * available.length)];
            gs.artifacts.push(id);
            return CONFIG.ARTIFACTS[id];
        }
    }
    return null;
}

/**
 * Checks and unlocks achievements.
 * @param {object} gameState - The game state.
 * @param {function} [callback] - Optional callback for notifications.
 * @returns {boolean} True if any achievement was unlocked.
 */
export function checkAchievements(gameState, callback) {
    let unlockedAny = false;
    Object.keys(achievements).forEach(id => {
        if (!gameState.unlockedAchievements.includes(id) && achievementConditions[id](gameState)) {
            gameState.unlockedAchievements.push(id);
            unlockedAny = true;
            const ach = achievements[id];
            if (!ach.noToast && callback) callback(ach.name);
        }
    });
    return unlockedAny;
}