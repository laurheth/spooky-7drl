/**
 * Pathfinding algorithm, adapted from a toy model I made for a presentation party over a year ago.
 * THAT version was originally adapted from A*, from memory.
 * It's probably fine.
 */

// Helper function to get dx & dy
const getDelta = (position:number[], target:number[]) => position.map((x, i) => target[i] - x);
const stepCost = ([dx, dy]:number[]) => (dx !== 0 && dy !== 0) ? 1.2 : 1;
const hashPosition = (position:number[]) => position.join(",");

class NodeValue {
    // Which position is this?
    position:number[];
    // How much did it cost to get here?
    cost:number;
    // What is the heuristic?
    heuristicValue:number;
    // What node did we come from to get here? So we can follow the breadcrumbs backwards later.
    previousNode:NodeValue|null;

    constructor(position:number[], previousNode:NodeValue|null, heuristicValue:number, edgeCost = 1) {
        this.position = position;
        this.previousNode = previousNode;
        this.heuristicValue = heuristicValue;
        if (previousNode) {
            this.cost = previousNode.cost + edgeCost;
        } else {
            this.cost = 0;
        }
    }

    totalCost() {
        return this.cost + this.heuristicValue;
    }

    copyBetterNode(betterNode:NodeValue) {
        this.cost = betterNode.cost;
        this.previousNode = betterNode.previousNode;
    }
}

class Pathfinder {
    heuristic:(position:Array<number>)=>number;
    neighbourGetter:(position:Array<number>)=>Array<Array<number>>;

    constructor(heuristic:(position:Array<number>)=>number, neighbourGetter:(position:Array<number>)=>Array<Array<number>>) {
        this.heuristic = heuristic;
        this.neighbourGetter = neighbourGetter;
    }

    findPath(start:number[], end:number[]):number[][] {
        // Add the starting position to the open set; it's the first one we're checking
        const closedSet:NodeValue[] = [];
        const openSet:NodeValue[] = [new NodeValue(start, null, this.heuristic(getDelta(start, end)))];

        // Helpful object to make avoiding duplicates easier
        const checkedTiles:{[key:string]:NodeValue} = {};
        checkedTiles[hashPosition(start)] = openSet[0];

        // Helpful variable to let us know if we did it or not
        let success = false;

        // While we have tiles left to check
        let limit = 0;
        while (openSet.length > 0) {
            // Get the lowest cost element in the openSet
            const node = openSet.pop() as NodeValue;
            // Add it to the closed set
            closedSet.push(node);
            // Is this the target?
            if (node.position.every((x,i) => x === end[i])) {
                // We found it!
                success = true;
                break;
            }
            // Nah, gotta keep looking. Add its neighbours to the open set.
            const neighbours = this.neighbourGetter(node.position);
            neighbours.forEach(neighbour => {
                // Define a node
                const newNode = new NodeValue(neighbour, node, this.heuristic(getDelta(neighbour, end)), stepCost(getDelta(neighbour, node.position)));
                const hash = hashPosition(neighbour);
                // Have we already looked at this tile?
                if (!checkedTiles[hash]) {
                    // Not a repeat! Add it to the open set
                    checkedTiles[hash] = newNode;
                    openSet.push(newNode);
                } else if (newNode.totalCost() < checkedTiles[hash].totalCost()) {
                    // This is a repeat, but we found a faster way to get here. Nice.
                    checkedTiles[hash].copyBetterNode(newNode);
                }
            });

            // Sort the open set, so that we can get the minimum cost next tile
            openSet.sort((a,b) => b.totalCost() - a.totalCost());

            // Upper limit of steps to avoid problems.
            limit++;
            if (limit > 500) {
                break;
            }
        }

        // We did it! Draw the path
        const path:number[][] = [];
        if (success) {
            let currentNode:NodeValue|null = closedSet[closedSet.length-1];
            while (currentNode) {
                // Each node points at the one it came from, just follow the arrows backwards!
                path.push(currentNode.position);
                currentNode = currentNode.previousNode;
            }
        }
        return path;
    }
}

export default Pathfinder;
