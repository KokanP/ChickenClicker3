import { getArtifactBonus, tryDigArtifact } from './logic.js';
import { CONFIG } from './config.js';
import { deepMerge } from './utils.js';
import { initialGameState } from './state.js';

describe('Artifact Logic', () => {
    let mockState;

    beforeEach(() => {
        mockState = deepMerge({}, initialGameState);
        // Clear artifacts for each test
        mockState.artifacts = [];
    });

    test('getArtifactBonus returns 0 when no artifacts owned', () => {
        expect(getArtifactBonus(mockState, 'click')).toBe(0);
        expect(getArtifactBonus(mockState, 'eps')).toBe(0);
    });

    test('getArtifactBonus calculates correct bonus for specific types', () => {
        // Simulate owning 'ancientKernel' (+1% Click Power)
        mockState.artifacts.push('ancientKernel');
        
        const bonus = CONFIG.ARTIFACTS.ancientKernel.value;
        
        expect(getArtifactBonus(mockState, 'click')).toBe(bonus);
        expect(getArtifactBonus(mockState, 'eps')).toBe(0); // Should not affect EPS
    });

    test('getArtifactBonus handles global bonuses', () => {
        // Simulate owning 'firstEgg' (+5% Global)
        mockState.artifacts.push('firstEgg');
        
        const bonus = CONFIG.ARTIFACTS.firstEgg.value;
        
        expect(getArtifactBonus(mockState, 'click')).toBe(bonus);
        expect(getArtifactBonus(mockState, 'eps')).toBe(bonus);
    });

    test('getArtifactBonus stacks multiple bonuses', () => {
        // ancientKernel (+0.01 click) + firstEgg (+0.05 global)
        mockState.artifacts.push('ancientKernel');
        mockState.artifacts.push('firstEgg');
        
        const expectedClick = 0.01 + 0.05;
        
        expect(getArtifactBonus(mockState, 'click')).toBeCloseTo(expectedClick, 5);
    });
});

describe('Digging Logic', () => {
    let mockState;
    const originalRandom = Math.random;

    beforeEach(() => {
        mockState = deepMerge({}, initialGameState);
        mockState.upgrades.shovel = 1; // Unlock shovel for digging tests
    });

    afterEach(() => {
        Math.random = originalRandom; // Restore random
    });

    test('tryDigArtifact returns null if random roll fails', () => {
        // Force failure (return 1.0, which is > CONFIG.ARTIFACT_DIG_CHANCE)
        Math.random = () => 1.0;
        
        const result = tryDigArtifact(mockState);
        expect(result).toBeNull();
        expect(mockState.artifacts.length).toBe(0);
    });

    test('tryDigArtifact finds an artifact if random roll succeeds', () => {
        // Force success (return 0.0)
        // We also need to mock the second random call for selecting the artifact from the list
        // Implementation uses Math.random() twice: once for chance, once for array index.
        
        let callCount = 0;
        Math.random = () => {
            callCount++;
            if (callCount === 1) return 0.0002; // Success check (Between 0.0001 and 0.0005)
            return 0.0; // Index 0
        };

        const result = tryDigArtifact(mockState);
        
        expect(result).not.toBeNull();
        expect(mockState.artifacts.length).toBe(1);
        // Since we mocked index 0, and Object.keys order is generally preserved for non-numeric keys,
        // we expect the first defined artifact.
        const firstArtifactId = Object.keys(CONFIG.ARTIFACTS)[0];
        expect(mockState.artifacts[0]).toBe(firstArtifactId);
    });

    test('tryDigArtifact does not find duplicates', () => {
        // Give player all artifacts except one
        // Exclude donatorPack from this logic as it has special finding rules
        const allIds = Object.keys(CONFIG.ARTIFACTS).filter(id => id !== 'donatorPack');
        const missingId = allIds.pop(); // Remove last one
        mockState.artifacts = [...allIds, 'donatorPack']; // Player has all others including donatorPack

        // Mock random to succeed chance (0.0002) and pick index 0 (0.0)
        let callCount = 0;
        Math.random = () => {
            callCount++;
            if (callCount === 1) return 0.0002; // Chance
            return 0.0; // Index
        };

        const result = tryDigArtifact(mockState);
        
        expect(result).not.toBeNull();
        expect(result.name).toBe(CONFIG.ARTIFACTS[missingId].name); // Should find the only missing one
        expect(mockState.artifacts.includes(missingId)).toBe(true);
    });

    test('tryDigArtifact returns null if all artifacts unlocked', () => {
        // Give player ALL artifacts
        mockState.artifacts = Object.keys(CONFIG.ARTIFACTS);

        // Force success on chance check
        Math.random = () => 0.0;

        const result = tryDigArtifact(mockState);
        
        expect(result).toBeNull(); // Nothing left to dig
        // Artifact count shouldn't change
        expect(mockState.artifacts.length).toBe(Object.keys(CONFIG.ARTIFACTS).length);
    });
});
