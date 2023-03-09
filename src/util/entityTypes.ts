import { Sprite } from "pixi.js"
import { default as Entity, ActionTypes, EntityFlags } from "../classes/Entity"
import Item from "../classes/Item"
import MapHandler from "../classes/MapHandler"

/**
 * Data object full of critter types
 */
export type CritterAction = "randomStep" | "walkToTarget" | "pathToTarget" | "patrol" | "pause";

export const critterTypes = {
    chair: {
        name: "the possessed chair",
        spriteName: "sprites/murderChair.png",
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
        unseenSounds: ["You hear the sound of wood scraping on the floor."] as string[],
        seenSounds: [] as string[],
        volume: 1,
    },
    bigBad: {
        name: "the Sofa of Eternity",
        spriteName: "sprites/sofaBeast.png",
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
        unseenSounds: ["You hear a horrible howling sound!", "A cold chill runs through your bones!", "The sounds of a thousand tiny footsteps echo through the halls!", "You hear the sound of creaking wood!"] as string[],
        seenSounds: ["The Sofa of Eternity howls!", "The Sofa Beast beckons you!", "The cushions rise and a horrible tongue slurps!", "The Sofa's thousand feet scamper furiously!"] as string[],
        volume: 4,
    }
};

/**
 * Generator for objects on the map
 */
export function objectFactory(position:{x:number, y:number, z:number}, typeName:string, mapHandler:MapHandler): Entity {
    switch(typeName) {
        case "cabinet":
            return new Entity({
                name: "cabinet",
                sprite: Sprite.from("sprites/cabinet.png"),
                mapHandler: mapHandler,
                blocksVision: false,
                ...position,
                acts: true,
                actPeriod: 200,
                actionTypes:["push"],
                hp: 1,
                removeOnDeath: true,
            })
        case "box":
            return new Entity({
                name: "box",
                sprite: Sprite.from("sprites/box.png"),
                mapHandler: mapHandler,
                blocksVision: false,
                ...position,
                acts: true,
                actPeriod: 200,
                actionTypes:["push"],
                hp: 1,
                removeOnDeath: true,
            })
        case "bookshelf":
            return new Entity({
                name: "bookshelf",
                sprite: Sprite.from("sprites/bookShelf.png"),
                mapHandler: mapHandler,
                blocksVision: false,
                ...position,
                acts: true,
                actPeriod: 200,
                actionTypes:["push"],
                hp: 1,
                removeOnDeath: true,
            })
        case "door":
            return new Entity({
                name: "door",
                sprite: Sprite.from("tiles/testDoor.png"),
                mapHandler: mapHandler,
                blocksVision: true,
                ...position,
                acts: true,
                actPeriod: 5000,
                actionTypes:["open"],
                hp: 1,
                removeOnDeath: true,
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
                hp: 1,
                needsKey: "red key",
                removeOnDeath: true,
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
                hp: 1,
                needsKey: "blue key",
                removeOnDeath: true,
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
                hp: 1,
                needsKey: "yellow key",
                removeOnDeath: true,
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
                name: "big knife",
                equippable: true,
                strength: 10,
                attackString: "slash",
                durability: 5 + 10 * Math.random(),
                durabilityRate: 0.5,
            });
        case "hammer":
            return new Item({
                sprite: Sprite.from("sprites/hammer.png"),
                mapHandler: mapHandler,
                ...position,
                name: "hammer",
                equippable: true,
                strength: 15,
                attackString: "smash",
                durability: 5 + 10 * Math.random(),
                durabilityRate: 0.33,
            });
        case "hex key":
            return new Item({
                sprite: Sprite.from("sprites/alanWrench.png"),
                mapHandler: mapHandler,
                ...position,
                name: "hex key",
                equippable: true,
                strength: 8,
                attackString: "unscrew",
                durability: 5 + 10 * Math.random(),
                durabilityRate: 0.33,
            });
        case "chainsaw":
            return new Item({
                sprite: Sprite.from("sprites/chainsaw.png"),
                mapHandler: mapHandler,
                ...position,
                name: "chainsaw",
                equippable: true,
                strength: 30,
                attackString: "chainsaw",
                durability: 10 + 2 * Math.random(),
                durabilityRate: 0.01,
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
        case "bomb":
            return new Item({
                sprite: Sprite.from("sprites/bomb.png"),
                mapHandler: mapHandler,
                ...position,
                name: "bomb",
                equippable: false,
                strength: 0,
                attackString: "no",
                durability: 1,
                durabilityRate: 0,
                useAction: {
                    type: "bomb",
                    value: "50,8,3100"
                },
                alternateSprite: Sprite.from("sprites/bombLit.png")
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
