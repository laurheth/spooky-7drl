import { Assets } from "pixi.js";

/**
 * Helper file for preloading assets
 */
const assetPrefix = "";

const tilePrefix = "tiles/";
const tileList = [
    "testFloor",
    "testWall",
    "testDoor",
    "redDoor",
    "yellowDoor",
    "blueDoor",
    "stairsDown",
    "badBricks",
    "badConcrete",
]

const spritePrefix = "sprites/";
const spriteList = [
    "murderChair",
    "sofaBeast",
    "testBigCritter",
    "testSword",
    "bandaid",
    "medkit",
    "yellowKey",
    "blueKey",
    "redKey",
    "bomb",
    "bombLit",
    "box",
    "bookShelf",
    "cabinet",
    "alanWrench",
    "chainsaw",
    "hammer",
    "hero",
]

const decorationsPrefix = "decoration/";
const decorationList = [
    "bloodPool",
]

const suffix = ".png";

async function preloadAssets() {
    // Tiles
    for (const tile of tileList) {
        await Assets.load(`${assetPrefix}${tilePrefix}${tile}${suffix}`);
    }

    // Sprites
    for (const sprite of spriteList) {
        await Assets.load(`${assetPrefix}${spritePrefix}${sprite}${suffix}`);
    }

    // Decorations
    for (const decoration of decorationList) {
        await Assets.load(`${assetPrefix}${decorationsPrefix}${decoration}${suffix}`);
    }
}

export default preloadAssets;
