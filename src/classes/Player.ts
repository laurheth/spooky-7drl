import { default as Entity, EntityParams } from "./Entity";

interface PlayerParams extends EntityParams {
    // Anything extra?
}

/**
 * The player!
 */
class Player extends Entity {
    constructor(params: PlayerParams) {
        super(params);
        params.mapHandler.player = this;
        // Input listener
        window.addEventListener("keydown", event => this.handleInput(event));
    }

    handleInput(event:KeyboardEvent) {
        switch(event.key) {
            case "a":
            case "Left":
            case "ArrowLeft":
                this.step(-1, 0, 0);
                break;
            case "d":
            case "Right":
            case "ArrowRight":
                this.step(1, 0, 0);
                break;
            case "Up":
            case "w":
            case "ArrowUp":
                this.step(0, -1, 0);
                break;
            case "Down":
            case "s":
            case "ArrowDown":
                this.step(0, 1, 0);
                break;

        }
    }

    moveTo(x:number, y:number, z:number, immediate = false): boolean {
        const success = super.moveTo(x, y, z, immediate);
        this.mapHandler.recenter(this);
        return success;
    }
}

export default Player;
