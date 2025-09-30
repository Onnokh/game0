import * as ex from 'excalibur';
import { Player } from './player';

export class Enemy extends ex.Actor {
  private player: Player | null = null;
  private moveSpeed = 100;
  private tileSize = 16;
  private currentPath: ex.Vector[] = [];
  private pathIndex = 0;
  private pathUpdateTimer = 0;

  constructor(x: number, y: number) {
    super({
      name: 'Enemy',
      pos: new ex.Vector(x, y),
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.Active,
    });
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  override onInitialize(): void {
    // Create a simple red square graphic
    const redSquare = new ex.Rectangle({
      width: this.width,
      height: this.height,
      color: ex.Color.Red,
    });
    
    this.graphics.add(redSquare);
  }

  override onPreUpdate(engine: ex.Engine, delta: number): void {
    if (!this.player) return;

    // Update path every 500ms
    this.pathUpdateTimer += delta;
    if (this.pathUpdateTimer >= 500) {
      this.updatePath(engine);
      this.pathUpdateTimer = 0;
    }

    // Follow the current path
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      const target = this.currentPath[this.pathIndex];
      const direction = target.sub(this.pos).normalize();
      this.vel = direction.scale(this.moveSpeed);

      // Check if we've reached the current waypoint
      if (this.pos.distance(target) < 8) {
        this.pathIndex++;
      }
    } else {
      this.vel = ex.Vector.Zero;
    }
  }

  private updatePath(engine: ex.Engine): void {
    if (!this.player) return;

    const startGrid = this.worldToGrid(this.pos);
    const endGrid = this.worldToGrid(this.player.pos);
    
    this.currentPath = this.findPath(startGrid, endGrid, engine);
    this.pathIndex = 0;
  }

  private worldToGrid(worldPos: ex.Vector): ex.Vector {
    return ex.vec(
      Math.floor(worldPos.x / this.tileSize),
      Math.floor(worldPos.y / this.tileSize)
    );
  }

  private gridToWorld(gridPos: ex.Vector): ex.Vector {
    return ex.vec(
      gridPos.x * this.tileSize + this.tileSize / 2,
      gridPos.y * this.tileSize + this.tileSize / 2
    );
  }

  private findPath(start: ex.Vector, end: ex.Vector, engine: ex.Engine): ex.Vector[] {
    // Simple A* pathfinding
    const openSet: Array<{ pos: ex.Vector, g: number, h: number, f: number, parent?: ex.Vector }> = [];
    const closedSet = new Set<string>();
    
    openSet.push({ pos: start, g: 0, h: this.heuristic(start, end), f: this.heuristic(start, end) });
    
    while (openSet.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }
      
      const current = openSet.splice(currentIndex, 1)[0];
      const currentKey = `${current.pos.x},${current.pos.y}`;
      closedSet.add(currentKey);
      
      // Check if we reached the goal
      if (current.pos.x === end.x && current.pos.y === end.y) {
        return this.reconstructPath(current);
      }
      
      // Check all 8 neighbors (including diagonals)
      const neighbors = [
        ex.vec(-1, -1), ex.vec(0, -1), ex.vec(1, -1),
        ex.vec(-1, 0),                 ex.vec(1, 0),
        ex.vec(-1, 1),  ex.vec(0, 1),  ex.vec(1, 1)
      ];
      
      for (const neighbor of neighbors) {
        const neighborPos = current.pos.add(neighbor);
        const neighborKey = `${neighborPos.x},${neighborPos.y}`;
        
        if (closedSet.has(neighborKey)) continue;
        if (!this.isWalkable(neighborPos, engine)) continue;
        
        const tentativeG = current.g + (neighbor.x !== 0 && neighbor.y !== 0 ? 1.414 : 1);
        
        // Check if this path to neighbor is better
        const existing = openSet.find(n => n.pos.x === neighborPos.x && n.pos.y === neighborPos.y);
        if (!existing) {
          const h = this.heuristic(neighborPos, end);
          openSet.push({
            pos: neighborPos,
            g: tentativeG,
            h: h,
            f: tentativeG + h,
            parent: current.pos
          });
        } else if (tentativeG < existing.g) {
          existing.g = tentativeG;
          existing.f = tentativeG + existing.h;
          existing.parent = current.pos;
        }
      }
    }
    
    return []; // No path found
  }

  private isWalkable(gridPos: ex.Vector, engine: ex.Engine): boolean {
    // Convert grid position to world position
    const worldPos = this.gridToWorld(gridPos);
    
    // Check for collisions in this grid cell
    const hit = engine.currentScene.physics.rayCast(
      new ex.Ray(worldPos, ex.Vector.Right),
      { maxDistance: 1 }
    );
    
    // If no collision detected, it's walkable
    return hit.length === 0;
  }

  private heuristic(a: ex.Vector, b: ex.Vector): number {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private reconstructPath(current: any): ex.Vector[] {
    const path: ex.Vector[] = [];
    let node: any = current;
    
    while (node) {
      path.unshift(this.gridToWorld(node.pos));
      node = node.parent ? { pos: node.parent } : null;
    }
    
    return path.slice(1); // Remove the starting position
  }

  override onPostUpdate(engine: ex.Engine, delta: number): void {
    // Draw path
    for (let i = 0; i < this.currentPath.length - 1; i++) {
      ex.Debug.drawLine(
        this.currentPath[i],
        this.currentPath[i + 1],
        { color: ex.Color.Green }
      );
    }
    
    // Draw current target
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      ex.Debug.drawLine(
        this.pos.add(ex.vec(this.width / 2, this.height / 2)),
        this.currentPath[this.pathIndex],
        { color: ex.Color.Yellow }
      );
    }
    
    // Draw line to player
    if (this.player) {
      ex.Debug.drawLine(
        this.pos.add(ex.vec(this.width / 2, this.height / 2)),
        this.player.pos.add(ex.vec(this.player.width / 2, this.player.height / 2)),
        { color: ex.Color.Blue }
      );
    }
  }
}
