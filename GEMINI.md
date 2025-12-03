# Project: Chicken Clicker 3

**Status:** v3.3 (The Cosmic Expansion) - **BROKEN / UNPLAYABLE**
**Stack:** Vanilla HTML/CSS/JS (Bundled with esbuild, Tested with Jest)

## **Current Critical Issues**
*   **Game Freeze:** The game loads, but no logic is running.
*   **UI Unresponsive:** No buttons (Menu, Upgrades, Help, Scene Switcher) are clickable or functional.
*   **Diorama Missing:** New visual assets (Rooster, Doja, etc.) are not rendering.
*   **Animation Only:** Only the "Chicken Clicker" title cloud animation is working.
*   **Root Cause Suspect:** Potential issue with `script.js` bundling, `initialGameState` hydration, or a syntax error in the main loop blocking execution.

---

## **Recent Changes (v3.3 - The Cosmic Expansion)**

### **Content Additions**
*   **New Units/Upgrades:**
    *   **Void Chicken:** Cost `1e54`, massive `1e45` base EPS.
    *   **Quantum Egg Theory:** Cost `1e42`, boosts Quantum Cluckers.
    *   **Space Program:** Cost `1e9`, unlocks Moon access.
    *   **Temporal Accelerator:** Lunar upgrade, boosts global EPS.
*   **Visual Assets:** Added pixel-art SVGs for Rooster, Doja Cow, Brahma, Oracle, Loom, Weathervane, Piggybank, Cluckwork Arm.
*   **Animations:** Added spinning (weathervane) and floating (oracle) animations.

### **UI & UX**
*   **Split Menu:** Top Bar (Meta/Info) and Bottom Bar (Game Actions).
*   **Guide:** Restored "Farmer's Guide" with spoiler-free progression.
*   **Achievements:** Redesigned into a grid layout with visual states (Locked/Unlocked/Secret).
*   **Interactive Events:** Added visual feedback (scale/fade) and "Guide Updated" toasts on click.
*   **Help Icon:** Moved to a floating pixel-art "?" in the top right.

### **Balance**
*   **Progression:** Smoothed curves around `1e44` and `1e60` eggs.
*   **Events:** Reduced frequency to 2 minutes; increased Artifact drop rate to 1/1000.
*   **Prestige:** Event Horizon scaling buffed to 2%.

---

## **Technical Notes**
*   **State:** `src/state.js` was updated to include new keys (`voidChicken`, `spaceProgram`, etc.) to prevent `NaN` errors.
*   **Build:** `npm run build` is passing.
*   **Tests:** `npm test` is passing (60/60).

**Action Required:** Immediate debugging of the runtime initialization and event loop.