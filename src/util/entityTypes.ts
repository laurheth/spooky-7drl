import { Sprite } from "pixi.js"
import Entity from "../classes/Entity"
import Item from "../classes/Item"
import MapHandler from "../classes/MapHandler"

/**
 * Data object full of critter types
 */
export type CritterAction = "randomStep" | "walkToTarget" | "pathToTarget" | "patrol" | "pause";

export const critterTypes = {
    testCritter: {
        spriteName: "sprites/testCritter.png",
        hp: 100,
        actPeriod: 600,
        movePeriod: 100,
        idleActions: ["randomStep", "pause"] as CritterAction[],
        activeActions: ["walkToTarget"] as CritterAction[],
        awareness: 0.5,
        persistence: 10,
    }
};

/**
 * Generator for objects on the map
 */
export function objectFactory(position:{x:number, y:number, z:number}, typeName:string, mapHandler:MapHandler): Entity {
    switch(typeName) {
        case "door":
            return new Entity({
                sprite: Sprite.from("tiles/testDoor.png"),
                mapHandler: mapHandler,
                blocksVision: true,
                ...position,
                acts: true,
                actPeriod: 5000,
                actionTypes:["open"]
            })
    }
    return null;
}

export function itemFactory(position:{x:number, y:number, z:number}, typeName:string, mapHandler:MapHandler): Item {
    switch(typeName) {
        case "sword":
            return new Item({
                sprite: Sprite.from("sprites/testSword.png"),
                mapHandler: mapHandler,
                ...position,
                name: "sword",
                equippable: true,
            })
    }
}
