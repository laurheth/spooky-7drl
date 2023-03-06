import { randomElement } from "./randomness"

interface MapGenParams {
    minRoomSize?: number;
    maxRoomSize?: number;
    targetRoomCount?: number;
}

interface TilePlan {
    type: '#'|'.';
    roomId: number;
}

/**
 * Cool function to generate the map
 */
export default function mapGenerator({minRoomSize=5, maxRoomSize=10, targetRoomCount=10}:MapGenParams = {}) {
    const map = new Map<string, TilePlan>();
    const roomCenters:number[][] = [];
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
            for (let i = 0; i < width; i++) {
                hitSomething ||= map.has(`${i+x},${y}`);
            }
            if (hitSomething) {
                break;
            }
            y--;
        }

        // Build the room
        for (let i=0; i<width; i++) {
            for (let j=0; j<height; j++) {
                const key = `${i+x},${j+y}`;
                if (i===0 || j===0 || i===(width-1) || j===(height-1)) {
                    map.set(key, {type:'#', roomId:roomCount});
                } else {
                    map.set(key, {type:'.', roomId:roomCount});
                    entitySpots.push(key);
                }
            }
        }

        maxY = Math.max(maxY, y + height + 1);
        // Compute room center
        const roomCenter = [Math.floor(x + width / 2), Math.floor(y + height / 2)];
        roomCenters.sort((roomA, roomB) => {
            return (Math.abs(roomA[0] - roomCenter[0]) + Math.abs(roomA[1] - roomCenter[1])) - (Math.abs(roomB[0] - roomCenter[0]) + Math.abs(roomB[1] - roomCenter[1]))
        });

        // Connect some hallways
        const neededWalls = new Set<string>();
        for (let i=0; i<Math.min(2, roomCenters.length); i++) {
            const [tx, ty] = roomCenters[i];
            let [hx, hy] = roomCenter;
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

            // Draw a single hallway
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
                    map.set(key, {type:'.', roomId:-1});
                }
                // Record walls we may need to add.
                for (let wx=-1; wx<2; wx++) {
                    for (let wy=-1; wy<2; wy++) {
                        neededWalls.add(`${hx + wx},${hy + wy}`);
                    }
                }
            }
        }

        // Add extra walls where we need them
        neededWalls.forEach(key => {
            if (!map.has(key)) {
                map.set(key, {type:'#', roomId:-1});
            }
        });

        // Record roomCenter for future hallway math
        roomCenters.push(roomCenter);
    }

    return {
        map: map,
        roomCenters: roomCenters,
        playerStart: randomElement(entitySpots)
    }
}