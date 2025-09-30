import * as ex from 'excalibur';
import type { Enemy } from '../enemy.js';
import type { Player } from '../../player';
import { IEnemyState, EnemyStateType } from './enemy-state';

export class AttackState implements IEnemyState {
  private attackTimer = 0;
  private attackCooldown = 1000; // 1 second between attacks

  enter(enemy: Enemy): void {
    enemy.vel = ex.Vector.Zero;
    enemy.setColor(ex.Color.Yellow);
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

    // Face the player
    const direction = player.pos.sub(enemy.pos).normalize();
    enemy.rotation = Math.atan2(direction.y, direction.x);

    // Attack logic
    this.attackTimer += delta;
    if (this.attackTimer >= this.attackCooldown) {
      this.performAttack(enemy, player);
      this.attackTimer = 0;
    }
  }

  private performAttack(enemy: Enemy, player: Player): void {
    console.log('Enemy attacks!');
    // Add attack logic here (damage, effects, etc.)
  }

  exit(enemy: Enemy): void {
    this.attackTimer = 0;
  }
}

