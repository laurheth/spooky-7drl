import { Sprite } from "pixi.js"
import UI from "./UI"

interface InteractiveParams {
    name?: string;
    messages: string[];
    spritePath: string;
}

/**
 * Something interactive. Intending for notes in the world, but maybe expandable if I have time.
 */
export default class Interactive {
    name: string;
    messages: string[];
    sprite: Sprite;
    constructor({name = "handwritten note", messages, spritePath}:InteractiveParams) {
        this.name = name;
        this.messages = messages;
        this.sprite = Sprite.from(spritePath);
    }

    use() {
        UI.getInstance().showSpecialMessageModal({
            headingText: this.name,
            body: this.messages,
        });
    }
}