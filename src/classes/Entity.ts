import { Sprite, utils } from "pixi.js"
import MapHandler from "./MapHandler"
import Tile from "./Tile"
import Logger from "./Logger"
import Player from "./Player"
import UI from "./UI"

export type ActionTypes = "open" | "violence" | "push" | "swap" | "unlock";
export type EntityFlags = "important" | "big" | "undying";

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
    entityFlags?: EntityFlags[];
    actPeriod?:number;
    movePeriod?:number;
    name: string;
    strength?:number;
    needsKey?:string;
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
    spriteX: number = 0;
    spriteY: number = 0;
    spriteSpeed: number;
    spriteMoving: boolean = false;
    blocksVision: boolean;
    hp: number;
    maxHp: number;
    active: boolean = true;
    actionTypes: ActionTypes[];
    entityFlags: EntityFlags[];
    clock: number = 0;
    actPeriod: number;
    name: string;
    team: number = 0;
    strength: number;
    actionQueue: (()=>boolean)[] = [];
    needsKey: string;
    pathBlocking: boolean;
    spriteForDamageTinting: Sprite;
    damageTintAmount: number = 0;
    baseTint: number = 0xFFFFFF;
    constructor({sprite, mapHandler, x, y, z, hp=Infinity, acts=false, blocksVision=false, actionTypes=[], entityFlags=[], actPeriod=1000, movePeriod, name, strength=0, needsKey}:EntityParams) {
        this.sprite = sprite;
        this.spriteForDamageTinting = sprite;
        this.mapHandler = mapHandler;
        if (acts) {
            this.mapHandler.addActor(this);
        }

        this.mapHandler.spriteContainer.addChild(this.sprite);
        this.sprite.visible = false;
        // Move self to starting location
        this.moveTo(x, y, z, true);
        this.hp = hp;
        this.maxHp = hp;
        this.blocksVision = blocksVision;
        this.actionTypes = actionTypes;
        if (this.actionTypes.includes("unlock")) {
            this.pathBlocking = true;
        }
        this.actPeriod = actPeriod;
        if (movePeriod) {
            this.spriteSpeed = 1 / (movePeriod);
        } else {
            this.spriteSpeed = 1 / (this.actPeriod);
        }
        this.name = name;
        this.strength = strength;
        this.entityFlags = entityFlags;
        this.needsKey = needsKey;
    }

    getHealthFraction() {
        return this.hp / this.maxHp;
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
                this.spriteX = x * this.mapHandler.tileScale;
                this.spriteY = y * this.mapHandler.tileScale;
                if (immediate) {
                    this.sprite.x = this.spriteX;
                    this.sprite.y = this.spriteY;
                } else {
                    // Figure out smooth sliding later. For now, still immediate.
                    this.spriteMoving = true;
                }
                // Update visibility
                this.setVisibility(this.currentTile.light);
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
        [...this.actionTypes].forEach(actionType => {
            this.performSpecificAction(actionType, actor);
        });
        // Some bonus actions
        if (actor.entityFlags.includes("important") && !this.entityFlags.includes("important") && actor.team === this.team) {
            // Important critters can switch places with unimportant ones
            this.performSpecificAction("swap", actor);
        }
    }

    performSpecificAction(actionType:ActionTypes, actor:Entity) {
        switch(actionType) {
            case "unlock":
                // Only the player can unlock
                if (actor instanceof Player) {
                    const keyIndex = actor.inventory.map(x=>x.name).indexOf(this.needsKey);
                    if (keyIndex >= 0) {
                        actor.inventory.splice(keyIndex, 1);
                        UI.getInstance().updateInventory(actor);
                        this.actionTypes.splice(this.actionTypes.indexOf("unlock"), 1);
                        this.actionTypes.push("open");
                        this.pathBlocking = false;
                        Logger.getInstance().sendMessage(`You used the ${this.needsKey} to unlock the ${this.name}!`, {tone:"good"});
                        this.needsKey = "";
                    } else {
                        Logger.getInstance().sendMessage(`This door is locked! You need a ${this.needsKey}!`, {tone:"bad"});
                    }
                }
                break;
            // This is a door. Open it!
            case "open":
                let rememberTile:Tile = null;
                if (this.currentTile) {
                    rememberTile = this.currentTile;
                    // Remove self from previous tile
                    this.currentTile.entity = null;
                    this.currentTile = null;
                    this.mapHandler.updateVision();

                    if (actor instanceof Player) {
                        Logger.getInstance().sendMessage("You open the door.");
                    } else if (rememberTile && rememberTile.visible) {
                        Logger.getInstance().sendMessage("The door opens.");
                    }
                    this.mapHandler.sound(
                        {x:this.x, y:this.y},
                        {unseen:"You hear a door open..."},
                        2,
                        actor instanceof Player
                    );
                }
                this.sprite.visible = false;

                if (rememberTile) {
                    const closeAction = () => {
                        if (!rememberTile.entity) {
                            this.currentTile = rememberTile;
                            this.currentTile.entity = this;
                            this.mapHandler.updateVision();
                            if (rememberTile.visible) {
                                Logger.getInstance().sendMessage("The door closes.");
                            }
                        } else {
                            return false;
                        }
                    }
                    this.actionQueue.push(closeAction);
                    this.clock = 0;
                }
                break;
            // Fight!!
            case "violence":
                // No friendly fire
                if (this.team != actor.team && actor.damageAmount() > 0) {
                    Logger.getInstance().sendMessage(actor.violenceMessage(this), {tone: (this instanceof Player) ? "bad" : "neutral"});
                    this.damage(actor.damageAmount(), actor);
                    if (actor instanceof Player) {
                        actor.damageHeldItem();
                        this.mapHandler.sound(
                            {x:actor.x, y:actor.y},
                            {},
                            5 * Math.random(),
                            true
                        );
                    }
                }
                break;
            case "swap":
                // Trade places
                this.currentTile.entity = null;
                const [x,y,z] = [actor.x, actor.y, actor.z];
                actor.moveTo(this.x, this.y, this.z);
                this.moveTo(x, y, z);
                break;
        }
    }

    // Get violence message
    violenceMessage(target:Entity) {
        return `${this.name} attacks ${target.name}!`
    }

    // Calculate damage amount
    damageAmount():number {
        return this.strength;
    }

    // Act!
    act() {
        const action = this.actionQueue.shift();
        if (action) {
            if (!action()) {
                this.actionQueue.push(action);
            }
        }
    }

    tick(deltaMS:number) {
        if (this.damageTintAmount > 0) {
            this.updateTint();
            if (this.active) {
                this.damageTintAmount = Math.max(0, this.damageTintAmount - deltaMS / 1000);
            }
        }
        this.clock += deltaMS;
        if (this.spriteMoving) {
            this.moveSprite(deltaMS);
        }

        if (this.clock >= this.actPeriod) {
            this.clock -= this.actPeriod;
            this.act();
        }
    }

    moveSprite(deltaMS:number) {
        const spriteStep = deltaMS * this.spriteSpeed * this.mapHandler.tileScale;
        const dist = [ this.spriteX - this.sprite.x, this.spriteY - this.sprite.y ];
        if (Math.abs(dist[0]) < spriteStep && Math.abs(dist[1]) < spriteStep) {
            this.sprite.x = this.spriteX;
            this.sprite.y = this.spriteY;
            this.spriteMoving = false;
        } else {
            if (Math.abs(dist[0]) < spriteStep) {
                this.sprite.x = this.spriteX;
            } else {
                this.sprite.x += spriteStep * Math.sign(dist[0]);
            }
            if (Math.abs(dist[1]) < spriteStep) {
                this.sprite.y = this.spriteY;
            } else {
                this.sprite.y += spriteStep * Math.sign(dist[1]);
            }
        }
    }

    // Harm this entity (note, negative harm is healing)
    damage(damage:number, attacker:Entity = null) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.damageTintAmount = 1;
            this.die();
        } else if (this.hp > this.maxHp) {
            this.hp = this.maxHp;
        } else if (damage > 0) {
            this.damageTintAmount = Math.min(1, damage / this.hp);
        }
    }

    die() {
        this.active = false;
        this.sprite.zIndex = -1;
        this.mapHandler.spriteContainer.sortChildren();
        let rememberTile: Tile;
        if (this.currentTile) {
            rememberTile = this.currentTile;
            // Remove self from previous tile
            this.currentTile.entity = null;
        }
        if (this.entityFlags.includes("undying")) {
            Logger.getInstance().sendMessage(`The ${this.name} was stunned!`, {tone:"good"});
            this.clock = -30000;
            this.actionQueue.push(()=>{
                this.active = true;
                this.hp = this.maxHp;
                if (rememberTile.visible) {
                    Logger.getInstance().sendMessage(`The ${this.name} has regained their strength!`, {tone:"bad"});
                }
                this.sprite.zIndex = 0;
                this.mapHandler.spriteContainer.sortChildren();
                this.moveTo(this.x, this.y, this.z);
                return true;
            });
        } else {
            if (this instanceof Player) {
                Logger.getInstance().sendMessage(`You die...`, {tone:"bad", important: true});
            } else {
                Logger.getInstance().sendMessage(`The ${this.name} dies!`, {tone:"good"});
            }
        }
    }

    updateTint() {
        const damagetint = utils.rgb2hex([1, 1 - this.damageTintAmount, 1 - this.damageTintAmount]);
        if (this.sprite === this.spriteForDamageTinting) {
            this.sprite.tint = damagetint & this.baseTint;
        } else {
            this.sprite.tint = this.baseTint;
            this.spriteForDamageTinting.tint = damagetint;
        }
    }

    setVisibility(light:number) {
        if (light > 0) {
            const clampedLight = Math.max(Math.min(light, 1), 0);
            this.baseTint = utils.rgb2hex([clampedLight, clampedLight, clampedLight]);
            this.updateTint();
            this.sprite.visible = true;
            this.spriteForDamageTinting.visible = true;
        } else {
            this.sprite.visible = false;
            this.spriteForDamageTinting.visible = false;
        }
    }
}

export default Entity;
