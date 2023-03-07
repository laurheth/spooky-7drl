import { Sprite } from "pixi.js"
import MapHandler from "./MapHandler"
import Tile from "./Tile"

export interface ItemParams {
    sprite: Sprite;
    name: string;
    mapHandler: MapHandler;
    x: number;
    y: number;
    z: number;
}

/**
 * An item! Something the player can pick up and use
 */
class Item {
    sprite:Sprite;
    mapHandler:MapHandler;
    x: number;
    y: number;
    z: number;
    name: string;
    currentTile: Tile;
    constructor({sprite, mapHandler, x, y, z, name}:ItemParams) {
        this.mapHandler = mapHandler;
        this.sprite = sprite;
        this.sprite.zIndex = -1;
        this.mapHandler.spriteContainer.addChild(this.sprite);
        this.sprite.visible = false;
        this.name = name;
        this.findValidSpotAndPlaceSelf(x, y, z);
    }

    placeSelf(x:number, y:number, z:number):boolean {
        const tile = this.mapHandler.getTile(x,y,z);
        if (tile && tile.passable && !tile.item) {
            tile.item = this;
            this.x = x;
            this.y = y;
            this.z = z;
            tile.see(tile.light);
            this.currentTile = tile;
            this.mapHandler.spriteContainer.addChild(this.sprite);
            this.sprite.zIndex = -1;
            this.sprite.x = x * this.mapHandler.tileScale;
            this.sprite.y = y * this.mapHandler.tileScale;
            return true;
        } else {
            return false;
        }
    }

    findValidSpotAndPlaceSelf(x:number, y:number, z:number): boolean {
        for (let r=0; r<50; r++) {
            for (let i=-r;i<=r;i++) {
                for (let j=-r;j<=r;j++) {
                    if (this.placeSelf(x + i, y + j, z)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    pickUp() {
        if (this.currentTile) {
            this.currentTile.item = null;
            this.mapHandler.spriteContainer.removeChild(this.sprite);
            this.currentTile = null;
        }
    }

    drop(x:number, y:number, z:number): boolean {
        const success = this.findValidSpotAndPlaceSelf(x, y, z);
        this.mapHandler.spriteContainer.sortChildren();
        return success;
    }
}

export default Item;
