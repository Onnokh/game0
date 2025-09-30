import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class GameUI extends ex.ScreenElement {
  private titleLabel!: ex.Label;
  private weaponLabel!: ex.Label;
  private ammoLabel!: ex.Label;
  private dodgeLabel!: ex.Label;

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

    // Create dodge roll status label
    this.dodgeLabel = new ex.Label({
      text: 'Dodge: Ready (SPACE) | Jump: J',
      pos: ex.vec(16, 80),
      z: 99999,
      font: new ex.Font({
        size: 16,
        color: ex.Color.Green,
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.dodgeLabel);
  }

  updateWeaponStatus(hasWeapon: boolean): void {
    this.weaponLabel.text = hasWeapon ? 'Weapon: Gun' : 'Weapon: None';
  }

  updateAmmoCount(current: number, max: number): void {
    this.ammoLabel.text = `Ammo: ${current}/${max}`;
  }

  updateDodgeStatus(isRolling: boolean, cooldownRemaining: number, isJumping: boolean = false): void {
    if (isRolling) {
      this.dodgeLabel.text = 'Dodge: Rolling! | Jump: J';
      this.dodgeLabel.font = new ex.Font({
        size: 16,
        color: ex.Color.Orange,
        textAlign: ex.TextAlign.Left
      });
    } else if (cooldownRemaining > 0) {
      this.dodgeLabel.text = `Dodge: Cooldown (${Math.ceil(cooldownRemaining / 1000)}s) | Jump: J ${isJumping ? '(ON)' : ''}`;
      this.dodgeLabel.font = new ex.Font({
        size: 16,
        color: ex.Color.Red,
        textAlign: ex.TextAlign.Left
      });
    } else {
      this.dodgeLabel.text = `Dodge: Ready (SPACE) | Jump: J ${isJumping ? '(ON)' : ''}`;
      this.dodgeLabel.font = new ex.Font({
        size: 16,
        color: isJumping ? ex.Color.Cyan : ex.Color.Green,
        textAlign: ex.TextAlign.Left
      });
    }
  }

  addToScene(scene: ex.Scene): void {
    scene.add(this);
  }
}
