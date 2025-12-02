import { getEggsPerSecond } from './logic.js';
import { initialGameState } from './state.js';
import { deepMerge } from './utils.js';

describe('Endgame Mechanics', () => {
    let mockState;

    beforeEach(() => {
        mockState = deepMerge({}, initialGameState);
        mockState.upgrades.worker = 1;
        mockState.chickens.leghorn = 1;
    });

    test('Quantum Clucker multiplies EPS by achievement count', () => {
        const baseEPS = getEggsPerSecond(mockState);
        
        mockState.chickens.quantum = 1;
        mockState.unlockedAchievements = ['ach1', 'ach2', 'ach3']; // 3 achievements
        
        // Bonus formula: (1 + (3 * 0.1))^1 = 1.3x multiplier
        // But getAchievementBonus adds +0.03 (1.03x) as well.
        // Let's isolate quantum effect by assuming 0 achievements for base comparison or doing the math.
        
        const newEPS = getEggsPerSecond(mockState);
        
        // 1 Quantum Chicken with 3 achievements = 1.3x bonus to the (already achievement-boosted) EPS.
        // Base EPS (1) * AchBonus (1.0 - since 'ach1' etc don't exist in config) * Quantum (1.3) = 1.3
        expect(newEPS).toBeCloseTo(1.3, 3);
    });

    test('Event Horizon scales with Prestige Count', () => {
        mockState.upgrades.eventHorizon = 1;
        mockState.prestigeCount = 100;
        
        // Bonus: 1 + (1 * 0.01 * 100) = 1 + 1 = 2x multiplier
        const eps = getEggsPerSecond(mockState);
        
        // Base 1 * 2 = 2
        expect(eps).toBe(2);
    });
});
