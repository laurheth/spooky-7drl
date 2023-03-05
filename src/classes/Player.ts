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

        // Input listener
        window.addEventListener("keydown", event => this.handleInput(event));
    }

    handleInput(event:KeyboardEvent) {
        switch(event.key) {
            case "a":
            case "Left":
            case "ArrowLeft":
                this.step(-1, 0);
                break;
            case "d":
            case "Right":
            case "ArrowRight":
                this.step(1, 0);
                break;
            case "Up":
            case "w":
            case "ArrowUp":
                this.step(0, -1);
                break;
            case "Down":
            case "s":
            case "ArrowDown":
                this.step(0, 1);
                break;

        }
    }
}

export default Player;
