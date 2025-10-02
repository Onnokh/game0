import * as ex from 'excalibur';
import { BulletModifierComponent, BulletModifierType, ModifierEffect } from './bullet-modifier-component';

/**
 * Component that marks an entity as a bullet and stores bullet-specific data
 */
export class BulletComponent extends ex.Component {
  public damage: number;
  public maxDistance: number;
  public distanceTraveled: number = 0;
  public modifiers: BulletModifierComponent | null = null;

  constructor(damage: number = 25, maxDistance: number = 1200) {
    super();
    this.damage = damage;
    this.maxDistance = maxDistance;
  }

  /**
   * Add a modifier to this bullet
   */
  addModifier(type: BulletModifierType): void {
    if (!this.modifiers) {
      this.modifiers = new BulletModifierComponent([type]);
    } else {
      this.modifiers.addModifier(type);
    }
  }

  /**
   * Check if this bullet has a specific modifier
   */
  hasModifier(type: BulletModifierType): boolean {
    return this.modifiers?.hasModifier(type) ?? false;
  }

  /**
   * Get a specific modifier
   */
  getModifier(type: BulletModifierType): ModifierEffect | undefined {
    return this.modifiers?.getModifier(type);
  }
}

