import { default as Entity, EntityParams } from "./Entity"
import Game from "./Game"

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

    constructor(params: PlayerParams) {
        params.acts = true;
        params.actPeriod = 200;
        super(params);
        Game.getInstance().player = this;
    }

    handleInput(event:KeyboardEvent, eventType:"keydown"|"keyup"|"buffer") {
        if (eventType === "keydown" || eventType === "buffer") {
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

    moveTo(x:number, y:number, z:number, immediate = false): boolean {
        const success = super.moveTo(x, y, z, immediate);
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
            this.handleInput(this.previousInput, "keydown");
        }
    }
}

export default Player;
