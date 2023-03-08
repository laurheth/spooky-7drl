import { Sprite } from "pixi.js"
import { default as Entity, ActionTypes, EntityFlags } from "../classes/Entity"
import Item from "../classes/Item"
import MapHandler from "../classes/MapHandler"

/**
 * Data object full of critter types
 */
export type CritterAction = "randomStep" | "walkToTarget" | "pathToTarget" | "patrol" | "pause";

export const critterTypes = {
    testCritter: {
        name: "the test critter",
        spriteName: "sprites/testCritter.png",
        hp: 50,
        actPeriod: 600,
        movePeriod: 200,
        idleActions: ["randomStep", "pause"] as CritterAction[],
        activeActions: ["walkToTarget"] as CritterAction[],
        awareness: 0.5,
        persistence: 10,
        actionTypes: ["violence"] as ActionTypes[],
        entityFlags: [] as EntityFlags[],
        strength: 10,
    },
    bigBad: {
        name: "the Undying Spirit of Friday",
        spriteName: "sprites/testBigCritter.png",
        hp: Infinity,
        actPeriod: 400,
        movePeriod: 400,
        idleActions: ["patrol"] as CritterAction[],
        activeActions: ["pathToTarget"] as CritterAction[],
        awareness: 1,
        persistence: 20,
        actionTypes: ["violence"] as ActionTypes[],
        entityFlags: ["important", "big"] as EntityFlags[],
        strength: 20,
    }
};

/**
 * Generator for objects on the map
 */
export function objectFactory(position:{x:number, y:number, z:number}, typeName:string, mapHandler:MapHandler): Entity {
    switch(typeName) {
        case "door":
            return new Entity({
                name: "door",
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
                strength: 10,
                attackString: "slash",
                durability: 5 + 10 * Math.random(),
                durabilityRate: 0.5,
            })
    }
}
