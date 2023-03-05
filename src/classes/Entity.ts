import { Sprite } from "pixi.js"
import MapHandler from "./MapHandler"
import Tile from "./Tile"

export interface EntityParams {
    sprite: Sprite;
    mapHandler: MapHandler;
    x: number;
    y: number;
    z: number;
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
    constructor({sprite, mapHandler, x, y, z}:EntityParams) {
        this.sprite = sprite;
        this.mapHandler = mapHandler;
        this.mapHandler.spriteContainer.addChild(this.sprite);
        this.sprite.visible = false;
        // Move self to starting location
        if (this.moveTo(x, y, z, true)) {
            this.sprite.visible = true;
        }
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
        // Stub
    }
}

export default Entity;
