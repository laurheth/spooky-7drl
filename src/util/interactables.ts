import Interactive from "../classes/Interactive"
import { randomElement } from "./randomness";

interface InteractableDetails {
    minLevel?:number;
    maxLevel?:number;
    name?:string;
    content:string[];
    sprite?:string;
    actual?:Interactive;
    item?:string;
}

const baseInteractables:InteractableDetails[] = [
    {
        content: ["Great holes secretly are drilled", "Where small holes for wooden dowels ought to suffice", "And things have learned to walk", "That were meant to be comfortable"],
    },
    {
        content: ["Have a screwdriver.", "Assemble on a soft surface.", "Count your screws.", "Do not assemble alone.", "Ever."],
        minLevel: 2
    },
    {
        content: ["I came here hoping to find a new desk, but there are no desks here.", "I don't know how to escape, but there's a staircase downwards. It must lead somewhere."],
        maxLevel: 2
    },
    {
        content: ["I yearned for rest, and thought I saw a comfortable couch.", "But when I got close, its cushions rose to reveal a gaping maw.", "There is no rest here, only sharp grinding teeth."],
        minLevel: 2
    },
    {
        content: ["Fives eyes, to see you better.", "A hundred teeth, to grind you to dust.", "A thousand tiny legs, to hunt you forever."],
        minLevel: 2
    },
    {
        content: ["SOFA SOFA SOFA SOFA SOFA SOFA", "SOFA SOFA SOFA SOFA SOFA SOFA", "SOFA SOFA SOFA SOFA SOFA SOFA", "SOFA SOFA SOFA SOFA SOFA SOFA"],
        minLevel: 2
    },
    {
        content: ["Don't turn your back on the lamps."],
        minLevel: 3
    },
    {
        content: ["I found a locked door. Try as I might, I couldn't find the key for it.", "So I blasted it off its hinges with one of these.", "But beware, the creatures have ears, and they will come to find where the noise came from."],
        minLevel: 2,
        item: "bomb"
    },
    {
        content: ["Why is there a chainsaw here? Is it to dispose of old furniture?", "Or maybe management knew what horrors could be unleashed from here?", "Either way, it is a blessed thing, loud as it might be."],
        item: "chainsaw",
        minLevel: 3
    },
    {
        content: ["Hiding here for a day, I can feel my joints become stiff.", "They seem to creak when I bend them.", "I've either been here a lot longer than I think,", "or I am becoming one of them."],
        minLevel: 3
    },
    {
        content: ["Strange is the night where black stars rise", "And strange moons circle through the skies", "But stranger still is", "The assembly instructions"],
        minLevel: 4
    },
    {
        content: ["The Lord will send on you curses, confusion and rebuke in everything you put your hand to.", "The Lord will plague you with poor quality furniture until he has destroyed you."],
        minLevel: 4
    },
    {
        content: ["There is no escape."],
        minLevel: 5
    },
    {
        content: ["I think the televisions are on the wrong channel."],
        minLevel: 7
    },
    {
        content: ["I found the exit!", "If you find this, the exit is -"],
        minLevel: 6
    },
    {
        content: ["And I stood upon the sand of the sea, and saw a beast rise up out of the sea, having seven heads and ten horns, and upon his horns ten crowns, and upon his heads the name of blasphemy."],
        minLevel: 7
    },
];

const interactables:InteractableDetails[] = [];

export const resetFunction = () => {
    while (interactables.pop()) {
        // Empty er out
    }
    baseInteractables.forEach(x=>interactables.push(x));
    
    // Get the stored grave item.
    const grave = localStorage.getItem("graveText");
    const graveGoody = localStorage.getItem("graveItem");
    if (grave) {
        const graveLines = grave.split('\n');
        interactables.push({
            name: "grave",
            content: graveLines,
            item:graveGoody,
            minLevel: Math.floor(Math.random() * 8),
            sprite: "sprites/grave.png",
        })
    }
    
    interactables.forEach((x,i) => {
        interactables[i].actual = new Interactive({
            name: x.name,
            messages: x.content,
            spritePath: x.sprite ? x.sprite : "sprites/note.png",
            item: x.item
        });
    });
}

resetFunction();

const getInteractable = (level:number) => {
    const options = interactables.filter(x => {
        return ((!x.maxLevel || x.maxLevel >= level) && (!x.minLevel || x.minLevel <= level));
    });
    if (options.length > 0) {
        const item = randomElement(options)
        const index = interactables.indexOf(item);
        if (index >= 0) {
            interactables.splice(index, 1);
        }
        if (item.name === "grave") {
            const grave = localStorage.removeItem("graveText");
            const graveGoody = localStorage.removeItem("graveItem");
        }
        return item;
    } else {
        return null;
    }
}

export default getInteractable;
