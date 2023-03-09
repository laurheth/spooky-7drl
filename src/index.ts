import "normalize.css"
import "./styles/styles.css"
import Game from "./classes/Game"
import UI from "./classes/UI"
import preloadAssets from "./util/preloadAssets"

// Start up the game!
async function init() {
    await preloadAssets();
    const game = Game.getInstance();
    game.newMap(1,true);
    UI.getInstance();
}

// Kick everything into motion.
init();
