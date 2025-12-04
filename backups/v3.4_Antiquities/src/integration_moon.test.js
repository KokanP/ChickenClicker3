import { getMoonDarkMatterPerSecond, getMoonDarkMatterPerClick } from './logic.js';
import { initialGameState } from './state.js';
import { deepMerge } from './utils.js';
import { CONFIG } from './config.js';

describe('Lunar Economy Logic', () => {
    let mockState;

    beforeEach(() => {
        mockState = deepMerge({}, initialGameState);
        mockState.activeScene = 'moon';
        // Ensure lunar objects exist (deepMerge might not handle nested undefineds if initialGameState is minimal)
        if (!mockState.lunarUpgrades) mockState.lunarUpgrades = { moonMiner: 0, gravStabilizer: 0, cosmicDustFilter: 0, temporalAccelerator: 0 };
        if (!mockState.lunarChickens) mockState.lunarChickens = { lunar: 0, alien: 0 };
    });

    test('getMoonDarkMatterPerSecond calculates base production correctly', () => {
        // Base: moonMiner * lunarChicken * 1
        mockState.lunarUpgrades.moonMiner = 10;
        mockState.lunarChickens.lunar = 5;
        // 10 * 5 * 1 = 50 DM/s
        // Alien is 0
        // Cosmic Filter is 0 (multiplier 1)
        expect(getMoonDarkMatterPerSecond(mockState)).toBe(50);
    });

    test('getMoonDarkMatterPerSecond returns 0 if no chickens/miners and no aliens', () => {
        mockState.lunarUpgrades.moonMiner = 10;
        mockState.lunarChickens.lunar = 0;
        expect(getMoonDarkMatterPerSecond(mockState)).toBe(0);

        mockState.lunarUpgrades.moonMiner = 0;
        mockState.lunarChickens.lunar = 5;
        expect(getMoonDarkMatterPerSecond(mockState)).toBe(0);
    });

    test('getMoonDarkMatterPerSecond applies Alien Clucker bonus', () => {
        // Alien Clucker adds 0.1 per chicken
        mockState.lunarChickens.alien = 10;
        // 10 * 0.1 = 1 DM/s
        expect(getMoonDarkMatterPerSecond(mockState)).toBeCloseTo(1.0);
    });

    test('getMoonDarkMatterPerSecond applies Cosmic Dust Filter multiplier', () => {
        // Base: 50 (from first test)
        mockState.lunarUpgrades.moonMiner = 10;
        mockState.lunarChickens.lunar = 5;
        
        // Filter: +10% per level
        mockState.lunarUpgrades.cosmicDustFilter = 2; // +20% => 1.2x
        
        // 50 * 1.2 = 60
        expect(getMoonDarkMatterPerSecond(mockState)).toBeCloseTo(60);
    });

    test('getMoonDarkMatterPerClick calculates base click correctly', () => {
        // Base DM per click is CONFIG.DARK_MATTER_PER_CLICK (assuming 2 from logic code reading earlier, but let's check via import if needed, or just rely on logic.js reading which saw CONFIG usage)
        // Actually the logic.js snippet I read: "let baseDpc = CONFIG.DARK_MATTER_PER_CLICK + ..."
        // I'll assume it's 2 based on my previous `search_file_content`
        
        expect(getMoonDarkMatterPerClick(mockState)).toBe(CONFIG.DARK_MATTER_PER_CLICK);

        mockState.lunarUpgrades.gravStabilizer = 5;
        // Base + 5
        expect(getMoonDarkMatterPerClick(mockState)).toBe(CONFIG.DARK_MATTER_PER_CLICK + 5);
    });
});