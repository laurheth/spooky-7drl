import { Sprite, Container, utils } from "pixi.js"
import Entity from "./Entity"
import Item from "./Item"

interface TileParams {
    passable: boolean;
    seeThrough: boolean;
    sprite: Sprite;
    parent: Container;
    x: number;
    y: number;
    levelExit?: boolean;
}

/**
 * Class to handle a single tile (a Class might be overkill. Reassess later.)
 */
class Tile {
    passable: boolean;
    _seeThrough: boolean;
    sprite: Sprite;
    visible: boolean;
    light: number;
    seen: boolean;
    entity: Entity|null;
    item: Item|null;
    decoration: Sprite;
    levelExit: boolean;

    constructor({passable, seeThrough, sprite, x, y, parent, levelExit = false}:TileParams) {
        this.passable = passable;
        this._seeThrough = seeThrough;
        this.seen = false; // Start not previously seen
        this.visible = false; // Start not currently visible
        this.entity = null; // Start with no resident entity
        this.sprite = sprite;
        this.sprite.visible = false;
        parent.addChild(this.sprite);
        this.sprite.x = x;
        this.sprite.y = y;
        this.light = 0;
        this.levelExit = levelExit;
    }

    see(light:number) {
        this.light = light;
        this.visible = light > 0;
        this.seen = this.seen || this.visible;
        this.sprite.visible = this.visible;
        const clampedLight = Math.max(Math.min(light, 1), 0);
        const tint = utils.rgb2hex([clampedLight, clampedLight, clampedLight]);
        this.sprite.tint = tint;
        if (this.decoration) {
            this.decoration.tint = tint;
        }
        if (this.item) {
            this.item.sprite.visible = this.visible;
            this.item.sprite.tint = tint;
        }
    }

    unsee() {
        this.visible = false;
        this.sprite.visible = false;
        this.light = -1;
        if (this.item) {
            this.item.sprite.visible = false;
        }
    }

    get seeThrough(): boolean {
        return this._seeThrough && (!this.entity || !this.entity.blocksVision);
    }

    addDecoration(decoration:Sprite, override:boolean = false) {
        if (override && this.decoration) {
            this.removeDecoration();
        }
        if (!this.decoration) {
            this.decoration = decoration
            this.sprite.addChild(decoration);
        }
    }

    removeDecoration() {
        if (this.decoration) {
            this.sprite.removeChild(this.decoration);
        }
        this.decoration = null;
    }
}

export default Tile;
