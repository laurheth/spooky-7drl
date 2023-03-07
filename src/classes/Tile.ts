import { Sprite, Container, utils } from "pixi.js"
import Entity from "./Entity"

interface TileParams {
    passable: boolean;
    seeThrough: boolean;
    sprite: Sprite;
    parent: Container;
    x: number;
    y: number;
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

    constructor({passable, seeThrough, sprite, x, y, parent}:TileParams) {
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
    }

    see(light:number) {
        this.light = light;
        this.visible = true;
        this.seen = true;
        this.sprite.visible = true;
        const clampedLight = Math.max(Math.min(light, 1), 0);
        const tint = utils.rgb2hex([clampedLight, clampedLight, clampedLight]);
        this.sprite.tint = tint;
    }

    unsee() {
        this.visible = false;
        this.sprite.visible = false;
        this.light = -1;
    }

    get seeThrough(): boolean {
        return this._seeThrough && (!this.entity || !this.entity.blocksVision);
    }
}

export default Tile;
