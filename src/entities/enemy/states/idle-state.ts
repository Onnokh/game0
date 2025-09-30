import * as ex from 'excalibur';
import type { Enemy } from '../enemy.js';
import { IEnemyState, EnemyStateType } from './enemy-state';
import { worldToGrid } from '../../../lib/grid-utils';
import { findPath } from '../../../lib/pathfinding';

export class IdleState implements IEnemyState {
  enter(enemy: Enemy): void {
    enemy.vel = ex.Vector.Zero;
    enemy.resetPath();
  }

  update(enemy: Enemy, engine: ex.Engine, delta: number): void {
    const player = enemy.getPlayer();
    if (!player) return;

    const distance = enemy.pos.distance(player.pos);
    
    // Transition to Chase if player is within detection range
    if (distance < enemy.detectionRange) {
      enemy.changeState(EnemyStateType.Chase);
      return;
    }

    // Check if enemy is outside wander range
    const spawnPos = enemy.getSpawnPosition();
    const distanceFromSpawn = enemy.pos.distance(spawnPos);
    
    // Wander behavior
    const wanderTarget = enemy.getWanderTarget();
    
    // If we have a wander target and path, follow it
    if (wanderTarget) {
      enemy.followPath(enemy.getIdleSpeed());
      
      // Check if we reached the target
      if (enemy.pos.distance(wanderTarget) < 16) {
        enemy.setWanderTarget(null);
        enemy.resetPath();
        // Wait for a bit before choosing new target
        enemy.setWanderWaitTime(ex.randomInRange(2000, 4000)); // 2-4 seconds
      }
    } else {
      // If outside wander range, return to spawn area first
      if (distanceFromSpawn > enemy.wanderRange) {
        this.returnToWanderRange(enemy, engine);
      } else {
        // Update wait timer
        if (enemy.getWanderWaitTime() > 0) {
          enemy.updateWanderWaitTime(delta);
        } else {
          // Choose a new random wander target within range
          this.chooseNewWanderTarget(enemy, engine);
        }
      }
    }
  }

  private returnToWanderRange(enemy: Enemy, engine: ex.Engine): void {
    const spawnPos = enemy.getSpawnPosition();
    
    // Pick a point at the edge of wander range, towards spawn
    const direction = spawnPos.sub(enemy.pos).normalize();
    const targetDistance = enemy.wanderRange * 0.7; // Go 70% into the range
    const target = spawnPos.add(direction.scale(-targetDistance));
    
    // Find path back to wander range
    const startGrid = worldToGrid(enemy.pos, 16);
    const endGrid = worldToGrid(target, 16);
    
    const path = findPath(startGrid, endGrid, engine, 16, enemy);
    
    if (path.length > 0) {
      enemy.setWanderTarget(target);
      (enemy as any).currentPath = path;
      (enemy as any).pathIndex = 0;
    } else {
      // If no path found, wait and try again
      enemy.setWanderWaitTime(1000);
    }
  }

  private chooseNewWanderTarget(enemy: Enemy, engine: ex.Engine): void {
    const spawnPos = enemy.getSpawnPosition();
    
    // Generate random position within wander range
    const angle = ex.randomInRange(0, Math.PI * 2);
    const distance = ex.randomInRange(enemy.wanderRange * 0.3, enemy.wanderRange * 0.8);
    
    const targetX = spawnPos.x + Math.cos(angle) * distance;
    const targetY = spawnPos.y + Math.sin(angle) * distance;
    const target = ex.vec(targetX, targetY);
    
    // Find path to the target
    const startGrid = worldToGrid(enemy.pos, 16);
    const endGrid = worldToGrid(target, 16);
    
    const path = findPath(startGrid, endGrid, engine, 16, enemy);
    
    if (path.length > 0) {
      enemy.setWanderTarget(target);
      (enemy as any).currentPath = path;
      (enemy as any).pathIndex = 0;
    } else {
      // If no path found, wait and try again
      enemy.setWanderWaitTime(1000);
    }
  }

  exit(enemy: Enemy): void {
    enemy.setWanderTarget(null);
    enemy.resetPath();
  }
}

