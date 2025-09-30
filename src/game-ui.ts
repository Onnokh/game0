import * as ex from 'excalibur';

export class GameUI {
  private titleLabel: ex.Label;
  private instructionsLabel: ex.Label;

  constructor() {
    this.titleLabel = new ex.Label({
      text: 'Excalibur.js + Vite Template',
      x: 400,
      y: 50,
      font: new ex.Font({
        size: 24,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Center
      })
    });

    this.instructionsLabel = new ex.Label({
      text: 'Use Arrow Keys or WASD to move. Hold Shift to sprint!',
      x: 400,
      y: 100,
      font: new ex.Font({
        size: 16,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Center
      })
    });
  }

  addToScene(scene: ex.Scene): void {
    scene.add(this.titleLabel);
    scene.add(this.instructionsLabel);
  }

  updateInstructions(text: string): void {
    this.instructionsLabel.text = text;
  }

  updateTitle(text: string): void {
    this.titleLabel.text = text;
  }
}
