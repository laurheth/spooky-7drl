import { Application, SCALE_MODES, Container, BaseTexture, Ticker, Sprite, Texture, BLEND_MODES } from "pixi.js"
import MapHandler from "./MapHandler"
import Player from "./Player"
import UI from "./UI"
import { resetFunction } from "../util/interactables";
import SoundHandler from "./SoundHandler";

/**
 * This class encapsulates game setup, keeps track of the Pixi.js app, and some related functionality.
 */
class Game {
    // Core pixi app for rendering
    pixiApp: Application;

    // Root element that the game lives in
    appRoot: HTMLDivElement;

    // Tile container. TODO: replace this with a ParticleContainer and use a sprite sheet.
    tileContainer: Container;

    // Sprite container. Entities / items / etc will go in here.
    spriteContainer: Container;

    // Container to hold anything that gets drawn on top of everything else
    overlayContainer: Container;
    // Use this to put a solid color over the entire screen
    overlayColor: Sprite;

    mapHandler: MapHandler;

    player: Player|null = null;

    ticker: Ticker;

    currentLevel: number = 0;

    active: boolean = false;

    lastMouseEvent: MouseEvent;

    touchGuideSprite : Sprite;

    muteSprite: Sprite;

    difficulty: number;

    init() {
        // Initialize the Pixi application.
        this.pixiApp = new Application({
            backgroundColor: 0x000000,
            autoDensity: true,
            resolution: devicePixelRatio,
            antialias: false
        });

        // Add the Pixi app to the page
        this.appRoot = document.getElementById("appRoot") as HTMLDivElement;
        this.appRoot.append(this.pixiApp.view as HTMLCanvasElement);

        // Make the pixels nice and crisp.
        //settings.SCALE_MODE = SCALE_MODES.NEAREST;
        BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

        // Setup containers
        this.tileContainer = new Container();
        this.spriteContainer = new Container();
        this.spriteContainer.sortableChildren = true;
        this.pixiApp.stage.addChild(this.tileContainer);
        this.pixiApp.stage.addChild(this.spriteContainer);

        // Prepare the overlay
        this.overlayContainer = new Container();
        this.pixiApp.stage.addChild(this.overlayContainer);
        this.overlayColor = Sprite.from(Texture.WHITE);
        this.overlayContainer.addChild(this.overlayColor);
        this.overlayColor.blendMode = BLEND_MODES.MULTIPLY;

        // Setup the map handler
        this.mapHandler = new MapHandler({
            tileContainer: this.tileContainer,
            spriteContainer: this.spriteContainer,
            tileScale: 32
        });

        // Mobile touch guide
        this.touchGuideSprite = Sprite.from("mobileControlNubbin.png");
        this.touchGuideSprite.alpha = 0.8;
        this.touchGuideSprite.visible = false;
        this.overlayContainer.addChild(this.touchGuideSprite);

        // Mute button
        this.muteSprite = Sprite.from("sprites/soundIcon.png");
        this.muteSprite.interactive = true;
        this.muteSprite.alpha = 0.8;
        this.overlayContainer.addChild(this.muteSprite);
        this.muteSprite.addEventListener("mouseover", () => this.muteSprite.alpha = 1);
        this.muteSprite.addEventListener("mouseout", () => this.muteSprite.alpha = 0.8);
        this.muteSprite.addEventListener("click", (event) => {
            SoundHandler.getInstance().setSound(!SoundHandler.getInstance().active);
            this.muteSprite.tint = SoundHandler.getInstance().active ? 0xFFFFFF : 0xFF0000;
        });
        this.muteSprite.addEventListener("tap", (event) => {
            SoundHandler.getInstance().setSound(!SoundHandler.getInstance().active);
            this.muteSprite.tint = SoundHandler.getInstance().active ? 0xFFFFFF : 0xFF0000;
        });

        // Handle resizing.
        window.onresize = () => this.handleResize();

        // Call handleResize once for the initial size.
        this.handleResize();

        // Handle input
        window.addEventListener("keydown", event => this.handleInput(event, "keydown"));
        window.addEventListener("keyup", event => this.handleInput(event, "keyup"));

        // Attempt at touch / mouse only support
        this.appRoot.addEventListener("mousedown", event => this.mouseInput(event, "keydown"));
        window.addEventListener("mouseup", event => this.mouseInput(event, "keyup"));
        this.appRoot.addEventListener("mousemove", event => {
            if (this.lastMouseEvent) {
                this.mouseInput(event, "keydown");
            }
        })

        window.addEventListener("touchend", event => this.touchInput(event, "keyup"));
        this.appRoot.addEventListener("touchstart", event => this.touchInput(event, "keydown"));
        this.appRoot.addEventListener("touchmove", event => this.touchInput(event, "keydown"));

        // Setup the ticket
        this.ticker = new Ticker();
        this.ticker.add((time) => this.tick(time));
        this.ticker.start();
    }

    setDifficulty(difficulty:number) {
        this.difficulty = difficulty;
    }

    // Deal with resizing of the browser window
    handleResize() {
        // Overall canvas size
        this.pixiApp.renderer.resolution = devicePixelRatio;
        this.pixiApp.view.width = this.appRoot.clientWidth;
        this.pixiApp.view.height = this.appRoot.clientHeight;
        this.pixiApp.renderer.resize(this.appRoot.clientWidth, this.appRoot.clientHeight);

        // Overlap color
        this.overlayColor.width = this.appRoot.clientWidth;
        this.overlayColor.height = this.appRoot.clientHeight;

        // Touch guide icon
        this.touchGuideSprite.x = this.appRoot.clientWidth - this.touchGuideSprite.width - 40;
        this.touchGuideSprite.y = this.appRoot.clientHeight - this.touchGuideSprite.height - 40;

        // Mute button
        this.muteSprite.x = 10;
        this.muteSprite.y = this.appRoot.clientHeight - this.muteSprite.height - 10;

        // Recenter map
        this.mapHandler.recenter();
    }

    // Start a new map
    newMap(level:number = 1, fresh:boolean=false) {
        if (fresh) {
            resetFunction();
        }
        this.currentLevel = level;
        this.mapHandler.generateNewMap({level: level, fresh:fresh, difficulty: this.difficulty ? this.difficulty : 1});
        this.active = true;
        UI.getInstance().closeInventory();
        UI.getInstance().closeSpecialMessageModal();
    }

    // Go to the next level
    nextLevel() {
        this.newMap(this.currentLevel + 1);
    }

    getAppRootCenter() {
        const rect = this.appRoot.getBoundingClientRect();
        return [
            (rect.left + rect.right) / 2,
            (rect.top + rect.bottom) / 2,
        ];
    }

    getTouchGuideCenter() {
        const rect = this.appRoot.getBoundingClientRect();
        return [
            rect.left + this.touchGuideSprite.x + this.touchGuideSprite.width / 2,
            rect.top + this.touchGuideSprite.y + this.touchGuideSprite.height / 2,
        ]
    }

    mouseInput(event:MouseEvent, eventType:"keydown"|"keyup") {
        if (eventType === "keydown") {
            this.lastMouseEvent = event;
        } else {
            this.lastMouseEvent = null;
        }
        const appRootCenter = this.getAppRootCenter();
        const [relX, relY] = [event.clientX - appRootCenter[0], event.clientY - appRootCenter[1]];
        if (Math.abs(relX) > this.appRoot.clientWidth / 4) {
            return;
        }
        if (Math.abs(relX) > Math.abs(relY)) {
            if (relX > 0) {
                this.handleInput(new KeyboardEvent(eventType, {key:"ArrowRight"}), eventType, true);
            } else {
                this.handleInput(new KeyboardEvent(eventType, {key:"ArrowLeft"}), eventType, true);
            }
        } else {
            if (relY > 0) {
                this.handleInput(new KeyboardEvent(eventType, {key:"ArrowDown"}), eventType, true);
            } else {
                this.handleInput(new KeyboardEvent(eventType, {key:"ArrowUp"}), eventType, true);
            }
        }
    }

    // Touch and mouse handler, converts to the equivalent keyboard input and passes it along
    touchInput(event:TouchEvent, eventType:"keydown"|"keyup") {
        this.touchGuideSprite.visible = true;
        if (event.touches.length > 0) {
            const appRootCenter = this.getTouchGuideCenter();
            const touch = event.touches[0];
            const [relX, relY] = [touch.clientX - appRootCenter[0], touch.clientY - appRootCenter[1]];
            if (Math.abs(relX) > Math.abs(relY)) {
                if (relX > 0) {
                    this.handleInput(new KeyboardEvent(eventType, {key:"ArrowRight"}), eventType, true);
                } else {
                    this.handleInput(new KeyboardEvent(eventType, {key:"ArrowLeft"}), eventType, true);
                }
            } else {
                if (relY > 0) {
                    this.handleInput(new KeyboardEvent(eventType, {key:"ArrowDown"}), eventType, true);
                } else {
                    this.handleInput(new KeyboardEvent(eventType, {key:"ArrowUp"}), eventType, true);
                }
            }
        }
        if (eventType === "keyup") {
            // Always send a keyup, even if we don't have a key to go with it.
            this.handleInput(new KeyboardEvent(eventType, {key:""}), eventType, true);
        }
    }

    // Input handler. Pass it to the player entity.
    handleInput(event:KeyboardEvent, eventType:"keydown"|"keyup", noBuffer=false) {
        if (eventType === "keydown" && event.key && event.key.toLowerCase() === "i") {
            UI.getInstance().toggleInventory();
        } else if (eventType === "keydown" && (event.key === "Escape" || event.key === "Esc")) {
            UI.getInstance().closeInventory();
            UI.getInstance().closeSpecialMessageModal();
        } else if (eventType === "keydown" && event.key === "P") {
            if (this.ticker.started) {
                this.ticker.stop();
            } else {
                this.ticker.start();
            }
        } else {
            if (UI.getInstance().messageOpen || UI.getInstance().inventoryOpen) {
                // Ignore inputs when UI is open
                return;
            }
            if (this.player) {
                this.player.handleInput(event, eventType, noBuffer);
            }
        }
    }

    tick(_deltaTime:number) {
        if (this.mapHandler && this.active) {
            this.mapHandler.tick(this.ticker.deltaMS);
        }
    }

    gameOver() {
        this.player.active = false;
        this.active = false;
    }
}

// Game should be a singleton.
class GameInstance {
    static instance: Game = undefined;
    
    static getInstance(): Game {
        if (!GameInstance.instance) {
            GameInstance.instance = new Game();
            GameInstance.instance.init();
        }
        return GameInstance.instance;
    }
}

export default GameInstance;
