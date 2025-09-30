import * as ex from 'excalibur';

/**
 * Check if there is a clear line of sight between two positions
 * @param from Starting position
 * @param to Target position
 * @param engine Excalibur engine instance
 * @param ignoreActors Optional array of actors to ignore in raycast
 * @returns True if line of sight is clear, false if blocked
 */
export function hasLineOfSight(
  from: ex.Vector,
  to: ex.Vector,
  engine: ex.Engine,
  ignoreActors: ex.Actor[] = []
): boolean {
  // Raycast from source to target to check for obstacles
  const direction = to.sub(from);
  const distance = direction.magnitude;
  
  const ray = new ex.Ray(from, direction.normalize());
  const hits = engine.currentScene.physics.rayCast(ray, {
    maxDistance: distance,
    searchAllColliders: true
  });
  
  // Check if any hit is an obstacle
  for (const hit of hits) {
    const hitActor = hit.collider.owner as ex.Actor;
    if (hitActor) {
      // Skip hits on ignored actors
      if (ignoreActors.includes(hitActor)) {
        continue;
      }
      // Any other actor with a collider is an obstacle
      return false;
    }
  }
  
  return true; // Clear line of sight
}

/**
 * Calculate velocity to move towards a target position
 * @param from Current position
 * @param to Target position
 * @param speed Movement speed
 * @returns Velocity vector
 */
export function moveTowardsTarget(
  from: ex.Vector,
  to: ex.Vector,
  speed: number
): ex.Vector {
  const direction = to.sub(from).normalize();
  return direction.scale(speed);
}

