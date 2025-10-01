import * as ex from 'excalibur';
import { BulletComponent } from '../components/bullet-component';

/**
 * System that handles bullet behavior:
 * - Tracks distance traveled
 * - Removes bullets that exceed max distance
 * - Updates z-index for proper depth sorting
 */
export class BulletSystem extends ex.System {
  public readonly systemType = ex.SystemType.Update;
  public priority = 100;

  private bulletQuery: ex.Query<typeof BulletComponent | typeof ex.TransformComponent | typeof ex.MotionComponent>;

  constructor(public world: ex.World) {
    super();
    this.bulletQuery = world.query([BulletComponent, ex.TransformComponent, ex.MotionComponent]);
  }

  update(elapsed: number): void {
    for (const entity of this.bulletQuery.entities) {
      const bullet = entity.get(BulletComponent)!;
      const motion = entity.get(ex.MotionComponent)!;
      const transform = entity.get(ex.TransformComponent)!;

      // Update distance traveled
      const distanceThisFrame = motion.vel.magnitude * (elapsed / 1000);
      bullet.distanceTraveled += distanceThisFrame;

      // Remove bullet if it has traveled too far
      if (bullet.distanceTraveled >= bullet.maxDistance) {
        if (entity instanceof ex.Actor) {
          entity.kill();
        }
        continue;
      }

      // Update z-index for proper depth sorting (keep bullets above everything else)
      transform.z = transform.pos.y + 1000;
    }
  }
}

