import { Sprite, Texture } from "pixi.js"
import MapHandler from "./MapHandler"
import Tile from "./Tile"
import Player from "./Player"
import Entity from "./Entity"
import Logger from "./Logger"
import Game from "./Game"

interface UseAction {
    type: "heal"|"key"|"bomb";
    value: number|string;
}

export interface ItemParams {
    sprite: Sprite;
    alternateSprite?: Sprite;
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
    alternateSprite:Sprite;
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
    constructor({sprite, mapHandler, x, y, z, name, equippable, attackString, strength, durability, durabilityRate, useAction, alternateSprite}:ItemParams) {
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
        this.alternateSprite = alternateSprite;
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
        if (this.useAction.type === "bomb" && typeof this.useAction.value === "string") {
            let [dmg, range, time] = this.useAction.value.split(",").map(x=>parseInt(x));
            const {x, y, z, currentTile} = player;
            const logger = Logger.getInstance();
            logger.sendMessage("The bomb has been lit! Run!!", {tone:"bad", important:true});
            currentTile.addDecoration(this.alternateSprite, true);
            const warnings = ["1...", "2...", "3..."];
            const effectedSet = new Set<string>();
            const effectedEntities = new Set<Entity>();
            const fireMap = new Map<Sprite, number>();
            const damageAtTile = (tile:Tile) => {
                if (tile && tile.entity && !effectedEntities.has(tile.entity)) {
                    tile.entity.damage(dmg * range);
                    effectedEntities.add(tile.entity);
                }
            }
            const pseudoActor = {tick:(deltaMS:number) => {
                time -= deltaMS;
                if (time < 3000 && warnings.length === 3) {
                    logger.sendMessage(warnings.pop());
                }
                if (time < 2000 && warnings.length === 2) {
                    logger.sendMessage(warnings.pop());
                }
                if (time < 1000 && warnings.length === 1) {
                    logger.sendMessage(warnings.pop());
                }
                // Kaboom!
                fireMap.forEach((t, s) =>{
                    fireMap.set(s, t + deltaMS);
                    if (t < 300) {
                        s.tint = 0xFFFF00;
                    } else if (t < 600) {
                        s.tint = 0xFF0000;
                    } else if (t < 900) {
                        s.tint = 0x666666;
                    } else {
                        fireMap.delete(s);
                        s.visible = false;
                    }
                });
                if (time < 0 && range > 0) {
                    time += 100;
                    range -= 1;
                    if (effectedSet.size === 0) {
                        this.mapHandler.sound({
                            x: x,
                            y: y
                        }, {
                            seen: "BOOM!!!",
                            unseen: "BOOM!!"
                        }, 100, true);
                        currentTile.removeDecoration();
                        damageAtTile(currentTile);
                        effectedSet.add(`${x},${y},${z}`);
                        const boomSprite = Sprite.from(Texture.WHITE);
                        boomSprite.width = this.mapHandler.tileScale;
                        boomSprite.height = this.mapHandler.tileScale;
                        boomSprite.tint = 0xFFFF00;
                        currentTile.addDecoration(boomSprite);
                        fireMap.set(boomSprite, 0);
                    } else {
                        const toAdd:string[] = [];
                        effectedSet.forEach(key => {
                            const [dx, dy, dz] = key.split(',').map(x=>parseInt(x));
                            [[-1,0],[1,0],[0,1],[0,-1]].forEach(step => {
                                const newKey = `${dx+step[0]},${dy+step[1]},${dz}`;
                                if (this.mapHandler.tileMap.has(newKey) && this.mapHandler.tileMap.get(newKey).passable) {
                                    const newTile = this.mapHandler.tileMap.get(newKey);
                                    damageAtTile(newTile);
                                    if (!effectedSet.has(newKey)) {
                                        toAdd.push(newKey);
                                        const boomSprite = Sprite.from(Texture.WHITE);
                                        boomSprite.width = this.mapHandler.tileScale;
                                        boomSprite.height = this.mapHandler.tileScale;
                                        boomSprite.tint = 0xFFFF00;
                                        newTile.addDecoration(boomSprite);
                                        fireMap.set(boomSprite, 0);
                                    }
                                }
                            });
                        });
                        toAdd.forEach(key=>effectedSet.add(key));
                    }
                }
                if (range <= 0 && fireMap.size <= 0) {
                    const index = this.mapHandler.actors.indexOf(pseudoActor);
                    if (index >= 0) {
                        this.mapHandler.actors.splice(index, 1);
                    }
                    effectedSet.forEach(key => {
                        if (this.mapHandler.tileMap.has(key)) {
                            const tile = this.mapHandler.tileMap.get(key);
                            tile.removeDecoration();
                        }
                    });
                }
            }};

            this.mapHandler.actors.push(pseudoActor);

            return true;
        }
        return false;
    }
}

export default Item;
