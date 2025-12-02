// src/state.js

export const initialGameState = {
    nickname: null, eggs: 0, totalEggs: 0, feathers: 0, totalFeathers: 0, totalClicks: 0,
    upgrades: {
        worker: 0, incubator: 0, loom: 0, featherForecast: 0, eggstraClicks: 0, 
        cluckworkAutomation: 0, peckingOrder: 0, nestEggIRA: 0, fowlLanguage: 0,
        goldenCompass: 0, comfyCoopBedding: 0, prismaticFeed: 0, eventHorizon: 0
    },
    chickens: { 
        leghorn: 1, silkie: 0, rooster: 0, orpington: 0, wyandotte: 0, doja: 0,
        brahma: 0, serama: 0, banty: 0, quantum: 0
    },
    unlockedAchievements: [], reputation: 0, timePlayed: 0, failedBuys: 0, licenseClicked: false,
    goldenChickensClicked: 0, prestigeCount: 0, resets: 0,
    eagleClicks: 0, foxClicks: 0, badgerClicks: 0, umbrellaClicks: 0,
    artifacts: [],
    unlockedSkins: ['default'], // Default skin is always unlocked
    skin: 'default',
    event: { active: false, type: null, duration: 0, modifier: 1 },
    activeBuffs: {}, permanentBonus: 1, clickedColoredEggs: {},
    oracleTimer: 0,
    lastSuperClickTime: 0, superClickChain: 0, modalOpens: 0, timeSinceLastClick: 0,
    firstInsultFired: false,
    prestigeUpgrades: { ancestralBlueprints: 0 },
};
