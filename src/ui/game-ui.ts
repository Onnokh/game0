import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class GameUI extends ex.ScreenElement {
  private titleLabel!: ex.Label;
  private weaponLabel!: ex.Label;
  private ammoLabel!: ex.Label;
  private dropHintLabel!: ex.Label;

  constructor() {
    super();
  }

  override onInitialize(engine: ex.Engine): void {
    // Create title label
    this.titleLabel = new ex.Label({
      text: '1337',
      pos: ex.vec(16, 40),
      z: 99999,
      font: Resources.DeterminationFont.toFont({
        size: 16,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.titleLabel);

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
}
