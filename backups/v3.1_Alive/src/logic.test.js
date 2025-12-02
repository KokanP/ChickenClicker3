import { getEggsPerSecond, getEggsPerClick, getPrestigeCost } from './logic.js';
import { initialGameState } from './state.js';
import { deepMerge } from './utils.js';
import { CONFIG } from './config.js';

describe('Game Logic', () => {
    let mockState;

    beforeEach(() => {
        mockState = deepMerge({}, initialGameState);
    });

    test('getEggsPerSecond calculates base EPS correctly', () => {
        mockState.upgrades.worker = 10;
        mockState.chickens.leghorn = 5;
        // 10 workers * 5 chickens * 1 base = 50 EPS
        expect(getEggsPerSecond(mockState)).toBe(50);
    });

    test('getEggsPerSecond applies multipliers', () => {
        mockState.upgrades.worker = 10;
        mockState.chickens.leghorn = 5;
        mockState.permanentBonus = 2; // 100% bonus
        // 50 * 2 = 100 EPS
        expect(getEggsPerSecond(mockState)).toBe(100);
    });

    test('getEggsPerClick calculates base EPC correctly', () => {
        mockState.upgrades.incubator = 0;
        // Base 1
        expect(getEggsPerClick(mockState)).toBe(1);

        mockState.upgrades.incubator = 5;
        // Base 1 + 5 = 6
        expect(getEggsPerClick(mockState)).toBe(6);
    });

    test('getPrestigeCost scales correctly', () => {
        const base = CONFIG.PRESTIGE_COST;
        mockState.prestigeCount = 0;
        expect(getPrestigeCost(mockState)).toBe(base);

        mockState.prestigeCount = 1;
        expect(getPrestigeCost(mockState)).toBe(base * 2);

        mockState.prestigeCount = 2;
        expect(getPrestigeCost(mockState)).toBe(base * 4);
    });
});
