import * as ex from 'excalibur';
import { DamageNumber } from '../entities/damage-number';

interface EnemyDamageData {
  accumulatedDamage: number;
  accumulatedCritical: boolean;
  damageAccumulationTimer: number;
  hasShownFirstDamage: boolean;
  currentDamageNumber: any; // Reference to the current damage number actor
  readonly DAMAGE_ACCUMULATION_GRACE_PERIOD: number;
}

export class DamageNumberManager {
  private enemyDamageData = new Map<ex.Actor, EnemyDamageData>();

  constructor() {
    // Initialize with default grace period
  }

  addDamage(enemy: ex.Actor, damage: number, isCritical: boolean = false): void {
    try {
      // Critical hits are always separate - don't accumulate them
      if (isCritical) {
        this.createSeparateDamageNumber(enemy, damage, true);
        return;
      }

      // Get or create damage data for this enemy (only for normal hits)
      let damageData = this.enemyDamageData.get(enemy);
      if (!damageData) {
        damageData = {
          accumulatedDamage: 0,
          accumulatedCritical: false,
          damageAccumulationTimer: 0,
          hasShownFirstDamage: false,
          currentDamageNumber: null,
          DAMAGE_ACCUMULATION_GRACE_PERIOD: 300
        };
        this.enemyDamageData.set(enemy, damageData);
      }

      // Accumulate normal damage only
      damageData.accumulatedDamage += damage;
      damageData.accumulatedCritical = false; // Normal hits are never critical
      
      // Reset the grace period timer when new damage is added
      damageData.damageAccumulationTimer = 0;
      
      // Update or create the damage number - flash only on first damage of cycle
      const shouldFlash = damageData.accumulatedDamage === damage; // Only flash if this is the first damage
      this.updateDamageNumber(enemy, damageData, shouldFlash);
      
    } catch (error) {
      console.error('Error adding damage:', error);
    }
  }

  update(delta: number): void {
    try {
      // Process damage for each enemy
      for (const [enemy, damageData] of this.enemyDamageData.entries()) {
        // Skip if enemy is dead or has no accumulated damage
        if (enemy.isKilled() || damageData.accumulatedDamage <= 0) {
          continue;
        }

        // Update timer
        damageData.damageAccumulationTimer += delta;

        // Make damage number follow the enemy at top center
        if (damageData.currentDamageNumber && !damageData.currentDamageNumber.isKilled()) {
          const damagePos = ex.vec(enemy.pos.x, enemy.pos.y - enemy.height / 2);
          damageData.currentDamageNumber.pos = damagePos;
        }

        // After grace period expires, let the damage number start floating
        if (damageData.damageAccumulationTimer >= damageData.DAMAGE_ACCUMULATION_GRACE_PERIOD) {
          // Clear the reference so a new damage number can be created next time
          damageData.currentDamageNumber = null;
          
          // Reset accumulation
          damageData.accumulatedDamage = 0;
          damageData.accumulatedCritical = false;
          damageData.damageAccumulationTimer = 0;
        }
      }

      // Clean up dead enemies
      this.cleanupDeadEnemies();
    } catch (error) {
      console.error('Error updating damage numbers:', error);
    }
  }

  private updateDamageNumber(enemy: ex.Actor, damageData: any, shouldFlash: boolean = true): void {
    try {
      // If we already have a damage number, update it
      if (damageData.currentDamageNumber && !damageData.currentDamageNumber.isKilled()) {
        damageData.currentDamageNumber.updateDamage(damageData.accumulatedDamage, damageData.accumulatedCritical);
      } else {
        // Create new damage number with random offset
        const randomOffsetX = (Math.random() - 0.5) * 40; // -20 to +20 pixels
        const randomOffsetY = (Math.random() - 0.5) * 20; // -10 to +10 pixels
        const damagePos = ex.vec(
          enemy.pos.x + randomOffsetX, 
          enemy.pos.y - enemy.height / 2 + randomOffsetY
        );
        const damageNumber = DamageNumber.createDamageNumber(damagePos, damageData.accumulatedDamage, damageData.accumulatedCritical);
        enemy.scene?.add(damageNumber);
        damageData.currentDamageNumber = damageNumber;
      }

      // Flash effect only when requested (once per damage cycle)
      if (shouldFlash) {
        enemy.actions.flash(new ex.Color(255, 255, 255, 0.5), 100);
      }
    } catch (error) {
      console.error('Error updating damage number:', error);
    }
  }

  private createSeparateDamageNumber(enemy: ex.Actor, damage: number, isCritical: boolean): void {
    try {
      // Create a separate damage number for critical hits with random offset
      const randomOffsetX = (Math.random() - 0.5) * 40; // -20 to +20 pixels
      const randomOffsetY = (Math.random() - 0.5) * 20; // -10 to +10 pixels
      const damagePos = ex.vec(
        enemy.pos.x + randomOffsetX, 
        enemy.pos.y - enemy.height / 2 + randomOffsetY
      );
      const damageNumber = DamageNumber.createDamageNumber(damagePos, damage, isCritical);
      enemy.scene?.add(damageNumber);

      // Flash effect for critical hits
      enemy.actions.flash(new ex.Color(255, 255, 255, 0.5), 100);
    } catch (error) {
      console.error('Error creating separate damage number:', error);
    }
  }

  private cleanupDeadEnemies(): void {
    for (const [enemy] of this.enemyDamageData.entries()) {
      if (enemy.isKilled()) {
        this.enemyDamageData.delete(enemy);
      }
    }
  }

  clear(): void {
    this.enemyDamageData.clear();
  }
}
