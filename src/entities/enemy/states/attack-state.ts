import * as ex from 'excalibur';
import type { Enemy } from '../enemy.js';
import type { Player } from '../../player';
import { IEnemyState, EnemyStateType } from './enemy-state';

export class AttackState implements IEnemyState {
  private attackTimer = 0;
  private attackCooldown = 1000; // 1 second between attacks

  enter(enemy: Enemy): void {
    enemy.vel = ex.Vector.Zero;
  }

  update(enemy: Enemy, engine: ex.Engine, delta: number): void {
    const player = enemy.getPlayer();
    if (!player) {
      enemy.changeState(EnemyStateType.Idle);
      return;
    }

    const distance = enemy.pos.distance(player.pos);

    // Transition back to Chase if player moves away
    if (distance > enemy.attackRange * 1.2) {
      enemy.changeState(EnemyStateType.Chase);
      return;
    }

    // Attack logic
    this.attackTimer += delta;
    if (this.attackTimer >= this.attackCooldown) {
      this.performAttack(enemy, player);
      this.attackTimer = 0;
    }
  }

  private performAttack(enemy: Enemy, player: Player): void {
    // Use punch system if available
    const punchSystem = enemy.getPunchSystem();
    if (punchSystem) {
      // Calculate direction from enemy to player
      const direction = player.pos.sub(enemy.pos);
      
      // Show punch visual and execute punch
      punchSystem.showPunchArea(enemy, direction);
      const hitEntities = punchSystem.executePunch(enemy, direction);
      
      if (hitEntities.length > 0) {
        console.log(`Enemy punch hit ${hitEntities.length} target(s)`);
      }
    } else {
      // Fallback to direct damage if punch system not available
      player.takeDamage(10);
    }
  }

  exit(enemy: Enemy): void {
    this.attackTimer = 0;
  }
}

