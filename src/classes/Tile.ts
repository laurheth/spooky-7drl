import { Sprite, Container } from "pixi.js"
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
    passable:boolean;
    seeThrough:boolean;
    sprite:Sprite;
    visible:boolean;
    seen:boolean;
    entity: Entity|null;

    constructor({passable, seeThrough, sprite, x, y, parent}:TileParams) {
        this.passable = passable;
        this.seeThrough = seeThrough;
        this.seen = false; // Start not previously seen
        this.visible = false; // Start not currently visible
        this.entity = null; // Start with no resident entity
        this.sprite = sprite;
        parent.addChild(this.sprite);
        this.sprite.x = x;
        this.sprite.y = y;
    }
}

export default Tile;
