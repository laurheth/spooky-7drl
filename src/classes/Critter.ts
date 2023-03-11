import { Sprite, Texture } from "pixi.js"
import Entity from "./Entity"
import Player from "./Player"
import Game from "./Game"
import MapHandler from "./MapHandler"
import { critterTypes, CritterAction, objectFactory, itemFactory } from "../util/entityTypes"
import { randomElement } from "../util/randomness";
import Logger from "./Logger"

interface CritterParams {
    critterType: keyof typeof critterTypes;
    mapHandler: MapHandler;
    x: number;
    y: number;
    z: number;
}

/**
 * An AI entity that moves around, does stuff, is mean to the player sometimes.
 */
class Critter extends Entity {

    stepsUntilTaskSwitch: number = 0;
    task: CritterAction;
    idleActions: CritterAction[];
    activeActions: CritterAction[];
    awareness: number;
    persistence: number;
    awake: number = 0;
    target: {x:number, y:number} = null;
    home: {x:number, y:number} = null;
    previousStep:number[] = [0, 0];
    team:number = 1;
    path:number[][] = [];
    unseenSounds:string[];
    seenSounds:string[];
    volume:number;
    soundDelay:number = 0;
    corpseObject:string;
    dropItem:string;
    awakeSprite:string;
    sleepSprite:string;
    currentSprite:string;
    constructor({critterType, x, y, z, ...rest}:CritterParams) {
        const critterDetails = critterTypes[critterType];
        super({
            sprite: Sprite.from(critterDetails.spriteName),
            hp: critterDetails.hp,
            actPeriod: critterDetails.actPeriod,
            movePeriod: critterDetails.movePeriod,
            acts: true,
            x: x,
            y: y,
            z: z,
            ...rest,
            name: critterDetails.name
        });
        this.home = {x:x,y:y};
        this.idleActions = critterDetails.idleActions ? critterDetails.idleActions : ["randomStep"];
        this.activeActions = critterDetails.activeActions ? critterDetails.activeActions : ["walkToTarget"];
        this.awareness = critterDetails.awareness ? critterDetails.awareness : 0.5;
        this.persistence = critterDetails.persistence ? critterDetails.persistence : 10;
        this.actionTypes = critterDetails.actionTypes ? critterDetails.actionTypes : ["violence"];
        this.entityFlags = critterDetails.entityFlags ? critterDetails.entityFlags : [];
        this.strength = critterDetails.strength ? critterDetails.strength : 1;
        this.volume = critterDetails.volume ? critterDetails.volume : 1;
        this.unseenSounds = critterDetails.unseenSounds ? critterDetails.unseenSounds : [];
        this.seenSounds = critterDetails.seenSounds ? critterDetails.seenSounds : [];

        if (critterDetails.corpseObject) {
            this.corpseObject = critterDetails.corpseObject;
            this.removeOnDeath = true;
        }
        if (critterDetails.dropItem) {
            this.dropItem = critterDetails.dropItem;
            this.removeOnDeath = true;
        }
        if (critterDetails.awakeSpriteName) {
            this.awakeSprite = critterDetails.awakeSpriteName;
            this.sleepSprite = critterDetails.spriteName;
            this.currentSprite = this.sleepSprite;
        }
    }

    act() {
        super.act();
        if (!this.active) {
            return;
        }
        if (this.awake > 0) {
            this.observe(this.awareness * this.awake);
            if (this.currentSprite && this.currentSprite !== this.awakeSprite) {
                this.currentSprite = this.awakeSprite;
                this.sprite.texture = Texture.from(this.awakeSprite);
            }
        } else {
            this.observe(this.awareness);
            if (this.currentSprite && this.currentSprite !== this.sleepSprite) {
                this.currentSprite = this.sleepSprite;
                this.sprite.texture = Texture.from(this.sleepSprite);
            }
        }
        if (this.stepsUntilTaskSwitch > 0 && this.task) {
            this.stepsUntilTaskSwitch--;
            this[this.task](this.target);
        } else {
            let action:CritterAction;
            if (this.awake <= 0) {
                action = randomElement(this.idleActions);
            } else {
                action = randomElement(this.activeActions);
            }
            this.task = action;
            this[action](this.target);
        }
        // Make some noise
        if (this.soundDelay < 0 && (!this.currentSprite || this.awake > 0)) {
            this.mapHandler.sound(
                {
                    x: this.x,
                    y: this.y
                },
                {
                    seen: randomElement(this.seenSounds),
                    unseen: randomElement(this.unseenSounds)
                },
                this.volume,
                false
            );
            this.soundDelay = 5 + 10*Math.random();
        } else {
            this.soundDelay--;
        }
        if (this.awake > 0 && this.currentSprite && this.currentSprite !== this.awakeSprite) {
            this.sprite.texture = Texture.from(this.awakeSprite);
        } else if (this.awake < 0 && this.currentSprite && this.currentSprite !== this.sleepSprite) {
            this.sprite.texture = Texture.from(this.sleepSprite);
        }
    }

    die(): void {
        super.die();
        if (this.corpseObject) {
            objectFactory({
                x: this.x,
                y: this.y,
                z: this.z
            }, this.corpseObject, this.mapHandler);
        }
        if (this.dropItem) {
            itemFactory({
                x: this.x,
                y: this.y,
                z: this.z
            }, this.dropItem, this.mapHandler);
        }
    }

    // Can we detect the player?
    observe(awareAmount:number, manualTarget:{x:number, y:number} = null, manualLight=0) {
        const currentAwakeState = this.awake;
        if (!manualLight && !this.currentTile) {
            return;
        }
        if (currentAwakeState > 0 && awareAmount < 0) {
            awareAmount = -awareAmount;
        }
        if (Math.random() < awareAmount * (manualLight ? manualLight : Math.max(0,this.currentTile.light))) {
            this.awake = this.persistence;
            if (manualTarget) {
                this.target = {...manualTarget};
            } else {
                const player = Game.getInstance().player;
                if (this.currentTile.visible && player) {
                    this.target = {
                        x: player.x,
                        y: player.y
                    }
                }
            }
        } else {
            this.awake--;
        }
        if (currentAwakeState < 0 && this.awake > 0) {
            // Force a task switch
            this.stepsUntilTaskSwitch = -1;
            if (this.currentTile && this.currentTile.visible) {
                Logger.getInstance().sendMessage("You hear a shout!", {important:true});
            }
        }
    }

    step(dx: number, dy: number, dz: number): boolean {
        if (dx || dy || dz) {
            this.previousStep = [dx, dy, dz];
        }
        if (dx > 0) {
            this.sprite.scale.x = 1;
            this.sprite.pivot.x = 0;
        } else if (dx < 0) {
            this.sprite.scale.x = -1;
            this.sprite.pivot.x = 32;
        }
        return super.step(dx, dy, dz);
    }

    pause() {
        this.clock -= Math.random() * this.actPeriod;
    }

    randomStep() {
        const [dx, dy] = randomElement([[-1,0],[1,0],[0,1],[0,-1]]);
        this.step(dx, dy, 0);
    }

    damage(damage: number, attacker?: Entity): void {
        super.damage(damage, attacker);
        if (this.awake < 0) {
            this.observe(100);
        }
    }

    // Skedaddle, we are not a fighty critter
    runFromTarget(target:{x:number, y:number}) {
        if (target) {
            const distance = [target.x - this.x, target.y - this.x];
            // Fight if we must
            if (Math.abs(distance[0]) + Math.abs(distance[1]) <= 1) {
                this.walkToTarget(target);
            } else {
                // Otherwise, run
                let [dx, dy] = [0,0];
                let lowestLight = Infinity;
                [[-1,0],[1,0],[0,-1],[0,1]].forEach(([ddx, ddy])=>{
                    const tile = this.mapHandler.getTile(this.x + ddx, this.y + ddy, this.z);
                    if (tile && tile.passable && tile.light) {
                        if (tile.light < lowestLight) {
                            lowestLight = tile.light;
                            dx = ddx;
                            dy = ddy;
                        }
                    }
                });
                if (!this.step(dx, dy, 0)) {
                    this.walkToTarget(target);
                }
            }
        }
    }

    // Find a friend who needs help and help them
    healFriends() {
        const deadFriends = this.mapHandler.actors.filter(actor => {
            if (actor instanceof Critter) {
                if (!actor.active && !actor.entityFlags.includes("undying")) {
                    if (actor.currentTile && actor.currentTile.passable) {
                        return true;
                    }
                }
            }
            return false;
        }) as Critter[];
        deadFriends.sort((friendA, friendB) => {
            const distA = Math.abs(friendA.x - this.x) + Math.abs(friendA.y - this.y);
            const distB = Math.abs(friendB.x - this.x) + Math.abs(friendB.y - this.y);
            return distA - distB;
        });

        const deadFriend = deadFriends.length > 0 ? deadFriends[0] : null;
        
        // Did we find a friend in need?
        if (deadFriend && deadFriend.x && deadFriend.y) {
            this.target = {
                x: deadFriend.x,
                y: deadFriend.y
            }
        }
        if (deadFriend && this.target) {
            const distance = Math.abs(this.target.x - this.x) + Math.abs(this.target.y - this.y);
            if (distance <= 1) {
                // We're here! Do a heal.
                if (Math.random() > 0.5) {
                    deadFriend.active = true;
                    deadFriend.hp = Math.min(deadFriend.maxHp, Math.max(40, deadFriend.maxHp / 2));
                    deadFriend.sprite.zIndex = 0;
                    deadFriend.mapHandler.spriteContainer.sortChildren();
                    if (this.currentTile && this.currentTile.visible) {
                        Logger.getInstance().sendMessage(`${deadFriend.name} has been repaired by ${this.name}!`,{tone:"bad"});
                    }
                    this.target = null;
                }
            } else {
                // Not there yet. Go to them!
                this.pathToTarget(this.target);
            }
        } else {
            this.randomStep();
        }
    }

    walkToTarget(target:{x:number, y:number}, updateMainTarget:boolean = true) {
        if (updateMainTarget && target && target.x === this.x && target.y === this.y) {
            this.target = null;
        }
        // We have a target. Go there!
        if (target) {
            const {x, y} = target;
            let [distX, distY] = [x - this.x, y - this.y];
            if (this.awake > 0) {
                this.stepsUntilTaskSwitch = Math.abs(distX) + Math.abs(distY);
            }
            if (Math.abs(distX) > Math.abs(distY)) {
                if(!this.step(Math.sign(distX), 0, 0)) {
                    if(!this.step(0, Math.sign(distY), 0)) {
                        this.randomStep();
                    }
                }
            } else {
                if(!this.step(0, Math.sign(distY), 0)) {
                    if (!this.step(Math.sign(distX), 0, 0)) {
                        this.randomStep();
                    }
                }
            }
        } else {
            // Lost them. Try our previous step, maybe that'll get us somewhere
            if (!this.step(this.previousStep[0], this.previousStep[1], this.previousStep[2])) {
                this.randomStep();
            }
        }
    }

    fireToTarget(target:{x:number, y:number}, updateMainTarget:boolean = true) {
        // Consider firing
        if (this.currentTile && this.currentTile.visible) {
            if (target && (this.x === target.x || this.y === target.y)) {
                if (Math.random() > 0.5) {
                    // Fire!
                    const fireSprite = Sprite.from("sprites/fireball.png");
                    this.mapHandler.spriteContainer.addChild(fireSprite);
                    fireSprite.x = this.sprite.x;
                    fireSprite.y = this.sprite.y;
                    let [x,y,z] = [this.x, this.y,this.z];
                    const [dx,dy] = [Math.sign(target.x - this.x), Math.sign(target.y - this.y)];
                    if (dx === 0 && dy === 0) {
                        return;
                    }
                    Logger.getInstance().sendMessage(`The ${this.name} launches a fireball!`);
                    const fireballSpeed = this.spriteSpeed * 2;
                    const fireballStepPeriod = 1 / fireballSpeed;
                    let timer = fireballStepPeriod / 2;
                    // Pseudoactor to track the fireball
                    const pseudoActor = {tick:(deltaMS:number) => {
                        timer -= deltaMS;
                        fireSprite.x += dx * this.mapHandler.tileScale * deltaMS * fireballSpeed;
                        fireSprite.y += dy * this.mapHandler.tileScale * deltaMS * fireballSpeed;
                        if (timer < 0) {
                            timer += fireballStepPeriod;
                            x += dx;
                            y += dy;
                        }
                        const currentTile = this.mapHandler.getTile(x, y, z);
                        fireSprite.visible = currentTile.visible;
                        if (!currentTile || !currentTile.passable) {
                            // Hit a wall
                            pseudoActor.destroySelf();
                        } else if (currentTile.entity && currentTile.entity && currentTile.entity !== this) {
                            // Hit an entity other than the sender
                            currentTile.entity.damage(2 * this.damageAmount(), this);
                            if (currentTile.visible) {
                                if (currentTile.entity instanceof Critter) {
                                    Logger.getInstance().sendMessage(`The fireball hits ${currentTile.entity.name}!`);
                                } else if (currentTile.entity instanceof Player) {
                                    Logger.getInstance().sendMessage(`The fireball hits ${currentTile.entity.name}!`, {tone:"bad"});
                                }
                            }
                            pseudoActor.destroySelf();
                        }
                    }, destroySelf: () => {
                        const index = this.mapHandler.actors.indexOf(pseudoActor);
                        if (index >= 0) {
                            this.mapHandler.actors.splice(index, 1);
                        }
                        this.mapHandler.spriteContainer.removeChild(fireSprite);
                        fireSprite.destroy();
                    }};

                    this.mapHandler.actors.push(pseudoActor);
                    return;
                }
            }
        }
        // Not firing. Just walk.
        this.walkToTarget(target, updateMainTarget);
    }

    // Use pathfinding to get to the target
    pathToTarget(target:{x:number, y:number}) {
        // Check if we need to update the path
        if (this.path.length > 0) {
            if (target.x !== this.path[0][0] && target.y !== this.path[0][1]) {
                this.path = [];
            }
        }
        // Update the path!
        if (this.path.length <= 0) {
            if (!target || Math.abs(this.x - target.x) + Math.abs(this.y - target.y) <= 0) {
                this.stepsUntilTaskSwitch = -1;
                this.target = null;
            } else {
                this.path = this.mapHandler.getPath([this.x, this.y], [target.x, target.y]);
                this.path.pop(); // Pop off the end, because we don't need the starting point
                this.stepsUntilTaskSwitch = this.path.length;
                if (this.path.length < 0) {
                    this.target = null;
                }
            }
        }
        // No path?? Oh no.
        if (this.path.length <= 0) {
            if (this.previousStep) {
                this.step(this.previousStep[0], this.previousStep[1], 0);
            } else {
                this.pause();
            }
        } else {
            // Step to the next step in the path
            const nextTarget = this.path[this.path.length-1];
            const [dx, dy] = [nextTarget[0] - this.x, nextTarget[1] - this.y];
            if (Math.abs(dx) + Math.abs(dy) === 1) {
                this.step(dx, dy, 0);
                // Check if we got there successfully. If so, remove the step from the path.
                if (nextTarget[0] === this.x && nextTarget[1] === this.y) {
                    this.path.pop();
                }
            } else {
                // Uhh somthing is wrong here.
                this.path = [];
            }
        }
    }

    // Patrol the map
    patrol() {
        if (this.mapHandler.roomCenters && !this.target) {
            // Choose a random room and path there.
            const target = randomElement(this.mapHandler.roomCenters);
            if (target) {
                this.target = {
                    x: target[0],
                    y: target[1],
                }
            }
        }
        this.pathToTarget(this.target);
    }

    // Path to home
    pathToHome() {
        if (this.home && (this.home.x !== this.x || this.home.y !== this.y)) {
            this.target = {
                x: this.home.x,
                y: this.home.y,
            }
            this.pathToTarget(this.target);
        } else {
            this.pause();
        }
    }

    deathMessage(): void {
        Logger.getInstance().sendMessage(`${this.name} dies!`, {tone:"good"});
    }
}

export default Critter;
