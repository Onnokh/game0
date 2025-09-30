import * as ex from 'excalibur';

/**
 * Convert world coordinates to grid coordinates
 */
export function worldToGrid(worldPos: ex.Vector, tileSize: number): ex.Vector {
  return ex.vec(
    Math.floor(worldPos.x / tileSize),
    Math.floor(worldPos.y / tileSize)
  );
}

/**
 * Convert grid coordinates to world coordinates (center of tile)
 */
export function gridToWorld(gridPos: ex.Vector, tileSize: number): ex.Vector {
  return ex.vec(
    gridPos.x * tileSize + tileSize / 2,
    gridPos.y * tileSize + tileSize / 2
  );
}

