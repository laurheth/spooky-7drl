import { Assets } from "pixi.js"
import { sound, Sound } from "@pixi/sound"

const soundPath = "audio/";
const soundSuffix = ".mp3";

const sounds:{name:string, volume:number}[] = [
    {name: "drawer", volume: 1.1},
    {name: "explosion", volume: 1},
    {name: "frictionOnWood", volume: 0.8},
    {name: "hit", volume: 1},
    {name: "marchingFeets", volume: 1},
    {name: "openDoor", volume: 1},
    {name: "simpleRoar", volume: 0.8},
    {name: "unlock", volume: 1},
    {name: "static", volume: 1},
    {name: "bigHit", volume: 1},
    {name: "litFuse", volume: 1},
    {name: "beepboxSong", volume: 0.5},
    {name: "heal", volume: 0.8},
    {name: "middleHurt", volume: 1},
];

const music = "beepboxSong";

/**
 * Something to handle sounds. This is a bit last minute, whoops
 */
export default class SoundHandler {
    private static instance: SoundHandler;

    active: boolean = true;

    loadedSounds: Map<string, Sound>;

    private constructor() {
        this.loadedSounds = new Map();
        sounds.forEach(({name, volume}) => {
            const path = `${soundPath}${name}${soundSuffix}`;
            const newSound = Sound.from({
                url: path,
                preload: true,
                volume: volume,
                loop: name === music,
                autoPlay: name === music
            });
            this.loadedSounds.set(name, newSound);
        });
    }

    playSound(name:string, volume:number = 1, pitch:number = 1) {
        if (this.active && this.loadedSounds.has(name)) {
            const sound = this.loadedSounds.get(name);
            sound.play({
                volume: sound.volume * volume,
                speed:pitch
            });
        }
    }

    setSound(active:boolean) {
        this.active = active;
        this.loadedSounds.forEach((sound, name) => {
            if (name === music) {
                if (!active && sound.isPlaying) {
                    sound.pause();
                } else if (active && !sound.isPlaying) {
                    sound.resume();
                }
            }
        })
    }

    static getInstance() {
        if (!SoundHandler.instance) {
            SoundHandler.instance = new SoundHandler();
        }
        return SoundHandler.instance;
    }
}