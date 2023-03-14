import "normalize.css"
import "./styles/styles.css"
import Game from "./classes/Game"
import UI from "./classes/UI"
import SoundHandler from "./classes/SoundHandler"
import preloadAssets from "./util/preloadAssets"

// Start up the game!
async function init() {
    await preloadAssets();
    const difficulty = await UI.getInstance().showDifficultySelection();
    const game = Game.getInstance();
    game.setDifficulty(difficulty);
    game.newMap(1,true);
    UI.getInstance().showSpecialMessageModal({
        headingText: "Furniture: Screws and Blood",
        body: [
            "Dowel of wood, wheel of plastic, hex key of steel.",
            "You came to this place, on a day like any other, to find some new furniture.",
            "But the walls have closed in, all signs of human life is gone, and cursed wooden creatures now walk these halls.",
            "You don't know what happened. But you do know you cannot stay here. Do what you must, and escape this vile place!"
        ],
        button: "Enter the horror..."
    })
    SoundHandler.getInstance();
}

// Kick everything into motion.
init();
