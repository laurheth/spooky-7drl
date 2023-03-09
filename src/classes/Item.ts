import { Sprite } from "pixi.js"
import MapHandler from "./MapHandler"
import Tile from "./Tile"
import Player from "./Player"
import Logger from "./Logger"

interface UseAction {
    type: "heal"|"key";
    value: number|string;
}

export interface ItemParams {
    sprite: Sprite;
    name: string;
    mapHandler: MapHandler;
    x: number;
    y: number;
    z: number;
    equippable: boolean;
    strength: number;
    attackString: string;
    durability: number;
    durabilityRate: number;
    useAction?: UseAction;
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
    equippable: boolean;
    strength: number;
    attackString: string;
    durability: number;
    durabilityRate: number;
    useAction: UseAction;
    constructor({sprite, mapHandler, x, y, z, name, equippable, attackString, strength, durability, durabilityRate, useAction}:ItemParams) {
        this.mapHandler = mapHandler;
        this.sprite = sprite;
        this.sprite.zIndex = -1;
        this.mapHandler.spriteContainer.addChild(this.sprite);
        this.sprite.visible = false;
        this.name = name;
        this.equippable = equippable;
        this.attackString = attackString;
        this.strength = strength;
        this.durability = durability;
        this.durabilityRate = durabilityRate;
        this.useAction = useAction;
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

    // Roll the dice to damage this item. Return true if durability changes.
    damage():boolean {
        if (this.durabilityRate < Math.random()) {
            this.durability--;
            return true;
        }
        return false;
    }

    // Use the item!
    use(player:Player):boolean {
        if (this.useAction.type === "heal" && typeof this.useAction.value === "number") {
            if (player.hp < player.maxHp) {
                player.damage(-this.useAction.value);
                Logger.getInstance().sendMessage("You feel healthier.");
                return true;
            } else {
                Logger.getInstance().sendMessage("You are already fully healed!");
                return false;
            }
        }
        if (this.useAction.type === "key") {
            for (let i=-1;i<2;i++) {
                for (let j=-1;j<2;j++) {
                    const tile = this.mapHandler.getTile(player.x + i, player.y + j, player.z);
                    if (tile && tile.entity && tile.entity.needsKey === this.name) {
                        tile.entity.actUpon(player);
                        return true;
                    }
                }
            }
            Logger.getInstance().sendMessage("Nothing here needs to be unlocked with that!");
            return false;
        }
        return false;
    }
}

export default Item;
