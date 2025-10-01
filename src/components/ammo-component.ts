import * as ex from 'excalibur';
import { WeaponType } from './weapon-stats-component';

/**
 * Component for managing player ammo reserves for different weapon types
 */
export class AmmoComponent extends ex.Component {
  private ammoCounts: Map<WeaponType, number> = new Map();

  constructor() {
    super();
    
    // Initialize with default ammo counts for each weapon type
    this.initializeDefaultAmmo();
  }

  /**
   * Initialize default ammo counts for each weapon type
   */
  private initializeDefaultAmmo(): void {
    this.ammoCounts.set(WeaponType.AssaultRifle, 120); // 4 magazines worth
    this.ammoCounts.set(WeaponType.Shotgun, 32);      // 4 magazines worth
    this.ammoCounts.set(WeaponType.Pistol, 48);       // 4 magazines worth
    this.ammoCounts.set(WeaponType.SMG, 100);         // 4 magazines worth
  }

  /**
   * Get current ammo count for a specific weapon type
   */
  getAmmoCount(weaponType: WeaponType): number {
    return this.ammoCounts.get(weaponType) || 0;
  }

  /**
   * Set ammo count for a specific weapon type
   */
  setAmmoCount(weaponType: WeaponType, count: number): void {
    this.ammoCounts.set(weaponType, Math.max(0, count));
  }

  /**
   * Add ammo to a specific weapon type
   */
  addAmmo(weaponType: WeaponType, amount: number): number {
    const currentCount = this.getAmmoCount(weaponType);
    const newCount = currentCount + amount;
    this.setAmmoCount(weaponType, newCount);
    return newCount;
  }

  /**
   * Remove ammo from a specific weapon type
   * @param weaponType The weapon type to remove ammo from
   * @param amount The amount to remove
   * @param maxRemove The maximum amount that can be removed (e.g., magazine size)
   * @returns The actual amount removed
   */
  removeAmmo(weaponType: WeaponType, amount: number, maxRemove?: number): number {
    const currentCount = this.getAmmoCount(weaponType);
    const actualRemove = maxRemove ? Math.min(amount, maxRemove, currentCount) : Math.min(amount, currentCount);
    
    const newCount = Math.max(0, currentCount - actualRemove);
    this.setAmmoCount(weaponType, newCount);
    
    return actualRemove;
  }

  /**
   * Check if there's enough ammo for a specific weapon type
   */
  hasAmmo(weaponType: WeaponType, amount: number = 1): boolean {
    return this.getAmmoCount(weaponType) >= amount;
  }

  /**
   * Get total ammo count across all weapon types
   */
  getTotalAmmoCount(): number {
    let total = 0;
    for (const count of this.ammoCounts.values()) {
      total += count;
    }
    return total;
  }

  /**
   * Get all ammo counts as a map
   */
  getAllAmmoCounts(): Map<WeaponType, number> {
    return new Map(this.ammoCounts);
  }

  /**
   * Check if player has any ammo at all
   */
  hasAnyAmmo(): boolean {
    return this.getTotalAmmoCount() > 0;
  }
}
