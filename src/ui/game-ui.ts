import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class GameUI extends ex.ScreenElement {
  private weaponLabel!: ex.Label;
  private ammoLabel!: ex.Label;
  private dropHintLabel!: ex.Label;
  private roundLabel!: ex.Label;
  private enemiesLabel!: ex.Label;
  private fpsLabel!: ex.Label;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTimer: number = 0;
  private readonly FPS_UPDATE_INTERVAL = 250; // Update FPS display every 250ms

  constructor() {
    super();
  }

  override onInitialize(engine: ex.Engine): void {

    // Create weapon status label
    this.weaponLabel = new ex.Label({
      text: 'Weapon: None',
      pos: ex.vec(engine.drawWidth - 16, engine.drawHeight - 32),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
        size: 16,
        color: ex.Color.Yellow,
        textAlign: ex.TextAlign.Right,
        lineHeight: 32
      })
    });
    this.addChild(this.weaponLabel);

    // Create ammo count label
    this.ammoLabel = new ex.Label({
      text: 'Ammo: -/-',
      pos: ex.vec(engine.drawWidth - 16, engine.drawHeight - 56),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
        size: 14,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Right,
        lineHeight: 32
      })
    });
    this.addChild(this.ammoLabel);

    // Create drop hint label
    this.dropHintLabel = new ex.Label({
      text: 'Press [Q] to drop your current weapon',
      pos: ex.vec(engine.drawWidth - 16, engine.drawHeight - 80),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
        size: 12,
        color: ex.Color.fromHex('#A0A0A0'), // Gray color for hint text
        textAlign: ex.TextAlign.Right,
        lineHeight: 32
      })
    });
    this.dropHintLabel.graphics.isVisible = false; // Hidden by default
    this.addChild(this.dropHintLabel);

    // Create round info label
    this.roundLabel = new ex.Label({
      text: 'Round: 1',
      pos: ex.vec(16, 16),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
        size: 18,
        color: ex.Color.fromHex('#FFD700'), // Gold color
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.roundLabel);

    // Create enemies remaining label
    this.enemiesLabel = new ex.Label({
      text: 'Enemies: 0',
      pos: ex.vec(16, 40),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
        size: 16,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.enemiesLabel);

    // Create FPS counter label
    this.fpsLabel = new ex.Label({
      text: 'FPS: 0',
      pos: ex.vec(engine.drawWidth - 16, 16),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
        size: 12,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Right
      })
    });
    this.addChild(this.fpsLabel);
  }

  updateWeaponStatus(hasWeapon: boolean, weaponName?: string): void {
    this.weaponLabel.text = hasWeapon ? `Weapon: ${weaponName || 'Unknown'}` : 'Weapon: None';
    // Show drop hint only when player has a weapon
    this.dropHintLabel.graphics.isVisible = hasWeapon;
  }

  updateAmmoCount(current: number, max: number): void {
    this.ammoLabel.text = `Ammo: ${current}/${max}`;
  }

  addToScene(scene: ex.Scene): void {
    scene.add(this);
  }

  updateRoundInfo(roundNumber: number, remainingEnemies: number): void {
    if (this.roundLabel) {
      this.roundLabel.text = `Round: ${roundNumber}`;
    }
    if (this.enemiesLabel) {
      this.enemiesLabel.text = `Enemies: ${remainingEnemies}`;
    }
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
      
      // Update FPS display
      if (this.fpsLabel) {
        this.fpsLabel.text = `FPS: ${this.fps}`;
      }
    }
  }
}
