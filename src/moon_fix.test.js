import { CONFIG } from './config.js';

describe('Moon Bug Fix Verification', () => {
    test('Lunar Hen should cost Dark Matter', () => {
        const lunarHen = CONFIG.LUNAR_CHICKENS.lunar;
        expect(lunarHen.currency).toBe('darkMatter');
    });

    test('Lunar Hen base cost should be 1000', () => {
        const lunarHen = CONFIG.LUNAR_CHICKENS.lunar;
        expect(lunarHen.baseCost).toBe(1000);
    });
});
