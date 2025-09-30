import * as ex from 'excalibur';
import type { Enemy } from '../enemy.js';
import { IEnemyState, EnemyStateType } from './enemy-state';

export class ChaseState implements IEnemyState {
  private pathUpdateTimer = 0;

  enter(enemy: Enemy): void {
    enemy.setColor(ex.Color.Red);
    enemy.resetPath();
  }

  update(enemy: Enemy, engine: ex.Engine, delta: number): void {
    const player = enemy.getPlayer();
    if (!player) {
      enemy.changeState(EnemyStateType.Idle);
      return;
    }

    const distance = enemy.pos.distance(player.pos);

    // Transition to Idle if player is too far
    if (distance > enemy.detectionRange * 1.25) {
      enemy.changeState(EnemyStateType.Idle);
      return;
    }

    // Transition to Attack if close enough
    if (distance < enemy.attackRange) {
      enemy.changeState(EnemyStateType.Attack);
      return;
    }

    // Update path every 500ms
    this.pathUpdateTimer += delta;
    if (this.pathUpdateTimer >= 500) {
      enemy.updatePath(engine);
      this.pathUpdateTimer = 0;
    }

    // Follow the current path
    enemy.followPath();

    // Rotate towards movement direction
    if (enemy.vel.size > 0) {
      const direction = enemy.vel.normalize();
      enemy.rotation = Math.atan2(direction.y, direction.x);
    }
  }

  exit(enemy: Enemy): void {
    this.pathUpdateTimer = 0;
  }
}

