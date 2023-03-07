import Tile from "./Tile"
import Entity from "./Entity";

interface VisionHandlerParams {
    range:number;
    getTileFunction:(position:number[])=>Tile;
}

const minLight = 0.05;

// Helper functions
const getSqrRange = (start:number[], end:number[]) => (end[0] - start[0])**2 + (end[1] - start[1])**2;

/**
 * Seeing things is tough sometimes
 */
class VisionHandler {
    seen:Set<Tile>;
    seenEntities:Set<Entity>;
    recentlyUnseen:Set<Tile>;
    toPostProcess:Map<Tile,number[]>;
    range:number;
    sqrRange:number;
    lightScale:number;
    getTileFunction:(position:number[])=>Tile;
    constructor({range, getTileFunction}:VisionHandlerParams) {
        this.seen = new Set();
        this.range = range;
        this.lightScale = 1 / (Math.sqrt(minLight) * range);
        console.log(this.lightScale);
        this.getTileFunction = getTileFunction;
        this.sqrRange = range**2;
        this.recentlyUnseen = new Set();
        this.seenEntities = new Set();
        this.toPostProcess = new Map();
    }

    getLightAmount(r:number) {
        r = Math.max(r, 0.01);
        const light = 1 / Math.pow(this.lightScale * r, 2);
        return Math.min(1, light);
    }

    see(position:number[]) {
        // Move currently visible thing to the unsee set
        this.prepareToUnsee();

        // See the starting spot
        const tile:Tile = this.getTileFunction(position.map(x=>Math.round(x)));
        if (tile.entity) {
            this.seenEntities.add(tile.entity);
        }
        tile.see(1);
        this.seen.add(tile);
        this.recentlyUnseen.delete(tile);

        for (let x = position[0] - this.range; x <= position[0] + this.range; x++) {
            for (let y = position[1] - this.range; y <= position[1] + this.range; y++) {
                this.lineCast(position, [x, y, position[2]]);
            }
        }

        // Postprocess
        this.postProcess(position);

        // Unsee things that should be unseen
        this.unsee();

        // Update known entities
        this.seenEntities.forEach(entity => {
            if (entity.currentTile) {
                entity.setVisibility(entity.currentTile.light);
            } else {
                entity.setVisibility(-1);
            }
        });
    }

    prepareToUnsee() {
        this.seen.forEach(tile => {
            this.recentlyUnseen.add(tile);
        })
        this.seen.clear();
    }

    unsee() {
        this.recentlyUnseen.forEach(tile => {
            tile.unsee();
        })
        this.recentlyUnseen.clear();
    }

    lineCast(start:number[], end:number[]) {
        const squareDist = getSqrRange(start, end);
        if (squareDist > this.sqrRange) {
            return;
        }
        const distance = Math.sqrt(squareDist);
        let current = [...start];
        const direction = [(end[0] - start[0]) / distance, (end[1] - start[1]) / distance];
        for (let r=0; r<distance; r++) {
            direction.forEach((delta, i) => current[i] += delta);
            const roundedPosition = current.map(x=>Math.round(x));
            const tile:Tile = this.getTileFunction(roundedPosition);
            if (tile.entity) {
                this.seenEntities.add(tile.entity);
            }
            if (!this.seen.has(tile)) {
                const light = this.getLightAmount(r);
                tile.see(light);
                this.seen.add(tile);
                this.recentlyUnseen.delete(tile);

                if (tile.seeThrough) {
                    for (let i=-1;i<2;i++) {
                        for (let j=-1;j<2;j++) {
                            const neighbourStep = [...roundedPosition];
                            neighbourStep[0] += i;
                            neighbourStep[1] += j;
                            const postProcessTile:Tile = this.getTileFunction(neighbourStep);
                            if (postProcessTile && !postProcessTile.seeThrough) {
                                this.toPostProcess.set(postProcessTile, neighbourStep);
                            }
                        }
                    }
                }
            }
            if (!tile.seeThrough) {
                break;
            }
        }
    }

    postProcess(position:number[]) {
        for (const entry of this.toPostProcess) {
            const [tile, targetPosition] = entry;
            if (!this.seen.has(tile)) {
                const r = Math.sqrt(getSqrRange(position, targetPosition));
                const light = this.getLightAmount(r);
                tile.see(light);
                this.seen.add(tile);
                this.recentlyUnseen.delete(tile);
            }
        }
        this.toPostProcess.clear();
    }
}

export default VisionHandler;
