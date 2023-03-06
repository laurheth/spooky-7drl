import "normalize.css"
import "./styles/styles.css"
import Game from "./classes/Game"
import preloadAssets from "./util/preloadAssets"

// Start up the game!
async function init() {
    await preloadAssets();
    const game = Game.getInstance();
    game.newMap();
}

// Kick everything into motion.
init();
