import { Sprite } from "pixi.js"

interface CritterType {
    sprite: Sprite;
    hp: number;
}

export const critterTypes = {
    testCritter: {
        sprite: Sprite.from("sprites/testCritter.png"),
        hp: 100
    }
};
