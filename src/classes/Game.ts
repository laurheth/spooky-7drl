import { Application, Assets, Spritesheet, settings, SCALE_MODES, Container } from "pixi.js"

/**
 * This class encapsulates game setup, keeps track of the Pixi.js app, and some related functionality.
 */
class Game {
    pixiApp: Application;
    appRoot: HTMLDivElement;
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
    }
}

export default Game;
