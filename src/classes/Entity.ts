import { Sprite, utils } from "pixi.js"
import MapHandler from "./MapHandler"
import Tile from "./Tile"
import Logger from "./Logger"
import Player from "./Player"

type ActionTypes = "open";

export interface EntityParams {
    sprite: Sprite;
    mapHandler: MapHandler;
    x: number;
    y: number;
    z: number;
    hp?: number;
    acts?: boolean;
    blocksVision?: boolean;
    actionTypes?: ActionTypes[];
    actPeriod?:number;
}

/**
 * Something that walks around and moves. Takes up space. The player, critters, decorations, interactables.
 */
class Entity {
    mapHandler: MapHandler;
    sprite: Sprite;
    currentTile: Tile|null = null;
    x: number = 0;
    y: number = 0;
    z: number = 1;
    spriteX: number = 0;
    spriteY: number = 0;
    spriteSpeed: number;
    spriteMoving: boolean = false;
    blocksVision: boolean;
    hp: number;
    active: boolean = true;
    actionTypes: ActionTypes[];
    clock: number = 0;
    actPeriod: number;
    actionQueue: (()=>boolean)[] = [];
    constructor({sprite, mapHandler, x, y, z, hp=Infinity, acts=false, blocksVision=false, actionTypes=[], actPeriod=1000}:EntityParams) {
        this.sprite = sprite;
        this.mapHandler = mapHandler;
        if (acts) {
            this.mapHandler.addActor(this);
        }

        this.mapHandler.spriteContainer.addChild(this.sprite);
        this.sprite.visible = false;
        // Move self to starting location
        this.moveTo(x, y, z, true);
        this.hp = hp;
        this.blocksVision = blocksVision;
        this.actionTypes = actionTypes;
        this.actPeriod = actPeriod;
        this.spriteSpeed = 1 / (this.actPeriod);
    }

    // Move to a location
    moveTo(x:number, y:number, z:number, immediate = false): boolean {
        // Make sure it's possible to go there
        const tile = this.mapHandler.getTile(x,y,z);
        if (tile && tile.passable) {
            if (tile.entity) {
                // Something lives there. Act upon it. The recipient will figure out what to do.
                tile.entity.actUpon(this);
                return true;
            } else {
                // We can move! Go there now.
                this.x = x;
                this.y = y;
                this.z = z;
                if (this.currentTile) {
                    // Remove self from previous tile
                    this.currentTile.entity = null;
                }
                tile.entity = this;
                this.currentTile = tile;
                this.spriteX = x * this.mapHandler.tileScale;
                this.spriteY = y * this.mapHandler.tileScale;
                if (immediate) {
                    this.sprite.x = this.spriteX;
                    this.sprite.y = this.spriteY;
                } else {
                    // Figure out smooth sliding later. For now, still immediate.
                    this.spriteMoving = true;
                }
                // Update visibility
                this.setVisibility(this.currentTile.light);
                return true;
            }
        } else {
            return false;
        }
    }

    // Helper method to make stepping easier
    step(dx:number, dy:number, dz:number): boolean {
        return this.moveTo(this.x + dx, this.y + dy, this.z + dz);
    }

    // Get acted upon
    actUpon(actor:Entity) {
        this.actionTypes.forEach(actionType => {
            switch(actionType) {
                case "open":
                    let rememberTile:Tile = null;
                    if (this.currentTile) {
                        rememberTile = this.currentTile;
                        // Remove self from previous tile
                        this.currentTile.entity = null;
                        this.currentTile = null;
                        this.mapHandler.updateVision();

                        if (actor instanceof Player) {
                            Logger.getInstance().sendMessage("You open the door.");
                        } else if (rememberTile && rememberTile.visible) {
                            Logger.getInstance().sendMessage("The door opens.");
                        }
                    }
                    this.sprite.visible = false;

                    if (rememberTile) {
                        const closeAction = () => {
                            if (!rememberTile.entity) {
                                this.currentTile = rememberTile;
                                this.currentTile.entity = this;
                                this.mapHandler.updateVision();
                                if (rememberTile.visible) {
                                    Logger.getInstance().sendMessage("The door closes.");
                                }
                            } else {
                                return false;
                            }
                        }
                        this.actionQueue.push(closeAction);
                        this.clock = 0;
                    }
                    break; 
            }
        });
    }

    // Act!
    act() {
        const action = this.actionQueue.shift();
        if (action) {
            if (!action()) {
                this.actionQueue.push(action);
            }
        }
    }

    tick(deltaMS:number) {
        this.clock += deltaMS;
        if (this.spriteMoving) {
            this.moveSprite(deltaMS);
        }

        if (this.clock >= this.actPeriod) {
            this.clock -= this.actPeriod;
            this.act();
        }
    }

    moveSprite(deltaMS:number) {
        const spriteStep = deltaMS * this.spriteSpeed * this.mapHandler.tileScale;
        const dist = [ this.spriteX - this.sprite.x, this.spriteY - this.sprite.y ];
        if (Math.abs(dist[0]) < spriteStep && Math.abs(dist[1]) < spriteStep) {
            this.sprite.x = this.spriteX;
            this.sprite.y = this.spriteY;
            this.spriteMoving = false;
        } else {
            if (Math.abs(dist[0]) < spriteStep) {
                this.sprite.x = this.spriteX;
            } else {
                this.sprite.x += spriteStep * Math.sign(dist[0]);
            }
            if (Math.abs(dist[1]) < spriteStep) {
                this.sprite.y = this.spriteY;
            } else {
                this.sprite.y += spriteStep * Math.sign(dist[1]);
            }
        }
    }

    // Harm this entity
    damage(damage:number, attacker:Entity = null) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        if (this.currentTile) {
            // Remove self from previous tile
            this.currentTile.entity = null;
            this.currentTile = null;
        }
        this.sprite.visible = false;
    }

    setVisibility(light:number) {
        if (light > 0) {
            const clampedLight = Math.max(Math.min(light, 1), 0);
            const tint = utils.rgb2hex([clampedLight, clampedLight, clampedLight]);
            this.sprite.tint = tint;
            this.sprite.visible = true;
        } else {
            this.sprite.visible = false;
        }
    }
}

export default Entity;
