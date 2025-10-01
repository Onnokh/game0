import * as ex from 'excalibur';

/**
 * Component that marks an entity as a bullet and stores bullet-specific data
 */
export class BulletComponent extends ex.Component {
  public damage: number;
  public maxDistance: number;
  public distanceTraveled: number = 0;

  constructor(damage: number = 25, maxDistance: number = 1200) {
    super();
    this.damage = damage;
    this.maxDistance = maxDistance;
  }
}

