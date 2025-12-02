// src/utils.js

/**
 * Formats a number into a human-readable string with suffixes.
 * @param {number} num - The number to format.
 * @returns {string} The formatted string (e.g., "1.23M").
 */
export function formatNumber(num) {
    if (num === null || isNaN(num) || !isFinite(num)) return '0';
    if (num < 1000) return num.toFixed(0);
    const suffixes = [
        "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", 
        "Ud", "Dd", "Td", "Qd", "Qn", "Sd", "St", "Od", "Nd", "Vg"
    ];
    const i = Math.floor(Math.log10(num) / 3);
    if (i >= suffixes.length) return num.toExponential(2);
    return (num / Math.pow(1000, i)).toFixed(2) + suffixes[i];
}

/**
 * Calculates the cost of an item based on its base cost, current level, and exponent.
 * applies discount buff if active.
 * @param {number} base - The base cost.
 * @param {number} level - The current level.
 * @param {number} exponent - The cost exponent.
 * @param {object} gameState - The current game state (for buffs).
 * @returns {number} The calculated cost.
 */
export function calculateCost(base, level, exponent = 1.15, gameState) {
    let cost = Math.floor(base * Math.pow(exponent, level));
    if (gameState && gameState.activeBuffs && gameState.activeBuffs.discount) {
        cost = Math.floor(cost * (1 - gameState.activeBuffs.discount.value));
    }
    return cost;
}

/**
 * Deeply merges two objects.
 * @param {object} target - The target object.
 * @param {object} source - The source object.
 * @returns {object} The merged object.
 */
export function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) Object.assign(output, { [key]: source[key] });
                else output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

/**
 * Checks if a value is an object (and not an array or null).
 * @param {*} item - The value to check.
 * @returns {boolean} True if the value is an object.
 */
export function isObject(item) {
    return !!(item && typeof item === 'object' && !Array.isArray(item));
}
