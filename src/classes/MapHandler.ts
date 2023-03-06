import { Container, IRenderer, Sprite } from "pixi.js"
import Tile from "./Tile"
import Player from "./Player"
import Critter from "./Critter"
import Entity from "./Entity"
import Game from "./Game"
import mapGenerator from "../util/mapGenerator"

interface MapHandlerParams {
    tileContainer: Container;
    spriteContainer: Container;
    tileScale: number;
}

interface NewMapParams {
    level: number;
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
    actors: Entity[] = [];
    active: boolean = false;

    constructor({tileContainer, spriteContainer, tileScale}:MapHandlerParams) {
        this.tileContainer = tileContainer;
        this.spriteContainer = spriteContainer;
        this.tileScale = tileScale;
        this.tileMap = new Map<string, Tile>();
    }

    // Generate a new map!
    generateNewMap({level}:NewMapParams) {
        // Clear the old tiles
        this.tileContainer.removeChildren();
        this.tileMap.clear();

        const generatedMap = mapGenerator();
        
        // Translate the generated map into tiles
        generatedMap.map.forEach((tilePlan, key) => {
            const [tx, ty] = key.split(',').map(x => parseInt(x));
            let newTile: Tile;
            if (tilePlan.type === '#') {
                // wall
                newTile = new Tile({
                    passable: false,
                    seeThrough: false,
                    sprite: Sprite.from("tiles/testWall.png"), // TODO: cache sprites instead of regenerating them. Also, use a spriteSheet
                    x: tx * this.tileScale,
                    y: ty * this.tileScale,
                    parent: this.tileContainer
                });
            } else {
                // floor
                newTile = new Tile({
                    passable: true,
                    seeThrough: true,
                    sprite: Sprite.from("tiles/testFloor.png"), // TODO: cache sprites instead of regenerating them
                    x: tx * this.tileScale,
                    y: ty * this.tileScale,
                    parent: this.tileContainer
                });
            }
            this.tileMap.set(`${tx},${ty},1`, newTile);
        });

        const [px, py] = generatedMap.playerStart.split(',').map(x => parseInt(x));

        // Add in the player
        const player = new Player({
            sprite: Sprite.from("sprites/testFace.png"),
            x: px,
            y: py,
            z: 1,
            mapHandler: this
        });
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

    // Kick the actors into motion
    async startActing() {
        if (!this.active) {
            this.active = true;
            while (this.active) {
                const actor = this.actors.shift();
                if (actor) {
                    this.actors.push(actor);
                    await actor.act();
                }
            }
        }
    }
}

export default MapHandler;
