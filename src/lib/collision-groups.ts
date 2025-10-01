import * as ex from 'excalibur';

// Create base collision groups
export const bulletGroup = ex.CollisionGroupManager.create('bullet');
export const playerGroup = ex.CollisionGroupManager.create('player');
export const enemyGroup = ex.CollisionGroupManager.create('enemy');
export const environmentGroup = ex.CollisionGroupManager.create('environment');

// Define collision rules using CollisionGroup.collidesWith helper
// Bullets should collide with enemies and environment (trees, walls, etc.)
// Bullets do NOT collide with player to prevent pushing the player when shooting
export const bulletCollisionGroup = ex.CollisionGroup.collidesWith([
    enemyGroup,
    environmentGroup
]);
