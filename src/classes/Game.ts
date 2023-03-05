import { Application, settings, SCALE_MODES, ParticleContainer, Container, BaseTexture } from "pixi.js"
import MapHandler from "./MapHandler"

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

    mapHandler: MapHandler;

    constructor() {
        // Initialize the Pixi application.
        this.pixiApp = new Application({
            backgroundColor: 0x000000,
            autoDensity: true,
            resolution: devicePixelRatio
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
        this.pixiApp.stage.addChild(this.tileContainer);
        this.pixiApp.stage.addChild(this.spriteContainer);

        // Setup the map handler
        this.mapHandler = new MapHandler({
            tileContainer: this.tileContainer,
            spriteContainer: this.spriteContainer,
            tileScale: 32,
            game: this
        });

        // Handle resizing.
        window.onresize = () => this.handleResize();

        // Call handleResize once for the initial size.
        this.handleResize();
    }

    // Deal with resizing of the browser window
    handleResize() {
        this.pixiApp.view.width = this.appRoot.clientWidth;
        this.pixiApp.view.height = this.appRoot.clientHeight;
        this.pixiApp.renderer.resize(this.appRoot.clientWidth, this.appRoot.clientHeight);
        this.mapHandler.recenter();
    }

    // Start a new map
    newMap() {
        this.mapHandler.generateNewMap({level: 1});
    }
}

export default Game;
