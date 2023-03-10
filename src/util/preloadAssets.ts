import { Assets } from "pixi.js";

/**
 * Helper file for preloading assets
 */
const assetPrefix = "";

const tilePrefix = "tiles/";
const tileList:string[] = [
    // "testFloor",
    // "testWall",
    // "testDoor",
    // "redDoor",
    // "yellowDoor",
    // "blueDoor",
    // "stairsDown",
    // "badBricks",
    // "badConcrete",
]

const spritePrefix = "sprites/";
const spriteList:string[] = [
    // "murderChair",
    // "rollyChair",
    // "sofaBeast",
    // "testSword",
    // "bandaid",
    // "medkit",
    // "yellowKey",
    // "blueKey",
    // "redKey",
    // "bomb",
    // "bombLit",
    // "box",
    // "bookShelf",
    // "cabinet",
    // "alanWrench",
    // "chainsaw",
    // "hammer",
    // "hero",
    // "lamp",
    // "demonLamp",
    // "tv",
    // "exit1",
    // "exit2",
    // "exit3",
    // "kallax",
    // "fireball",
    // "healer",
    "note",
]

const decorationsPrefix = "decoration/";
const decorationList:string[] = [
    // "bloodPool",
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
    await Assets.load("spriteSheet.json");
}

export default preloadAssets;
