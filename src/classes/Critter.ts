import { Sprite } from "pixi.js"
import Entity from "./Entity"
import Game from "./Game"
import MapHandler from "./MapHandler"
import { critterTypes, CritterAction } from "../util/entityTypes"
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
    previousStep:number[] = [0, 0];

    constructor({critterType, ...rest}:CritterParams) {
        const critterDetails = critterTypes[critterType];
        super({
            sprite: Sprite.from(critterDetails.spriteName),
            hp: critterDetails.hp,
            actPeriod: critterDetails.actPeriod,
            movePeriod: critterDetails.movePeriod,
            acts: true,
            ...rest
        });
        this.idleActions = critterDetails.idleActions ? critterDetails.idleActions : ["randomStep"];
        this.activeActions = critterDetails.activeActions ? critterDetails.activeActions : ["walkToTarget"];
        this.awareness = critterDetails.awareness ? critterDetails.awareness : 0.5;
        this.persistence = critterDetails.persistence ? critterDetails.persistence : 10;
    }

    act() {
        if (this.awake > 0) {
            this.observe(this.awareness * this.awake);
        } else {
            this.observe(this.awareness);
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
    }

    // Can we detect the player?
    observe(awareAmount:number, manualTarget:{x:number, y:number} = null) {
        const currentAwakeState = this.awake;
        if (Math.random() < awareAmount * this.currentTile.light) {
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
        return super.step(dx, dy, dz);
    }

    pause() {
        this.clock -= Math.random() * this.actPeriod;
    }

    randomStep() {
        const [dx, dy] = randomElement([[-1,0],[1,0],[0,1],[0,-1]]);
        this.step(dx, dy, 0);
    }

    walkToTarget(target:{x:number, y:number}) {
        if (target && target.x === this.x && target.y === this.y) {
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

    pathToTarget() {
        // TODO
    }

    patrol() {
        // TODO
    }
}

export default Critter;
