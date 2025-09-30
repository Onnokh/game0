import * as ex from 'excalibur';
import { hasLineOfSight, moveTowardsTarget } from '../lib/ai-utils';
import { worldToGrid } from '../lib/grid-utils';
import { findPath } from '../lib/pathfinding';

/**
 * Base class for AI-controlled actors with pathfinding and line-of-sight capabilities
 */
export class AIActor extends ex.Actor {
  protected currentPath: ex.Vector[] = [];
  protected pathIndex = 0;
  protected tileSize = 16;

  /**
   * Check if this actor has a clear line of sight to a target position
   * @param target Target position to check
   * @param engine Excalibur engine instance
   * @param additionalIgnoreActors Additional actors to ignore in the raycast
   * @returns True if line of sight is clear
   */
  hasLineOfSightToTarget(target: ex.Vector, engine: ex.Engine, additionalIgnoreActors: ex.Actor[] = []): boolean {
    return hasLineOfSight(this.pos, target, engine, [this, ...additionalIgnoreActors]);
  }

  /**
   * Move directly towards a target position
   * @param target Target position
   * @param speed Movement speed
   */
  moveDirectlyToTarget(target: ex.Vector, speed: number): void {
    this.vel = moveTowardsTarget(this.pos, target, speed);
  }

  /**
   * Follow the current path towards the next waypoint
   * @param speed Movement speed (optional)
   */
  followPath(speed?: number): void {
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      const target = this.currentPath[this.pathIndex];
      const direction = target.sub(this.pos).normalize();
      const actualSpeed = speed ?? 100; // Default speed
      this.vel = direction.scale(actualSpeed);

      // Check if we've reached the current waypoint
      if (this.pos.distance(target) < 8) {
        this.pathIndex++;
      }
    } else {
      this.vel = ex.Vector.Zero;
    }
  }

  /**
   * Update the path to a target position using A* pathfinding
   * @param target Target position
   * @param engine Excalibur engine instance
   */
  updatePath(target: ex.Vector, engine: ex.Engine): void {
    const startGrid = worldToGrid(this.pos, this.tileSize);
    const endGrid = worldToGrid(target, this.tileSize);
    
    this.currentPath = findPath(startGrid, endGrid, engine, this.tileSize, this);
    this.pathIndex = 0;
  }

  /**
   * Reset the current path
   */
  resetPath(): void {
    this.currentPath = [];
    this.pathIndex = 0;
  }

  /**
   * Get the current path
   */
  getPath(): ex.Vector[] {
    return this.currentPath;
  }

  /**
   * Get the current path index
   */
  getPathIndex(): number {
    return this.pathIndex;
  }
}

