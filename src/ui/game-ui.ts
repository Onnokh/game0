import * as ex from 'excalibur';
import { Player } from '../entities/player';
import { debugMode } from '../main';

export class GameUI extends ex.ScreenElement {
  private titleLabel!: ex.Label;
  private velocityLabel!: ex.Label;
  private player: Player | null = null;

  constructor() {
    super();
  }

  override onInitialize(engine: ex.Engine): void {
    // Create title label
    this.titleLabel = new ex.Label({
      text: 'Game0',
      pos: ex.vec(16, 16),
      z: 99999,
      font: new ex.Font({
        size: 16,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.titleLabel);

    // Create velocity display label
    this.velocityLabel = new ex.Label({
      text: 'Velocity: (0.0, 0.0) | Speed: 0.0 px/s',
      pos: ex.vec(16, 32),
      z: 99999,
      font: new ex.Font({
        size: 12,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.velocityLabel);
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  addToScene(scene: ex.Scene): void {
    scene.add(this);
  }

  updateVelocityDisplay(): void {
    if (!this.player || !this.velocityLabel) return;

    // Only show velocity info in debug mode
    if (!debugMode) {
      this.velocityLabel.text = '';
      return;
    }

    const velocity = this.player.vel;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    // Format the display text
    const velocityText = `Velocity: (${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)}) | Speed: ${speed.toFixed(1)} px/s`;
    this.velocityLabel.text = velocityText;
  }
}
