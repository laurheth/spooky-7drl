import { default as Entity, EntityParams } from "./Entity"
import Game from "./Game"
import UI from "./UI"
import Item from "./Item"
import Logger from "./Logger"

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

    maxItems:number = 6;

    constructor(params: PlayerParams) {
        params.acts = true;
        params.actPeriod = 200;
        super(params);
        Game.getInstance().player = this;
        UI.getInstance().updateInventory(this.inventory);
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
                                tile.item.pickUp();
                                UI.getInstance().updateInventory(this.inventory);
                                turnDone = true;
                            } else {
                                Logger.getInstance().sendMessage("Your inventory is full! Use or drop something first.");
                            }
                        } else {
                            Logger.getInstance().sendMessage("There is nothing here to pick up.");
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

    dropItemByIndex(index:number) {
        if (index < this.inventory.length) {
            const item = this.inventory[index];
            if (item) {
                if(item.drop(this.x, this.y, this.z)) {
                    Logger.getInstance().sendMessage(`You drop the ${item.name}.`);
                    this.inventory.splice(index, 1);
                    UI.getInstance().updateInventory(this.inventory);
                } else {
                    Logger.getInstance().sendMessage(`The floor is too cluttered to drop the ${item.name}!`);
                }
            }
        }
    }

    moveTo(x:number, y:number, z:number, immediate = false): boolean {
        const success = super.moveTo(x, y, z, immediate);
        if (success && this.currentTile && this.currentTile.item) {
            Logger.getInstance().sendMessage(`You see at your feet at ${this.currentTile.item.name}.`);
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
}

export default Player;
