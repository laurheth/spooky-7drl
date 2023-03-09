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
        unseenSounds: [] as string[],
        seenSounds: [] as string[],
        volume: 1,
    },
    bigBad: {
        name: "the Undying Spirit of Friday",
        spriteName: "sprites/testBigCritter.png",
        hp: 100,
        actPeriod: 400,
        movePeriod: 400,
        idleActions: ["patrol"] as CritterAction[],
        activeActions: ["pathToTarget"] as CritterAction[],
        awareness: 1,
        persistence: 20,
        actionTypes: ["violence"] as ActionTypes[],
        entityFlags: ["important", "big", "undying"] as EntityFlags[],
        strength: 20,
        unseenSounds: ["You hear the sound of wailing!", "A cold chill runs through your bones!", "Screaming echos through the halls!"] as string[],
        seenSounds: ["The spectre howls!", "The ghostly sounds echo in your mind!", "The ghost lets out a wretched wail!"] as string[],
        volume: 4,
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
        case "red door":
            return new Entity({
                name: "red door",
                sprite: Sprite.from("tiles/redDoor.png"),
                mapHandler: mapHandler,
                blocksVision: true,
                ...position,
                acts: true,
                actPeriod: 5000,
                actionTypes:["unlock"],
                needsKey: "red key",
            })
        case "blue door":
            return new Entity({
                name: "blue door",
                sprite: Sprite.from("tiles/blueDoor.png"),
                mapHandler: mapHandler,
                blocksVision: true,
                ...position,
                acts: true,
                actPeriod: 5000,
                actionTypes:["unlock"],
                needsKey: "blue key",
            })
        case "yellow door":
            return new Entity({
                name: "yellow door",
                sprite: Sprite.from("tiles/yellowDoor.png"),
                mapHandler: mapHandler,
                blocksVision: true,
                ...position,
                acts: true,
                actPeriod: 5000,
                actionTypes:["unlock"],
                needsKey: "yellow key",
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
            });
        case "bandaid":
            return new Item({
                sprite: Sprite.from("sprites/bandaid.png"),
                mapHandler: mapHandler,
                ...position,
                name: "bandage",
                equippable: false,
                strength: 0,
                attackString: "slash",
                durability: 1,
                durabilityRate: 0,
                useAction: {
                    type: "heal",
                    value: 25
                }
            });
        case "medkit":
            return new Item({
                sprite: Sprite.from("sprites/medkit.png"),
                mapHandler: mapHandler,
                ...position,
                name: "first aid kit",
                equippable: false,
                strength: 0,
                attackString: "no",
                durability: 1,
                durabilityRate: 0,
                useAction: {
                    type: "heal",
                    value: 50
                }
            });
        case "yellow key":
        case "blue key":
        case "red key":
            const spritePath = `${typeName.split(' ')[0]}Key.png`;
            return new Item({
                sprite: Sprite.from(`sprites/${spritePath}`),
                mapHandler: mapHandler,
                ...position,
                name: typeName,
                equippable: false,
                strength: 0,
                attackString: "no",
                durability: 1,
                durabilityRate: 0,
                useAction: {
                    type: "key",
                    value: typeName
                }
            });
    }
}
