import { Assets } from "pixi.js";

/**
 * Helper file for preloading assets
 */
const assetPrefix = "";

const tilePrefix = "tiles/";
const tileList = [
    "testFloor",
    "testWall",
]

const spritePrefix = "sprites/";
const spriteList = [
    "testFace",
    "testCritter",
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
}

export default preloadAssets;
