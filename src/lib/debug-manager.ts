import * as ex from 'excalibur';
import { Player } from '../entities/player';
import { Resources } from './resources';

/**
 * Centralized debug manager that handles all debug visualizations and info displays.
 * Add this to your scene to enable debug features.
 */
export class DebugManager extends ex.ScreenElement {
  private static debugEnabled = false;
  
  private velocityLabel!: ex.Label;
  private debugModeLabel!: ex.Label;
  private fpsLabel!: ex.Label;
  private player: Player | null = null;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTimer: number = 0;
  private readonly FPS_UPDATE_INTERVAL = 250; // Update FPS display every 250ms

  static isDebugEnabled(): boolean {
    return DebugManager.debugEnabled;
  }

  static toggleDebug(engine: ex.Engine): void {
    DebugManager.debugEnabled = !DebugManager.debugEnabled;
    engine.toggleDebug();
    console.log(`Debug mode: ${DebugManager.debugEnabled ? 'ON' : 'OFF'}`);
  }

  override onInitialize(engine: ex.Engine): void {
    // Create debug mode indicator label
    this.debugModeLabel = new ex.Label({
      text: '',
      pos: ex.vec(engine.drawWidth - 100, 16),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
        size: 12,
        color: ex.Color.Yellow,
        textAlign: ex.TextAlign.Right
      })
    });
    this.addChild(this.debugModeLabel);

    // Create FPS counter label
    this.fpsLabel = new ex.Label({
      text: '',
      pos: ex.vec(engine.drawWidth - 100, 32),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
        size: 12,
        color: ex.Color.Green,
        textAlign: ex.TextAlign.Right
      })
    });
    this.addChild(this.fpsLabel);

    // Create velocity display label
    this.velocityLabel = new ex.Label({
      text: '',
      pos: ex.vec(16, 16),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
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

  override onPreUpdate(engine: ex.Engine, delta: number): void {
    // Update FPS calculation
    this.frameCount++;
    this.fpsUpdateTimer += delta;
    
    if (this.fpsUpdateTimer >= this.FPS_UPDATE_INTERVAL) {
      // Calculate FPS based on frames counted over the interval
      this.fps = Math.round((this.frameCount * 1000) / this.fpsUpdateTimer);
      this.frameCount = 0;
      this.fpsUpdateTimer = 0;
    }

    // Update debug UI visibility and content
    if (DebugManager.debugEnabled) {
      this.debugModeLabel.text = 'DEBUG ON';
      this.fpsLabel.text = `FPS: ${this.fps}`;
      this.updateVelocityDisplay();
    } else {
      this.debugModeLabel.text = '';
      this.fpsLabel.text = '';
      this.velocityLabel.text = '';
    }
  }

  /**
   * Call this from your scene's onPostDraw to render the debug grid
   */
  drawDebugOverlay(ctx: ex.ExcaliburGraphicsContext): void {
    if (!DebugManager.debugEnabled) return;

    // Draw debug grid aligned to 16px tiles
    const tileSize = 16;
    const mapWidth = Math.ceil(ctx.width / tileSize) * tileSize;
    const mapHeight = Math.ceil(ctx.height / tileSize) * tileSize;
    
    // Draw vertical lines
    for (let x = 0; x <= mapWidth; x += tileSize) {
      ex.Debug.drawLine(
        ex.vec(x, 0),
        ex.vec(x, mapHeight),
        { color: ex.Color.fromHex("#333333") }
      );
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= mapHeight; y += tileSize) {
      ex.Debug.drawLine(
        ex.vec(0, y),
        ex.vec(mapWidth, y),
        { color: ex.Color.fromHex("#333333") }
      );
    }
  }

  private updateVelocityDisplay(): void {
    if (!this.player) {
      this.velocityLabel.text = 'No player tracked';
      return;
    }

    const velocity = this.player.vel;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    this.velocityLabel.text = `Velocity: (${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)}) | Speed: ${speed.toFixed(1)} px/s`;
  }
}

