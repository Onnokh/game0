import * as ex from 'excalibur';

// Create collision groups
export const bulletGroup = ex.CollisionGroupManager.create('bullet');
export const playerGroup = ex.CollisionGroupManager.create('player');
export const enemyGroup = ex.CollisionGroupManager.create('enemy');
export const environmentGroup = ex.CollisionGroupManager.create('environment');

// Define collision rules
export const bulletCollisionGroup = ex.CollisionGroup.collidesWith([
    enemyGroup,
    environmentGroup
]);

export const playerCollisionGroup = ex.CollisionGroup.collidesWith([
    enemyGroup,
    environmentGroup
]);

export const enemyCollisionGroup = ex.CollisionGroup.collidesWith([
    playerGroup,
    bulletGroup,
    environmentGroup
]);

export const environmentCollisionGroup = ex.CollisionGroup.collidesWith([
    playerGroup,
    bulletGroup,
    enemyGroup
]);
