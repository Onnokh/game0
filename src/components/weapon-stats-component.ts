import * as ex from 'excalibur';

/**
 * Component for weapon statistics
 */
export class WeaponStatsComponent extends ex.Component {
  constructor(
    public name: string = 'Weapon',
    public damage: number = 25,
    public firerate: number = 3,
    public magazineSize: number = 30,
    public currentAmmo: number = magazineSize
  ) {
    super();
  }

  canShoot(): boolean {
    return this.currentAmmo > 0;
  }

  shoot(): boolean {
    if (this.currentAmmo > 0) {
      this.currentAmmo--;
      return true;
    }
    return false;
  }

  reload(): void {
    this.currentAmmo = this.magazineSize;
  }
}

