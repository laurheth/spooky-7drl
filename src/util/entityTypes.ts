import { Sprite } from "pixi.js"
import { default as Entity, ActionTypes, EntityFlags } from "../classes/Entity"
import Item from "../classes/Item"
import MapHandler from "../classes/MapHandler"

/**
 * Data object full of critter types
 */
export type CritterAction = "randomStep" | "walkToTarget" | "pathToTarget" | "patrol" | "pause" | "pathToHome" | "fireToTarget" | "healFriends" | "runFromTarget";

interface CritterDetails {
    name: string;
    spriteName: string;
    awakeSpriteName?: string;
    corpseObject?: string;
    dropItem?: string;
    hp: number;
    actPeriod: number;
    movePeriod: number;
    idleActions: CritterAction[];
    activeActions: CritterAction[];
    awareness: number;
    persistence: number;
    actionTypes: ActionTypes[];
    entityFlags: EntityFlags[];
    strength: number;
    unseenSounds?: string[];
    seenSounds?: string[];
    volume?: number;
}

export const critterTypes:{[key:string]:CritterDetails} = {
    lamp: {
        name: "the eldritch lamp",
        spriteName: "sprites/lamp.png",
        awakeSpriteName: "sprites/demonLamp.png",
        corpseObject: "lamp",
        hp: 33,
        actPeriod: 250,
        movePeriod: 250,
        idleActions: ["pause"] as CritterAction[],
        activeActions: ["walkToTarget"] as CritterAction[],
        awareness: 0.05,
        persistence: 20,
        actionTypes: ["violence"] as ActionTypes[],
        entityFlags: [] as EntityFlags[],
        strength: 7,
        unseenSounds: [] as string[],
        seenSounds: [] as string[],
        volume: 1,
    },
    exit: {
        name: "the Guardian of the Exit",
        spriteName: "sprites/exit1.png",
        awakeSpriteName: "sprites/exit2.png",
        corpseObject: "exit",
        hp: 210,
        actPeriod: 350,
        movePeriod: 350,
        idleActions: ["pause"] as CritterAction[],
        activeActions: ["pathToTarget"] as CritterAction[],
        awareness: -1,
        persistence: Infinity,
        actionTypes: ["violence"] as ActionTypes[],
        entityFlags: ["important","big"] as EntityFlags[],
        strength: 20,
        unseenSounds: ["A palpable sense of hopelessness fills the air."] as string[],
        seenSounds: ["The Guardian lets out a horrible scream.","The Guardian of the Exit salivates.", "The Guardian's breath make the air feel thick."] as string[],
        volume: 5,
    },
    tv: {
        name: "the wrong tv",
        spriteName: "sprites/tv.png",
        hp: 200,
        actPeriod: 1000,
        movePeriod: 200,
        idleActions: ["pathToHome"] as CritterAction[],
        activeActions: ["walkToTarget"] as CritterAction[],
        awareness: 1,
        persistence: 10,
        actionTypes: ["violence"] as ActionTypes[],
        entityFlags: [] as EntityFlags[],
        strength: 33,
        unseenSounds: ["You hear the sound of static.", "You hear a high pitched sound, on the edge of human hearing."] as string[],
        seenSounds: ["In the sound of static you can hear about how you never succeeded in your dreams.", "The static whispers to you about the futility of life.", "The static tells you to come closer.", "The static feels like it is emanating from within your own mind.", "All feelings of hope are washed away by the static."] as string[],
        volume: 3,
    },
    kallax: {
        name: "the unsupported kallax",
        spriteName: "sprites/kallax.png",
        hp: 40,
        actPeriod: 600,
        movePeriod: 300,
        idleActions: ["randomStep", "pause"] as CritterAction[],
        activeActions: ["fireToTarget"] as CritterAction[],
        awareness: 0.5,
        persistence: 10,
        actionTypes: ["violence"] as ActionTypes[],
        entityFlags: [] as EntityFlags[],
        strength: 5,
        unseenSounds: ["You hear the sound of wood scraping on the floor."] as string[],
        seenSounds: ["You you smell brimstone coming from the kallax!"] as string[],
        volume: 1,
    },
    healer: {
        name: "the hexed key",
        spriteName: "sprites/healer.png",
        hp: 50,
        actPeriod: 300,
        movePeriod: 200,
        idleActions: ["healFriends"] as CritterAction[],
        activeActions: ["runFromTarget"] as CritterAction[],
        dropItem: "hex key",
        awareness: 1,
        persistence: 10,
        actionTypes: ["violence"] as ActionTypes[],
        entityFlags: [] as EntityFlags[],
        strength: 5,
        unseenSounds: [] as string[],
        seenSounds: [] as string[],
        volume: 1,
    },
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
    rolly: {
        name: "the possessed computer chair",
        spriteName: "sprites/rollyChair.png",
        hp: 40,
        actPeriod: 350,
        movePeriod: 200,
        idleActions: ["randomStep", "pause"] as CritterAction[],
        activeActions: ["walkToTarget"] as CritterAction[],
        awareness: 0.5,
        persistence: 10,
        actionTypes: ["push", "violence"] as ActionTypes[],
        entityFlags: [] as EntityFlags[],
        strength: 10,
        unseenSounds: ["You hear the sound of wheels rolling on the ground."] as string[],
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
        case "exit":
            return new Entity({
                name: "exit",
                sprite: Sprite.from("sprites/exit3.png"),
                mapHandler: mapHandler,
                blocksVision: false,
                ...position,
                acts: true,
                actPeriod: 200,
                actionTypes:["win"],
                hp: Infinity,
            })
        case "lamp":
            return new Entity({
                name: "lamp",
                sprite: Sprite.from("sprites/lamp.png"),
                mapHandler: mapHandler,
                blocksVision: false,
                ...position,
                acts: true,
                actPeriod: 200,
                actionTypes:["push"],
                hp: 1,
                removeOnDeath: true,
            })
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
                hp: 20,
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
                hp: 20,
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
                hp: 20,
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
                hp: 20,
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
