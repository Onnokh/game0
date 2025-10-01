import * as ex from 'excalibur';
import { DamageNumberManager } from './damage-number-manager';

export class DamageNumberSystem extends ex.System {
  public readonly systemType = ex.SystemType.Update;
  public priority = 200; // Run after other systems
  public readonly types = ['DamageNumberSystem']; // System identifier

  private damageNumberManager: DamageNumberManager;
  private static instance: DamageNumberSystem | null = null;

  constructor(public world: ex.World) {
    super();
    this.damageNumberManager = new DamageNumberManager();
    DamageNumberSystem.instance = this;
  }

  static getInstance(): DamageNumberSystem | null {
    return DamageNumberSystem.instance;
  }

  update(elapsed: number): void {
    this.damageNumberManager.update(elapsed);
  }

  // Method to add damage to an enemy
  addDamage(enemy: ex.Actor, damage: number, isCritical: boolean = false): void {
    this.damageNumberManager.addDamage(enemy, damage, isCritical);
  }

  clear(): void {
    this.damageNumberManager.clear();
  }
}
