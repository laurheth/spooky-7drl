interface Theme {
    wall:string;
    floor:string;
    wallTint:number;
    floorTint:number;
    decorations:string[];
}

const themes:Theme[] = [
    {
        wall:'badBricks',
        floor:'badConcrete',
        wallTint:0xA09999,
        floorTint:0x666666,
        decorations:["box"]
    },
    {
        wall:'badBricks',
        floor:'badConcrete',
        wallTint:0xA00000,
        floorTint:0x666666,
        decorations:["box", "bookshelf","cabinet"]
    },
    {
        wall:'testWall',
        floor:'badConcrete',
        wallTint:0x0000AA,
        floorTint:0x666644,
        decorations:["bookshelf","cabinet"]
    },
    {
        wall:'testWall',
        floor:'badConcrete',
        wallTint:0x990099,
        floorTint:0x669966,
        decorations:["bookshelf","cabinet"]
    },
    {
        wall:'badBricks',
        floor:'badConcrete',
        wallTint:0x999900,
        floorTint:0x996633,
        decorations:["box", "bookshelf","cabinet"]
    },
]

export default themes;