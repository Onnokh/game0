import * as ex from 'excalibur';
import { ExcaliburAStar, type GraphTileMap, type aStarNode } from '@excaliburjs/plugin-pathfinding';
import { gridToWorld } from './grid-utils';

/**
 * Create a dynamic collision grid for pathfinding
 */
function createCollisionGrid(
  engine: ex.Engine,
  tileSize: number,
  gridWidth: number,
  gridHeight: number,
  offsetX: number,
  offsetY: number,
  excludeActor?: ex.Actor
): GraphTileMap {
  const tiles = [];
  
  // Get all actors with colliders that should block pathfinding
  // Include Fixed colliders (trees), exclude the pathfinding actor itself
  const actors = engine.currentScene.actors.filter(
    actor => actor.collider && 
             actor.collider.bounds && 
             actor !== excludeActor
  );
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      // Convert grid position to world position
      const worldPos = gridToWorld(ex.vec(x + offsetX, y + offsetY), tileSize);
      
      // Check if any actor's collider overlaps this grid cell
      // Add padding to account for the pathfinding entity's size
      const padding = tileSize; // Account for entity radius
      let hasCollision = false;
      
      for (const actor of actors) {
        // Only consider Fixed collision type (trees, walls, etc) as obstacles
        // Skip Active collision types (player, other enemies)
        const collisionType = (actor as any).body?.collisionType;
        if (collisionType === ex.CollisionType.Fixed) {
          // Check if this position is within padding distance of the obstacle
          if (actor.collider.bounds) {
            // Expand bounds by padding amount
            const expandedBounds = actor.collider.bounds.expand(padding);
            if (expandedBounds.contains(worldPos)) {
              hasCollision = true;
              break;
            }
          }
        }
      }
      
      tiles.push({
        index: y * gridWidth + x,
        coordinates: { x, y },
        collider: hasCollision
      });
    }
  }
  
  return {
    name: 'collision-grid',
    tiles,
    rows: gridHeight,
    cols: gridWidth
  };
}

/**
 * Find a path from start to end using A* pathfinding algorithm
 * @param start Starting grid position
 * @param end Target grid position
 * @param engine Excalibur engine instance
 * @param tileSize Size of each grid tile
 * @param excludeActor Optional actor to exclude from collision detection (usually the pathfinding entity itself)
 * @returns Array of world positions representing the path, or empty array if no path found
 */
export function findPath(
  start: ex.Vector,
  end: ex.Vector,
  engine: ex.Engine,
  tileSize: number,
  excludeActor?: ex.Actor
): ex.Vector[] {
  // Create a grid that covers the area we need to pathfind
  // Add padding to ensure we have enough space
  const minX = Math.min(start.x, end.x) - 10;
  const maxX = Math.max(start.x, end.x) + 10;
  const minY = Math.min(start.y, end.y) - 10;
  const maxY = Math.max(start.y, end.y) + 10;
  
  const gridWidth = maxX - minX + 1;
  const gridHeight = maxY - minY + 1;
  
  // Create the collision grid
  const gridTileMap = createCollisionGrid(engine, tileSize, gridWidth, gridHeight, minX, minY, excludeActor);
  
  // Create A* instance
  const astar = new ExcaliburAStar(gridTileMap);
  
  // Adjust start/end positions to be relative to our grid
  const adjustedStart = ex.vec(start.x - minX, start.y - minY);
  const adjustedEnd = ex.vec(end.x - minX, end.y - minY);
  
  // Get nodes
  const startNode = astar.getNodeByCoord(adjustedStart.x, adjustedStart.y);
  const endNode = astar.getNodeByCoord(adjustedEnd.x, adjustedEnd.y);
  
  // Find path (with diagonal movement)
  const pathNodes: aStarNode[] = astar.astar(startNode, endNode, true);
  
  // Convert back to world positions
  return pathNodes.map(node => 
    gridToWorld(ex.vec(node.x + minX, node.y + minY), tileSize)
  );
}
