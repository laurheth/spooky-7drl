import { default as Entity, EntityParams } from "./Entity"
import Game from "./Game"

interface PlayerParams extends EntityParams {
    // Anything extra?
}

/**
 * The player!
 */
class Player extends Entity {

    // Resolve function from the Promise in Player::act
    playerTurn: (value:unknown)=>void;

    constructor(params: PlayerParams) {
        params.acts = true;
        super(params);
        Game.getInstance().player = this;
    }

    handleInput(event:KeyboardEvent) {
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
                this.playerTurn(true);
            }
        }
    }

    moveTo(x:number, y:number, z:number, immediate = false): boolean {
        const success = super.moveTo(x, y, z, immediate);
        this.mapHandler.recenter(this);
        return success;
    }

    async act() {
        this.mapHandler.updateVision([this.x, this.y, this.z]);
        await new Promise((resolve) => {
            this.playerTurn = resolve;
        });
    }
}

export default Player;
