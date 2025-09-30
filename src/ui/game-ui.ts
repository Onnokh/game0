import * as ex from 'excalibur';

export class GameUI extends ex.ScreenElement {
  private titleLabel!: ex.Label;

  constructor() {
    super();
  }

  override onInitialize(engine: ex.Engine): void {
    // Create title label
    this.titleLabel = new ex.Label({
      text: 'Game0',
      pos: ex.vec(16, 40),
      z: 99999,
      font: new ex.Font({
        size: 16,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.titleLabel);
  }

  addToScene(scene: ex.Scene): void {
    scene.add(this);
  }
}
