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
    player.takeDamage(10);
  }

  exit(enemy: Enemy): void {
    this.attackTimer = 0;
  }
}

