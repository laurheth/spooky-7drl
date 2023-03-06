import Tile from "./Tile"

interface VisionHandlerParams {
    range:number;
    getTileFunction:(position:number[])=>Tile;
}

// Helper functions
const getSqrRange = (start:number[], end:number[]) => (end[0] - start[0])**2 + (end[1] - start[1])**2;

/**
 * Seeing things is tough sometimes
 */
class VisionHandler {
    seen:Set<Tile>;
    recentlyUnseen:Set<Tile>;
    range:number;
    sqrRange:number;
    getTileFunction:(position:number[])=>Tile;
    constructor({range, getTileFunction}:VisionHandlerParams) {
        this.seen = new Set();
        this.range = range;
        this.getTileFunction = getTileFunction;
        this.sqrRange = range**2;
        this.recentlyUnseen = new Set();
    }

    see(position:number[]) {
        // Move currently visible thing to the unsee set
        this.prepareToUnsee();

        for (let x = position[0] - this.range; x <= position[0] + this.range; x++) {
            for (let y = position[1] - this.range; y <= position[1] + this.range; y++) {
                this.lineCast(position, [x, y, position[2]]);
            }
        }

        // Unsee things that should be unseen
        this.unsee();
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
            const tile:Tile = this.getTileFunction(current.map(x=>Math.round(x)));
            if (!this.seen.has(tile)) {
                tile.see((1 - r / this.range)**2);
                this.seen.add(tile);
                this.recentlyUnseen.delete(tile);
            }
            if (!tile.seeThrough) {
                break;
            }
        }
    }
}

export default VisionHandler;
