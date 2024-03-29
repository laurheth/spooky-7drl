import { Container, IRenderer, Sprite } from "pixi.js"
import Tile from "./Tile"
import Player from "./Player"
import Critter from "./Critter"
import Entity from "./Entity"
import Game from "./Game"
import mapGenerator from "../util/mapGenerator"
import VisionHandler from "./VisionHandler"
import Pathfinder from "./Pathfinder"
import { objectFactory, itemFactory } from "../util/entityTypes"
import getInteractable from "../util/interactables"
import Logger from "./Logger"
import UI from "./UI"
import themes from "../util/themes"
import { randomElement } from "../util/randomness"
import SoundHandler from "./SoundHandler"
import { itemNumber, monsterCountFactor, roomCountFactor } from "../util/difficultySettings"

interface MapHandlerParams {
    tileContainer: Container;
    spriteContainer: Container;
    tileScale: number;
}

interface NewMapParams {
    level: number;
    fresh?: boolean;
    difficulty: number;
}

/**
 * Class to handle everything relating to the level map. This includes tracking tiles, which sprite goes with each tile, collision, vision.
 * Map generation will start here as well, though I might split it into a separate file later.
 */
class MapHandler {
    tileContainer: Container;
    spriteContainer: Container;
    tileMap: Map<string, Tile>;
    tileScale: number;
    actors: {tick:(deltaMS:number)=>void}[] = [];
    active: boolean = false;
    visionHandler: VisionHandler;
    pathfinder: Pathfinder;
    roomCenters: number[][];

    constructor({tileContainer, spriteContainer, tileScale}:MapHandlerParams) {
        this.tileContainer = tileContainer;
        this.spriteContainer = spriteContainer;
        this.tileScale = tileScale;
        this.tileMap = new Map<string, Tile>();
        // Setup pathfinding
        this.pathfinder = new Pathfinder(([dx, dy])=>{
            return dx**2 + dy**2;
        }, ([x, y]) => {
            const options = [[-1,0],[1,0],[0,1],[0,-1]];
            return options.filter(option => {
                const optionKey = `${x+option[0]},${y+option[1]},1`;
                if (this.tileMap.has(optionKey)) {
                    const tile = this.tileMap.get(optionKey);
                    return tile.passable && (!tile.entity || !tile.entity.pathBlocking);
                } else {
                    return false;
                }
            }).map(option => [option[0] + x, option[1] + y]);
        }, ([x,y]) => {
            const key:string = `${x},${y},1`;
            if (this.tileMap.has(key)) {
                return this.tileMap.get(key).entity ? 5 : 1;
            }
            return 1;
        });
        // Setup vision
        this.visionHandler = new VisionHandler({
            range: 8,
            getTileFunction: (position) => this.getTile(position[0], position[1], position[2])
        });
    }

    // Remove the current map and reset all important values.
    clearOldMap() {
        // Clear the old tiles
        this.tileContainer.removeChildren();
        this.tileMap.clear();

        // If the player exists, preserve their sprite
        if (Game.getInstance().player) {
            this.spriteContainer.removeChild(Game.getInstance().player.sprite);
        }
        // Clear old sprites
        this.spriteContainer.removeChildren();

        // Clear actors list
        this.actors = [];

        // Clear room locations
        this.roomCenters = [];
    }

    // Generate a new map!
    generateNewMap({level, fresh, difficulty}:NewMapParams) {
        // Totally fresh game. Which means: ditch the existing Player
        if (fresh) {
            Game.getInstance().player = null;
        }
        this.clearOldMap()

        const monsterFactor = monsterCountFactor(difficulty);
        const roomFactor = roomCountFactor(difficulty);
        const itemIterations = itemNumber(difficulty);

        let generatedMap:ReturnType<typeof mapGenerator>;
        if (level === 1) {
            Logger.getInstance().sendMessage("This furniture store is cursed. Do what you must to survive, and escape this vile place!", {tone:"good", important:true});
            generatedMap = mapGenerator({
                monsterCount: 5 * monsterFactor,
                targetRoomCount: 5 * roomFactor,
                noBigGuy: true,
                itemIterations: itemIterations
            });
        } else if (level === 2) {
            Logger.getInstance().sendMessage("You've reached the second floor. Your spine tingles; you know you are not alone. Something is hunting you...", {tone:"good", important:true});
            generatedMap = mapGenerator({
                monsterCount: 7 * monsterFactor,
                targetRoomCount: 6 * roomFactor,
                bonusGoodItems: difficulty < 2 ? ["bomb"] : [],
                noBigGuy: difficulty < 2,
                itemIterations: itemIterations
            });
        } else if (level === 3) {
            Logger.getInstance().sendMessage("You've reached the third floor. The cheerful looking walls of this place mock you, for you know what lies behind them.", {tone:"good", important:true});
            generatedMap = mapGenerator({
                monsterCount: 8 * monsterFactor,
                targetRoomCount: 8 * roomFactor,
                monsterOptions: ["chair", "chair", "chair", "lamp"],
                bonusGoodItems: ["bomb"],
                noBigGuy: difficulty < 1,
                itemIterations: itemIterations
            });
        } else if (level === 4) {
            Logger.getInstance().sendMessage("You've reached the fourth floor. Office furniture is here. You hear the distant sound of wheels turning.", {tone:"good", important:true});
            generatedMap = mapGenerator({
                monsterCount: 11 * monsterFactor,
                targetRoomCount: 10 * roomFactor,
                monsterOptions: ["chair", "chair", "rolly", "lamp", "lamp"],
                bonusGoodItems: ["bomb","chainsaw"],
                itemIterations: itemIterations
            });
        } else if (level === 5) {
            Logger.getInstance().sendMessage("You've reached the fifth floor. The stench of brimstone and burnt meat fills the air.", {tone:"good", important:true});
            generatedMap = mapGenerator({
                monsterCount: 13 * monsterFactor,
                targetRoomCount: 10 * roomFactor,
                monsterOptions: ["chair","rolly","lamp","kallax"],
                bonusGoodItems: ["bomb","chainsaw"],
                itemIterations: itemIterations
            });
        } else if (level === 6) {
            Logger.getInstance().sendMessage("You've reached the sixth floor. For a moment, you saw a skittering creature at the edge of your vision, only for it to be gone a moment later.", {tone:"good", important:true});
            generatedMap = mapGenerator({
                monsterCount: 15 * monsterFactor,
                targetRoomCount: 12 * roomFactor,
                monsterOptions: ["chair", "chair", "lamp","rolly", "kallax","healer"],
                bonusGoodItems: ["bomb","chainsaw"],
                itemIterations: itemIterations
            });
        } else if (level === 7) {
            Logger.getInstance().sendMessage("You've reached the seventh floor. The sound of static fills the air.", {tone:"good", important:true});
            generatedMap = mapGenerator({
                monsterCount: 15 * monsterFactor,
                targetRoomCount: 12 * roomFactor,
                monsterOptions: ["chair", "chair", "lamp","rolly", "kallax","tv","healer"],
                bonusGoodItems: ["bomb","chainsaw"],
                itemIterations: itemIterations
            });
        } else {
            Logger.getInstance().sendMessage("You've reached the final floor. The air is just a little bit fresher here; you know you are almost free. But at what cost?", {tone:"good", important:true});
            generatedMap = mapGenerator({
                monsterCount: 12 * monsterFactor,
                targetRoomCount: 12 * roomFactor,
                bonusGoodItems: ["bomb","chainsaw","bomb"],
                monsterOptions: ["chair", "kallax", "rolly", "lamp", "tv", "healer"],
                includeWinCondition: true,
                itemIterations: itemIterations
            });
        }
        
        // Translate the generated map into tiles
        generatedMap.map.forEach((tilePlan, key) => {
            const [tx, ty] = key.split(',').map(x => parseInt(x));
            let newTile: Tile;
            const themeId = tilePlan.theme ? tilePlan.theme : 0;
            const theme = themes[themeId];
            if (tilePlan.type === '#') {
                // wall
                newTile = new Tile({
                    passable: false,
                    seeThrough: false,
                    sprite: Sprite.from(`tiles/${theme.wall}.png`), // TODO: cache sprites instead of regenerating them. Also, use a spriteSheet
                    x: tx * this.tileScale,
                    y: ty * this.tileScale,
                    parent: this.tileContainer,
                    baseTint: theme.wallTint,
                });
                this.tileMap.set(`${tx},${ty},1`, newTile);
            } else if (tilePlan.type.includes("door")) {
                // door
                newTile = new Tile({
                    passable: true,
                    seeThrough: true,
                    sprite: Sprite.from(`tiles/${theme.floor}.png`),
                    x: tx * this.tileScale,
                    y: ty * this.tileScale,
                    parent: this.tileContainer,
                    baseTint: theme.floorTint,
                });
                newTile.sprite.tint = theme.floorTint;
                this.tileMap.set(`${tx},${ty},1`, newTile);
                objectFactory({x:tx,y:ty,z:1}, tilePlan.type, this);
            } else if (tilePlan.type === "stairs") {
                // stairs
                newTile = new Tile({
                    passable: true,
                    seeThrough: true,
                    sprite: Sprite.from("tiles/stairsDown.png"),
                    x: tx * this.tileScale,
                    y: ty * this.tileScale,
                    parent: this.tileContainer,
                    levelExit: true,
                    baseTint: 0xFFFFFF,
                });
                this.tileMap.set(`${tx},${ty},1`, newTile);
            } else {
                // floor
                newTile = new Tile({
                    passable: true,
                    seeThrough: true,
                    sprite: Sprite.from(`tiles/${theme.floor}.png`),
                    x: tx * this.tileScale,
                    y: ty * this.tileScale,
                    parent: this.tileContainer,
                    baseTint: theme.floorTint,
                });
                newTile.sprite.tint = theme.floorTint;
                this.tileMap.set(`${tx},${ty},1`, newTile);
            }
        });

        const [px, py] = generatedMap.playerStart.split(',').map(x => parseInt(x));

        // Add in the player
        if (Game.getInstance().player) {
            // Put the player sprite back where it should be.
            this.spriteContainer.addChild(Game.getInstance().player.sprite);
            Game.getInstance().player.moveTo(px, py, 1, true);
            this.actors.push(Game.getInstance().player);
        } else {
            const player = new Player({
                name: "you",
                sprite: Sprite.from("sprites/hero.png"),
                x: px,
                y: py,
                z: 1,
                mapHandler: this
            });
        }

        // Add non-interactable decorations
        generatedMap.decorations.forEach(decoration => {
            const decoSprite = Sprite.from(`decoration/${decoration.name}.png`);
            const tile = this.tileMap.get(`${decoration.key},1`);
            tile.addDecoration(decoSprite);
        });

        // Add in interactables
        let numAdded = 0;
        while (numAdded < 2 && generatedMap.interactableSpot.length > 0) {
            const toAdd = getInteractable(level);
            if (!toAdd) {
                break;
            } else {
                const key = randomElement(generatedMap.interactableSpot, true) + ',1';
                if (this.tileMap.has(key)) {
                    const tile = this.tileMap.get(key);
                    if (tile) {
                        tile.addInteractive(toAdd.actual, toAdd.actual?.sprite);
                    }
                }
            }
            numAdded++;
        }

        // Add items
        generatedMap.items.forEach(item => {
            const [tx, ty] = item.key.split(',').map(x => parseInt(x));
            itemFactory({x:tx, y:ty, z:1}, item.name, this);
        });

        // Add critters
        generatedMap.critters.forEach(critter => {
            const [tx, ty] = critter.key.split(',').map(x => parseInt(x));
            new Critter({
                critterType: critter.name,
                x: tx,
                y: ty,
                z: 1,
                mapHandler: this
            })
        });

        // Add other objects
        generatedMap.otherObjects.forEach(item => {
            const [tx, ty] = item.key.split(',').map(x => parseInt(x));
            objectFactory({x:tx, y:ty, z:1}, item.name, this);
        });

        this.roomCenters = generatedMap.rooms.map(x=>x.center);
        this.spriteContainer.sortChildren();
    }

    // Get the tile at the given location
    getTile(x:number, y:number, z:number):Tile|null {
        const key = `${x},${y},${z}`;
        if (this.tileMap.has(key)) {
            return this.tileMap.get(key);
        } else {
            return null;
        }
    }

    // Recenter the view, if possible
    recenter(target:Entity = null) {
        // No target, use the player
        if (!target) {
            const player = Game.getInstance().player;
            if (player) {
                target = player;
            } else {
                // No player? Forget it.
                return;
            }
        }
        const targetX = target.sprite.x;
        const targetY = target.sprite.y;

        const view:IRenderer = Game.getInstance().pixiApp.renderer;
        const x = view.width / (devicePixelRatio * 2) - targetX - this.tileScale/2;
        const y = view.height / (devicePixelRatio *2) - targetY - this.tileScale/2;

        this.tileContainer.x = x;
        this.tileContainer.y = y;
        this.spriteContainer.x = x;
        this.spriteContainer.y = y;
    }

    addActor(actor:Entity) {
        this.actors.push(actor);
    }

    removeActor(actor:Entity) {
        const index = this.actors.indexOf(actor);
        this.actors.splice(index, 1);
    }

    // Update vision
    updateVision(position:number[]=undefined) {
        if (!position) {
            const player = Game.getInstance().player;
            if (player) {
                this.visionHandler.see([player.x, player.y, player.z]);
            }
        } else {
            this.visionHandler.see(position)
        }
    }

    tick(deltaMS:number) {
        this.actors.forEach(actor => actor.tick(deltaMS));
    }

    // Get a path from one point to another
    getPath(start:number[], end:number[]) {
        if (this.tileMap) {
            return this.pathfinder.findPath(start, end);
        }
        return [];
    }

    // Project some sound
    sound(position:{x:number, y:number}, {seen, unseen}:{seen?:string, unseen?:string}, volume:number, playerOrigin:boolean, soundToPlay?:string, pitch:number = 1) {
        // Give enemies a chance to hear it
        if (playerOrigin) {
            this.actors.forEach(actor => {
                if (actor instanceof Critter && actor.active) {
                    const distance = Math.max(Math.abs(position.x - actor.x), Math.abs(position.y - actor.y));
                    actor.observe(actor.awareness * 0.5, position, volume / distance);
                }
            });
        }
        const player = Game.getInstance().player;
        if (player) {
            const playerDistance = Math.max(Math.abs(player.x - position.x),Math.abs(player.y - position.y));
            if (playerDistance < Math.min(10, 3 * volume) && Math.random() < volume / playerDistance) {
                const tile = this.getTile(position.x, position.y, 1);
                if (soundToPlay) {
                    SoundHandler.getInstance().playSound(soundToPlay, 1 / playerDistance, pitch);
                }
                if (tile && tile.visible) {
                    if (seen) {
                        Logger.getInstance().sendMessage(seen);
                    }
                } else {
                    if (unseen) {
                        Logger.getInstance().sendMessage(unseen);
                    }
                }
            }
        }
    }
}

export default MapHandler;
