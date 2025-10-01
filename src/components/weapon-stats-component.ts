import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

/**
 * Weapon type definitions with unique firing behaviors
 */
export enum WeaponType {
  AssaultRifle = 'AssaultRifle',  // Fast fire rate, single bullet
  Shotgun = 'Shotgun',            // Slow fire rate, multiple bullets in spread
  Pistol = 'Pistol',              // Medium fire rate, single bullet
  SMG = 'SMG',                    // Very fast fire rate, lower damage
}

/**
 * Configuration for different weapon types
 */
interface WeaponTypeConfig {
  name: string;             // Display name for this weapon type
  bulletCount: number;      // How many bullets per shot
  spreadAngle: number;      // Spread angle in radians (0 = no spread)
  fireRate: number;         // Shots per second
  damage: number;           // Damage per bullet
  magazineSize: number;     // Magazine capacity
  spriteSource: ex.ImageSource; // Sprite image source for this weapon type
  recoil: number;           // Recoil/pushback force when shooting
}

/**
 * Predefined weapon configurations
 */
export const WEAPON_CONFIGS: Record<WeaponType, WeaponTypeConfig> = {
  [WeaponType.AssaultRifle]: {
    name: 'AK-47',
    bulletCount: 1,
    spreadAngle: 0,
    fireRate: 10,           // 10 shots per second
    damage: 12,
    magazineSize: 30,
    spriteSource: Resources.AssaultRifle,
    recoil: 90,             // Medium recoil
  },
  [WeaponType.Shotgun]: {
    name: 'Shotgun',
    bulletCount: 8,         // 8 pellets per shot
    spreadAngle: Math.PI / 6, // 30 degree spread
    fireRate: 1.5,          // 1.5 shots per second (slower)
    damage: 8,              // Lower damage per pellet
    magazineSize: 8,
    spriteSource: Resources.Shotgun,
    recoil: 150,             // High recoil (powerful weapon)
  },
  [WeaponType.Pistol]: {
    name: 'Pistol',
    bulletCount: 1,
    spreadAngle: 0,
    fireRate: 5,            // 5 shots per second
    damage: 15,
    magazineSize: 12,
    spriteSource: Resources.Pistol,
    recoil: 40,              // Low recoil
  },
  [WeaponType.SMG]: {
    name: 'SMG',
    bulletCount: 1,
    spreadAngle: Math.PI / 24, // Slight spread (7.5 degrees)
    fireRate: 15,           // 15 shots per second (very fast)
    damage: 8,
    magazineSize: 25,
    spriteSource: Resources.SMG,
    recoil: 60,              // Very low recoil (fast fire rate)
  },
};

/**
 * Component for weapon statistics
 */
export class WeaponStatsComponent extends ex.Component {
  public name: string;
  public type: WeaponType;
  public damage: number;
  public firerate: number;
  public magazineSize: number;
  public currentAmmo: number;
  public bulletCount: number;
  public spreadAngle: number;
  public spriteSource: ex.ImageSource;
  public recoil: number;

  constructor(
    type: WeaponType = WeaponType.Pistol,
    customConfig?: Partial<WeaponTypeConfig>
  ) {
    super();
    
    // Get base config from weapon type
    const baseConfig = WEAPON_CONFIGS[type];
    
    // Apply custom overrides if provided
    const config = { ...baseConfig, ...customConfig };
    
    this.name = config.name;
    this.type = type;
    this.damage = config.damage;
    this.firerate = config.fireRate;
    this.magazineSize = config.magazineSize;
    this.currentAmmo = config.magazineSize;
    this.bulletCount = config.bulletCount;
    this.spreadAngle = config.spreadAngle;
    this.spriteSource = config.spriteSource;
    this.recoil = config.recoil;
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

