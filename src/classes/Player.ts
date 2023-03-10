import { default as Entity, EntityParams } from "./Entity"
import Game from "./Game"
import UI from "./UI"
import Item from "./Item"
import Logger from "./Logger"
import { Sprite } from "pixi.js"

interface PlayerParams extends EntityParams {
    // Anything extra?
}

/**
 * The player!
 */
class Player extends Entity {

    // Can the player act?
    playerTurn:boolean = true;

    inputBuffer:KeyboardEvent = null;

    previousInput:KeyboardEvent = null;

    updateVisionDelay:number = 0;

    inventory:Item[] = [];

    equippedItem:Item = null;

    maxItems:number = 6;

    team:number = 2;

    totalTime:number = 0;
    heartbeatFactor:number = 0.5;

    constructor(params: PlayerParams) {
        params.acts = true;
        params.actPeriod = 200;
        params.hp = 100;
        params.actionTypes = ["violence"];
        params.entityFlags = ["important"];
        params.strength = 5;
        super(params);
        this.spriteForDamageTinting = Game.getInstance().overlayColor;
        Game.getInstance().player = this;
        UI.getInstance().updateInventory(this);
    }

    handleInput(event:KeyboardEvent, eventType:"keydown"|"keyup"|"buffer"|"repeat") {
        if (eventType === "keydown" || eventType === "buffer" || eventType === "repeat") {
            if (eventType !== "buffer") {
                this.previousInput = event;
            }
            if (this.playerTurn && this.active) {
                let turnDone = false;
                switch(event.key) {
                    case "a":
                    case "Left":
                    case "ArrowLeft":
                        turnDone = this.step(-1, 0, 0);
                        break;
                    case "d":
                    case "Right":
                    case "ArrowRight":
                        turnDone = this.step(1, 0, 0);
                        break;
                    case "Up":
                    case "w":
                    case "ArrowUp":
                        turnDone = this.step(0, -1, 0);
                        break;
                    case "Down":
                    case "s":
                    case "ArrowDown":
                        turnDone = this.step(0, 1, 0);
                        break;
                    case "g": // get
                    case "p": // put
                        if (eventType === "repeat") {
                            // Don't repeat picking up.
                            break;
                        }
                        const tile = this.mapHandler.getTile(this.x, this.y, this.z);
                        if (tile && tile.item) {
                            if (this.inventory.length < this.maxItems) {
                                Logger.getInstance().sendMessage(`You pick up the ${tile.item.name}.`);
                                this.inventory.push(tile.item);
                                if (!this.equippedItem && tile.item.equippable) {
                                    Logger.getInstance().sendMessage(`You equip it immediately.`);
                                    this.equippedItem = tile.item;
                                }
                                tile.item.pickUp();
                                UI.getInstance().updateInventory(this);
                                turnDone = true;
                            } else {
                                Logger.getInstance().sendMessage("Your inventory is full! Use or drop something first.");
                            }
                        } else {
                            Logger.getInstance().sendMessage("There is nothing here to pick up.");
                        }
                        break;
                    case "<": // My memory is terrible. Which one is down again? No up stairs so just get both lol
                    case ">": // Descend
                        if (this.currentTile && this.currentTile.levelExit) {
                            Logger.getInstance().sendMessage("You descend further into darkness...", {important:true, tone:"good"});
                            Game.getInstance().nextLevel();
                        }
                        break;
                }
                if (turnDone) {
                    this.clock = 0;
                    this.playerTurn = false;
                }
            } else {
                this.inputBuffer = event;
            }
        } else {
            this.previousInput = null;
        }
    }

    step(dx: number, dy: number, dz: number, doActions?: boolean): boolean {
        if (dx > 0) {
            this.sprite.scale.x = 1;
            this.sprite.pivot.x = 0;
        } else if (dx < 0) {
            this.sprite.scale.x = -1;
            this.sprite.pivot.x = 32;
        }
        return super.step(dx, dy, dz, doActions);
    }

    equipItemByIndex(index:number) {
        if (index < this.inventory.length) {
            const item = this.inventory[index];
            if (item) {
                this.equippedItem = item;
                UI.getInstance().updateInventory(this);
                Logger.getInstance().sendMessage(`You equip the ${item.name}.`);
            }
        }  
    }

    useItemByIndex(index:number) {
        if (index < this.inventory.length) {
            const item = this.inventory[index];
            if (item) {
                if (item.use(this)) {;
                    this.inventory.splice(index, 1);
                    UI.getInstance().updateInventory(this);
                }
            }
        }
    }

    unequip() {
        if (this.equippedItem) {
            Logger.getInstance().sendMessage(`You unequip the ${this.equippedItem.name}.`);
        }
        this.equippedItem = null;
        UI.getInstance().updateInventory(this);
    }

    dropItemByIndex(index:number) {
        if (index < this.inventory.length) {
            const item = this.inventory[index];
            if (item) {
                if(item.drop(this.x, this.y, this.z)) {
                    Logger.getInstance().sendMessage(`You drop the ${item.name}.`);
                    this.inventory.splice(index, 1);
                    if (this.equippedItem === item) {
                        this.equippedItem = null;
                    }
                    UI.getInstance().updateInventory(this);
                } else {
                    Logger.getInstance().sendMessage(`The floor is too cluttered to drop the ${item.name}!`);
                }
            }
        }
    }

    bleed() {
        if (Math.random() > 0.3 && this.currentTile && !this.currentTile.decoration) {
            this.currentTile.addDecoration(Sprite.from("decoration/bloodPool.png"));
        }
    }

    moveTo(x:number, y:number, z:number, immediate = false, doActions = true): boolean {
        if (this.hp < 25 && Math.random() > this.hp / 25) {
            this.bleed();
        }
        const success = super.moveTo(x, y, z, immediate, doActions);
        if (success && this.currentTile) {
            if (this.currentTile.item) {
                Logger.getInstance().sendMessage(`You see at your feet at ${this.currentTile.item.name}.`);
            }
            if (this.currentTile.levelExit) {
                Logger.getInstance().sendMessage(`You found staircase, descending into darkness below...`, {tone:"good", important:true});
            }
        }
        this.updateVisionDelay = this.actPeriod / 2;
        this.mapHandler.recenter(this);
        return success;
    }

    moveSprite(deltaMS: number): void {
        super.moveSprite(deltaMS);
        this.mapHandler.recenter(this);
    }

    tick(deltaMS: number): void {
        super.tick(deltaMS);
        this.totalTime += deltaMS;
        if (this.hp < 33) {
            const base = 1 - Math.max(0, this.hp / 33);
            this.damageTintAmount = Math.max(this.damageTintAmount, base * Math.sin(this.heartbeatFactor * this.totalTime));
        }
        if (this.updateVisionDelay >= 0) {
            this.updateVisionDelay -= deltaMS;
            if (this.updateVisionDelay < 0) {
                this.mapHandler.updateVision([this.x, this.y, this.z]);
            }
        }
    }

    act() {
        this.playerTurn = true;
        if (this.inputBuffer) {
            this.handleInput(this.inputBuffer, "buffer");
            this.inputBuffer = null;
        } else if (this.previousInput) {
            this.handleInput(this.previousInput, "repeat");
        }
    }

    damage(damage: number, attacker?: Entity): void {
        super.damage(damage, attacker);
        UI.getInstance().updateStatus(this);
        if (damage > 0) {
            this.bleed();
        }
    }

    damageAmount(): number {
        if (!this.equippedItem) {
            return this.strength;
        } else {
            return this.equippedItem.strength;
        }
    }

    // The damage logic needs a refactor, yeesh, but no time to go back right now.
    damageHeldItem() {
        if (this.equippedItem) {
            if (this.equippedItem.damage()) {
                if (this.equippedItem.durability <= 0) {
                    const itemName = this.equippedItem.name;
                    Logger.getInstance().sendMessage(`Your ${itemName} has broken!`, {tone:"bad"});
                    const index = this.inventory.indexOf(this.equippedItem);
                    this.inventory.splice(index, 1);
                    this.equippedItem = null;
                    // See if we have a replacement
                    this.inventory.forEach(otherItem => {
                        if (otherItem.name === itemName) {
                            this.equippedItem = otherItem;
                        }
                    })
                    if (this.equippedItem) {
                        Logger.getInstance().sendMessage(`You pull a spare ${itemName} from your pocket and equip it!`);
                    }
                }
                UI.getInstance().updateInventory(this);
            }
        }
    }

    // Get violence message
    violenceMessage(target:Entity) {
        if (this.equippedItem) {
            return `You ${this.equippedItem.attackString} ${target.name}!`;
        } else {
            return `You punch ${target.name}!`
        }
    }

    deathMessage(): void {
        Logger.getInstance().sendMessage(`You die...`, {tone:"bad", important: true});
    }
}

export default Player;
