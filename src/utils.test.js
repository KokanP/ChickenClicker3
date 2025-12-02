import { formatNumber, calculateCost, deepMerge, isObject } from './utils.js';

describe('Utils', () => {
    test('formatNumber formats correctly', () => {
        expect(formatNumber(0)).toBe('0');
        expect(formatNumber(100)).toBe('100');
        expect(formatNumber(1000)).toBe('1.00K');
        expect(formatNumber(1500)).toBe('1.50K');
        expect(formatNumber(1000000)).toBe('1.00M');
    });

    test('calculateCost calculates standard cost', () => {
        // Base 10, Level 0, Exp 1.15
        expect(calculateCost(10, 0, 1.15, {})).toBe(10);
        // Base 10, Level 1, Exp 1.15 -> 10 * 1.15^1 = 11.5 -> 11
        expect(calculateCost(10, 1, 1.15, {})).toBe(11);
    });

    test('calculateCost applies discount', () => {
        const gameState = {
            activeBuffs: {
                discount: { value: 0.5, duration: 10 }
            }
        };
        // Base 100 -> 50
        expect(calculateCost(100, 0, 1.15, gameState)).toBe(50);
    });

    test('deepMerge merges objects correctly', () => {
        const target = { a: 1, b: { c: 2 } };
        const source = { b: { d: 3 }, e: 4 };
        const result = deepMerge(target, source);
        
        expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
        expect(target).toEqual({ a: 1, b: { c: 2 } }); // Should not mutate target
    });

    test('isObject identifies objects', () => {
        expect(isObject({})).toBe(true);
        expect(isObject([])).toBe(false);
        expect(isObject(null)).toBe(false);
        expect(isObject(1)).toBe(false);
    });
});
