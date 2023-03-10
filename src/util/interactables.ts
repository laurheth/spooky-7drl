import Interactive from "../classes/Interactive"
import { randomElement } from "./randomness";

interface InteractableDetails {
    minLevel?:number;
    maxLevel?:number;
    name?:string;
    content:string[];
    sprite?:string;
    actual?:Interactive;
}

const interactables:InteractableDetails[] = [
    {
        name: "Test",
        content: ["This is a test."]
    }
]

interactables.forEach((x,i) => {
    interactables[i].actual = new Interactive({
        name: x.name,
        messages: x.content,
        spritePath: x.sprite ? x.sprite : "sprites/note.png"
    });
});

const getInteractable = (level:number) => {
    const options = interactables.filter(x => {
        return ((!x.maxLevel || x.maxLevel >= level) && (!x.minLevel || x.minLevel <= level));
    });
    if (options.length > 0) {
        return randomElement(options, true);
    } else {
        return null;
    }
}

export default getInteractable;
