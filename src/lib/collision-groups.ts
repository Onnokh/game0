import * as ex from 'excalibur';

// Create base collision groups
export const bulletGroup = ex.CollisionGroupManager.create('bullet');
export const playerGroup = ex.CollisionGroupManager.create('player');
export const enemyGroup = ex.CollisionGroupManager.create('enemy');
export const environmentGroup = ex.CollisionGroupManager.create('environment');

// Define collision rules using CollisionGroup.collidesWith helper
// Bullets should collide with enemies and environment (trees, walls, etc.)
export const bulletCollisionGroup = ex.CollisionGroup.collidesWith([
    enemyGroup,
    environmentGroup,
    playerGroup  // Also collide with players (prevent friendly fire issues)
]);
