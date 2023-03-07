import { Sprite, utils } from "pixi.js"
import MapHandler from "./MapHandler"
import Tile from "./Tile"

type ActionTypes = "open";

export interface EntityParams {
    sprite: Sprite;
    mapHandler: MapHandler;
    x: number;
    y: number;
    z: number;
    hp?: number;
    acts?: boolean;
    blocksVision?: boolean;
    actionTypes?: ActionTypes[];
}

/**
 * Something that walks around and moves. Takes up space. The player, critters, decorations, interactables.
 */
class Entity {
    mapHandler: MapHandler;
    sprite: Sprite;
    currentTile: Tile|null = null;
    x: number = 0;
    y: number = 0;
    z: number = 1;
    blocksVision: boolean;
    hp: number;
    active: boolean = true;
    actionTypes: ActionTypes[];
    constructor({sprite, mapHandler, x, y, z, hp=Infinity, acts=false, blocksVision=false, actionTypes=[]}:EntityParams) {
        this.sprite = sprite;
        this.mapHandler = mapHandler;
        if (acts) {
            this.mapHandler.addActor(this);
        }

        this.mapHandler.spriteContainer.addChild(this.sprite);
        this.sprite.visible = false;
        // Move self to starting location
        this.moveTo(x, y, z, true);
        this.hp = hp;
        this.blocksVision = blocksVision;
        this.actionTypes = actionTypes;
    }

    // Move to a location
    moveTo(x:number, y:number, z:number, immediate = false): boolean {
        // Make sure it's possible to go there
        const tile = this.mapHandler.getTile(x,y,z);
        if (tile && tile.passable) {
            if (tile.entity) {
                // Something lives there. Act upon it. The recipient will figure out what to do.
                tile.entity.actUpon(this);
                return true;
            } else {
                // We can move! Go there now.
                this.x = x;
                this.y = y;
                this.z = z;
                if (this.currentTile) {
                    // Remove self from previous tile
                    this.currentTile.entity = null;
                }
                tile.entity = this;
                this.currentTile = tile;
                if (immediate) {
                    this.sprite.x = x * this.mapHandler.tileScale;
                    this.sprite.y = y * this.mapHandler.tileScale;
                } else {
                    // Figure out smooth sliding later. For now, still immediate.
                    this.sprite.x = x * this.mapHandler.tileScale;
                    this.sprite.y = y * this.mapHandler.tileScale;
                }
                return true;
            }
        } else {
            return false;
        }
    }

    // Helper method to make stepping easier
    step(dx:number, dy:number, dz:number): boolean {
        return this.moveTo(this.x + dx, this.y + dy, this.z + dz);
    }

    // Get acted upon
    actUpon(actor:Entity) {
        console.log("actUpon");
        this.actionTypes.forEach(actionType => {
            switch(actionType) {
                case "open":
                    console.log("open?");
                    if (this.currentTile) {
                        // Remove self from previous tile
                        this.currentTile.entity = null;
                        this.currentTile = null;
                    }
                    this.sprite.visible = false;
                    break; 
            }
        });
    }

    // Act!
    async act() {
        // Stub
    }

    // Harm this entity
    damage(damage:number, attacker:Entity = null) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        if (this.currentTile) {
            // Remove self from previous tile
            this.currentTile.entity = null;
            this.currentTile = null;
        }
        this.sprite.visible = false;
    }

    setVisibility(light:number) {
        if (light > 0) {
            const clampedLight = Math.max(Math.min(light, 1), 0);
            const tint = utils.rgb2hex([clampedLight, clampedLight, clampedLight]);
            this.sprite.tint = tint;
            this.sprite.visible = true;
        } else {
            this.sprite.visible = false;
        }
    }
}

export default Entity;
