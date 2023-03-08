import { randomElement } from "./randomness"
import Pathfinder from "../classes/Pathfinder"
import { critterTypes } from "./entityTypes";

interface MapGenParams {
    minRoomSize?: number;
    maxRoomSize?: number;
    targetRoomCount?: number;
    multipleConnectionChance?: number;
}

interface TilePlan {
    type: '#'|'.'|'+';
    roomId: number;
}

interface RoomData {
    center: number[];
    xBounds: [number, number];
    yBounds: [number, number];
    expectedFloor: number;
    expectedWall: number;
}

interface DecorationData {
    name: "bloodPool";
    key: string;
}

interface CritterData {
    name: keyof typeof critterTypes;
    key: string;
}

interface ItemData {
    name: "sword";
    key: string;
}

/**
 * Cool function to generate the map
 */
export default function mapGenerator({minRoomSize=5, maxRoomSize=10, targetRoomCount=10, multipleConnectionChance=0.5}:MapGenParams = {}) {
    const map = new Map<string, TilePlan>();
    const roomCenters:RoomData[] = [];
    const roomConnectionTracker:number[][] = [];
    const entitySpots:string[] = [];
    let maxY = 0;
    const floor = 0;
    const mapWidth = Math.ceil(maxRoomSize * Math.sqrt(targetRoomCount));

    // Use a "drop" algorithm to fill in the rooms
    for(let roomCount = 0; roomCount < targetRoomCount; roomCount++) {
        // Pick a room size
        const width = Math.floor(Math.random() * (maxRoomSize - minRoomSize)) + minRoomSize;
        const height = Math.floor(Math.random() * (maxRoomSize - minRoomSize)) + minRoomSize;

        // Initial conditions before dropping
        const x = Math.floor(Math.random() * (mapWidth - width));
        let y = maxY;

        // Descend until we hit something, or the floor
        while (y > floor) {
            let hitSomething = false;
            for (let i = -2; i <= width + 1; i++) {
                hitSomething ||= map.has(`${i+x},${y-2}`);
            }
            if (hitSomething) {
                break;
            }
            y--;
        }

        // Compute room center
        const roomCenter = [Math.floor(x + width / 2), Math.floor(y + height / 2)];
        roomConnectionTracker.push([]);

        // Build the room
        let floors = 0;
        let walls = 0;
        for (let i=0; i<width; i++) {
            for (let j=0; j<height; j++) {
                const key = `${i+x},${j+y}`;
                if (i===0 || j===0 || i===(width-1) || j===(height-1)) {
                    if (!map.has(key)) {
                        walls++;
                        map.set(key, {type:'#', roomId:roomCount});
                    } else if (map.get(key).type === '.') {
                        floors++;
                        map.set(key, {type:'+', roomId:roomCount});
                    }
                } else {
                    map.set(key, {type:'.', roomId:roomCount});
                    entitySpots.push(key);
                }
            }
        }

        maxY = Math.max(maxY, y + height + 2);
        // Record roomCenter for future hallway math
        roomCenters.push({
            center: roomCenter,
            xBounds: [x, x+width-1],
            yBounds: [y, y+height-1],
            expectedFloor: floors,
            expectedWall: walls
        });
    }

    // We're going to use pathfinding to connect hallways
    let currentPathingIds:number[] = [];
    const pathfinder = new Pathfinder(([dx, dy])=>{
        return Math.abs(dx) + Math.abs(dy)
    }, ([x, y]) => {
        const options = [[-1,0],[1,0],[0,1],[0,-1]];
        return options.filter(option => {
            const optionKey:string = `${x+option[0]},${y+option[1]}`;
            return !map.has(optionKey) || map.get(optionKey).roomId < 0 || currentPathingIds.includes(map.get(optionKey).roomId);
        }).map(option => [option[0] + x, option[1] + y]);
    });

    // Lets get er done
    const neededWalls = new Set<string>();
    const possibleDoors = new Set<string>();
    roomCenters.forEach((roomData, index) => {
        const roomCenter = roomData.center;
        const options = roomCenters.map((x,i) => i).filter(otherIndex => !roomConnectionTracker[index].includes(otherIndex));
        options.sort((indexA, indexB) => {
            const roomA:number[] = roomCenters[indexA].center;
            const roomB:number[] = roomCenters[indexB].center;
            return (Math.abs(roomA[0] - roomCenter[0]) + Math.abs(roomA[1] - roomCenter[1]) - Math.abs(roomB[0] - roomCenter[0]) + Math.abs(roomB[1] - roomCenter[1]))
        });

        const connections = Math.min((multipleConnectionChance > Math.random()) ? 2 : 1, options.length - 1);
        for (let i=0; i<connections; i++) {
            const otherIndex = options[i+1];
            const otherCenter = roomCenters[otherIndex].center;
            currentPathingIds = [index, otherIndex];
            const path = pathfinder.findPath(roomCenter, otherCenter);
            if (path.length > 0) {
                roomConnectionTracker[index].push(otherIndex);
                roomConnectionTracker[otherIndex].push(index);
            }
            path.forEach(([hx, hy]) => {
                const key = `${hx},${hy}`;
                if (map.has(key)) {
                    const tile = map.get(key);
                    if (tile.type === '#') {
                        if (tile.roomId != -1) {
                            possibleDoors.add(key);
                            tile.type = '+';
                        } else {
                            tile.type = '.';
                        }
                    }
                } else {
                    map.set(key, {type:'.', roomId:-1});
                }
                // Record walls we may need to add.
                for (let wx=-1; wx<2; wx++) {
                    for (let wy=-1; wy<2; wy++) {
                        neededWalls.add(`${hx + wx},${hy + wy}`);
                    }
                }
            });
        }
    });

    // Add extra walls where we need them
    neededWalls.forEach(key => {
        if (!map.has(key)) {
            map.set(key, {type:'#', roomId:-1});
        }
    });

    // Prune invalid doors
    const doorsToPrune = new Set<string>();
    possibleDoors.forEach(key => {
        const spotIndex = entitySpots.indexOf(key);
        if (spotIndex >= 0) {
            entitySpots.splice(spotIndex, 1);
        }
        const [x, y] = key.split(',').map(x=>parseInt(x));
        [[-1,0],[1,0],[0,1],[0,-1]].forEach(step => {
            const otherKey = `${x + step[0]},${y + step[1]}`;
            if (possibleDoors.has(otherKey)) {
                doorsToPrune.add(key);
            }
        });
    });

    doorsToPrune.forEach(notADoor=>{
        map.get(notADoor).type = '.';
    });

    // Which rooms are deadends? Might be useful knowledge
    const deadends:number[] = [];
    roomCenters.forEach((roomData, index) => {
        let floorCount = 0;
        let wallCount = 0;
        for (let x=roomData.xBounds[0]; x<=roomData.xBounds[1]; x++) {
            for (let y=roomData.yBounds[0]; y<=roomData.yBounds[1]; y++) {
                const key = `${x},${y}`;
                if (!map.has(key)) {
                    continue;
                }
                if (map.get(key).type === '.') {
                    floorCount++;
                } else if (map.get(key).type === '#') {
                    wallCount++;
                }
            }
        }
        if (wallCount >= roomData.expectedWall - 1) {
            deadends.push(index);
        }
    });

    const decorations:DecorationData[] = [];
    // Splatter some blood
    const bloodSpots = new Set<string>();
    for (let i=0; i<20; i++) {
        bloodSpots.add(randomElement(entitySpots));
    }
    bloodSpots.forEach(spot => {
        decorations.push({
            key: spot,
            name: "bloodPool"
        })
    });

    // Add some items
    const items:ItemData[] = [];
    for (let i=0; i<20; i++) {
        items.push({
            name: "sword",
            key: randomElement(entitySpots),
        })
    }

    // Add some critters
    const critters:CritterData[] = [];
    for (let i=0; i<10; i++) {
        critters.push({
            name: "testCritter",
            key: randomElement(entitySpots, true)
        })
    }
    critters.push({
        name: "bigBad",
        key: randomElement(entitySpots, true)
    })

    return {
        map: map,
        roomCenters: roomCenters,
        playerStart: randomElement(entitySpots),
        decorations: decorations,
        items: items,
        critters: critters
    }
}

/**
 * Function to draw a single hallway
 */
function drawHallway(start:number[], end:number[], map:Map<string, TilePlan>, useRoomId:number=-1) {
    const neededWalls = new Set<string>();
    const [tx, ty] = end;
    let [hx, hy] = start;
    let dx = 0;
    let dy = 0;

    // Initial direction of travel
    let directionSwitchDone = false;
    if (Math.abs(hx - tx) < Math.abs(hy - ty)) {
        dy = 0;
        dx = tx > hx ? 1 : -1;
    } else {
        dx = 0;
        dy = ty > hy ? 1 : -1;
    }

    // Draw the hallway
    while (hx !== tx || hy !== ty) {
        // Change direction of travel when we need to
        if (!directionSwitchDone && (hx === tx || hy === ty)) {
            if (hx !== tx) {
                dy = 0;
                dx = tx > hx ? 1 : -1;
            } else {
                dx = 0;
                dy = ty > hy ? 1 : -1;
            }
            directionSwitchDone = true;
        }

        hx += dx;
        hy += dy;
        const key = `${hx},${hy}`;
        if (map.has(key)) {
            const tile = map.get(key);
            if (tile.type === '#') {
                tile.type = '.';
            }
        } else {
            map.set(key, {type:'.', roomId:useRoomId});
        }
        // Record walls we may need to add.
        for (let wx=-1; wx<2; wx++) {
            for (let wy=-1; wy<2; wy++) {
                neededWalls.add(`${hx + wx},${hy + wy}`);
            }
        }
    }

    // Add extra walls where we need them
    neededWalls.forEach(key => {
        if (!map.has(key)) {
            map.set(key, {type:'#', roomId:useRoomId});
        }
    });
}
