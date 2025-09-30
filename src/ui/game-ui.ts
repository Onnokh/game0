import * as ex from 'excalibur';

export class GameUI extends ex.ScreenElement {
  private titleLabel!: ex.Label;
  private weaponLabel!: ex.Label;
  private ammoLabel!: ex.Label;

  constructor() {
    super();
  }

  override onInitialize(engine: ex.Engine): void {
    // Create title label
    this.titleLabel = new ex.Label({
      text: '1337',
      pos: ex.vec(16, 40),
      z: 99999,
      font: new ex.Font({
        size: 16,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.titleLabel);

    // Create weapon status label
    this.weaponLabel = new ex.Label({
      text: 'Weapon: None',
      pos: ex.vec(16, 60),
      z: 99999,
      font: new ex.Font({
        size: 16,
        color: ex.Color.Yellow,
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.weaponLabel);

    // Create ammo count label
    this.ammoLabel = new ex.Label({
      text: 'Ammo: -/-',
      pos: ex.vec(16, 80),
      z: 99999,
      font: new ex.Font({
        size: 16,
        color: ex.Color.White,
        textAlign: ex.TextAlign.Left
      })
    });
    this.addChild(this.ammoLabel);
  }

  updateWeaponStatus(hasWeapon: boolean): void {
    this.weaponLabel.text = hasWeapon ? 'Weapon: Gun' : 'Weapon: None';
  }

  updateAmmoCount(current: number, max: number): void {
    this.ammoLabel.text = `Ammo: ${current}/${max}`;
  }

  addToScene(scene: ex.Scene): void {
    scene.add(this);
  }
}
