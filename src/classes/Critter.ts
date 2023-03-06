import { Sprite } from "pixi.js"
import Entity from "./Entity"
import MapHandler from "./MapHandler"
import { critterTypes } from "../util/entityTypes"

interface CritterParams {
    critterType: keyof typeof critterTypes;
    mapHandler: MapHandler;
    x: number;
    y: number;
    z: number;
}

/**
 * An AI entity that moves around, does stuff, is mean to the player sometimes.
 */
class Critter extends Entity {
    constructor({critterType, ...rest}:CritterParams) {
        const critterDetails = critterTypes[critterType];
        super({
            sprite: critterDetails.sprite,
            hp: critterDetails.hp,
            acts: true,
            ...rest
        });
    }

    async act() {
        const dx = Math.floor(Math.random() * 3 - 1);
        const dy = Math.floor(Math.random() * 3 - 1);
        this.step(dx, dy, 0);
    }
}

export default Critter;
