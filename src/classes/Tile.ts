import { Sprite, Container } from "pixi.js"

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

    constructor({passable, seeThrough, sprite, x, y, parent}:TileParams) {
        this.passable = passable;
        this.seeThrough = seeThrough;
        this.sprite = sprite;
        parent.addChild(this.sprite);
        this.sprite.x = x;
        this.sprite.y = y;
    }
}

export default Tile;
