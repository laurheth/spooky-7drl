import { Sprite } from "pixi.js"
import UI from "./UI"
import Game from "./Game"
import Logger from "./Logger"
import { itemFactory } from "../util/entityTypes";

interface InteractiveParams {
    name?: string;
    messages: string[];
    spritePath: string;
    item?: string;
}

/**
 * Something interactive. Intending for notes in the world, but maybe expandable if I have time.
 */
export default class Interactive {
    name: string;
    messages: string[];
    sprite: Sprite;
    item: string;
    constructor({name = "handwritten note", messages, spritePath, item}:InteractiveParams) {
        this.name = name;
        this.messages = messages;
        this.sprite = Sprite.from(spritePath);
        this.item = item;
    }

    use() {
        let handler:()=>void = undefined;
        const player = Game.getInstance().player;
        if (this.item && player) {
            const item = this.item;
            handler = () => {
                itemFactory({
                    x: player.x,
                    y: player.y,
                    z: player.z
                }, item, Game.getInstance().mapHandler);
                Logger.getInstance().sendMessage(`You notice a ${item} on the ground nearby!`, {tone:"good"});
            }
            this.item = null;
        }
        UI.getInstance().showSpecialMessageModal({
            headingText: this.name,
            body: this.messages,
            handler: handler
        });
    }
}