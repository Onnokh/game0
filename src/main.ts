import * as ex from "excalibur";
import { loader } from "./lib/resources";
import { MyLevel } from "./scenes/level";
import { DebugManager } from "./lib/debug-manager";

// Goal is to keep main.ts small and just enough to configure the engine

const game = new ex.Engine({
  width: 800, // Logical width and height in game pixels
  height: 600,
  backgroundColor: ex.Color.fromHex("#54C0CA"), // Nice sky blue background
  displayMode: ex.DisplayMode.FitScreen, // Display mode tells excalibur how to fill the window
  pixelArt: true, // pixelArt will turn on the correct settings to render pixel art without jaggies or shimmering artifacts
  pixelRatio: 2, // Higher pixel ratio for better quality
  scenes: {
    start: MyLevel
  },
  // physics: {
  //   solver: SolverStrategy.Realistic,
  //   substep: 5 // Sub step the physics simulation for more robust simulations
  // },
  // fixedUpdateTimestep: 16 // Turn on fixed update timestep when consistent physic simulation is important
});

// Add keyboard listener for debug toggle (backtick key)
game.input.keyboard.on('press', (evt) => {
  if (evt.key === ex.Keys.Backquote) {
    DebugManager.toggleDebug(game);
  }
});

game.start('start', { // name of the start scene 'start'
  loader, // Optional loader (but needed for loading images/sounds)
  inTransition: new ex.FadeInOut({ // Optional in transition
    duration: 1000,
    direction: 'in',
    color: ex.Color.ExcaliburBlue
  })
}).then(() => {
  console.log('Game started successfully!');
  console.log('Press ` (backtick) to toggle debug mode');
});