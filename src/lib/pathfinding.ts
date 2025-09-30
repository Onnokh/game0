import * as ex from 'excalibur';
import { gridToWorld } from './grid-utils';

interface PathNode {
  pos: ex.Vector;
  g: number;
  h: number;
  f: number;
  parent?: ex.Vector;
}

/**
 * Calculate Manhattan distance heuristic for A* pathfinding
 */
function heuristic(a: ex.Vector, b: ex.Vector): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if a grid position is walkable (no collisions)
 */
function isWalkable(gridPos: ex.Vector, engine: ex.Engine, tileSize: number): boolean {
  // Convert grid position to world position
  const worldPos = gridToWorld(gridPos, tileSize);
  
  // Check for collisions in this grid cell
  const hit = engine.currentScene.physics.rayCast(
    new ex.Ray(worldPos, ex.Vector.Right),
    { maxDistance: 1 }
  );
  
  // If no collision detected, it's walkable
  return hit.length === 0;
}

/**
 * Reconstruct the path from the final node back to the start
 */
function reconstructPath(current: PathNode, tileSize: number): ex.Vector[] {
  const path: ex.Vector[] = [];
  let node: PathNode | null = current;
  
  while (node) {
    path.unshift(gridToWorld(node.pos, tileSize));
    node = node.parent ? { pos: node.parent } as PathNode : null;
  }
  
  return path.slice(1); // Remove the starting position
}

/**
 * Find a path from start to end using A* pathfinding algorithm
 * @param start Starting grid position
 * @param end Target grid position
 * @param engine Excalibur engine instance
 * @param tileSize Size of each grid tile
 * @returns Array of world positions representing the path, or empty array if no path found
 */
export function findPath(
  start: ex.Vector,
  end: ex.Vector,
  engine: ex.Engine,
  tileSize: number
): ex.Vector[] {
  // Simple A* pathfinding
  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();
  
  openSet.push({ pos: start, g: 0, h: heuristic(start, end), f: heuristic(start, end) });
  
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
      return reconstructPath(current, tileSize);
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
      if (!isWalkable(neighborPos, engine, tileSize)) continue;
      
      const tentativeG = current.g + (neighbor.x !== 0 && neighbor.y !== 0 ? 1.414 : 1);
      
      // Check if this path to neighbor is better
      const existing = openSet.find(n => n.pos.x === neighborPos.x && n.pos.y === neighborPos.y);
      if (!existing) {
        const h = heuristic(neighborPos, end);
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
