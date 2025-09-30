import * as ex from 'excalibur';
import type { Enemy } from '../enemy.js';
import { IEnemyState, EnemyStateType } from './enemy-state';

export class IdleState implements IEnemyState {
  enter(enemy: Enemy): void {
    enemy.vel = ex.Vector.Zero;
    enemy.setColor(ex.Color.Orange);
  }

  update(enemy: Enemy, engine: ex.Engine, delta: number): void {
    const player = enemy.getPlayer();
    if (!player) return;

    const distance = enemy.pos.distance(player.pos);
    
    // Transition to Chase if player is within detection range
    if (distance < enemy.detectionRange) {
      enemy.changeState(EnemyStateType.Chase);
    }
  }

  exit(enemy: Enemy): void {
    // Cleanup if needed
  }
}

