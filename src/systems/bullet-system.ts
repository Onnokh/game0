import * as ex from 'excalibur';
import { BulletComponent } from '../components/bullet-component';
import { BulletModifierComponent } from '../components/bullet-modifier-component';

/**
 * System that handles bullet behavior:
 * - Tracks distance traveled
 * - Removes bullets that exceed max distance
 * - Updates z-index for proper depth sorting
 * - Handles modifier effects
 */
export class BulletSystem extends ex.System {
  public readonly systemType = ex.SystemType.Update;
  public priority = 100;

  private bulletQuery: ex.Query<typeof BulletComponent | typeof ex.TransformComponent | typeof ex.MotionComponent>;
  private modifierQuery: ex.Query<typeof BulletModifierComponent | typeof ex.TransformComponent>;

  constructor(public world: ex.World) {
    super();
    this.bulletQuery = world.query([BulletComponent, ex.TransformComponent, ex.MotionComponent]);
    this.modifierQuery = world.query([BulletModifierComponent, ex.TransformComponent]);
  }

  update(elapsed: number): void {
    // Process regular bullets
    for (const entity of this.bulletQuery.entities) {
      const bullet = entity.get(BulletComponent)!;
      const motion = entity.get(ex.MotionComponent)!;

      // Update distance traveled
      const distanceThisFrame = motion.vel.magnitude * (elapsed / 1000);
      bullet.distanceTraveled += distanceThisFrame;

      // Remove bullet if it has traveled too far (unless it has active modifiers)
      if (bullet.distanceTraveled >= bullet.maxDistance) {
        // If bullet has modifiers, let it continue for a bit longer
        if (bullet.modifiers && bullet.modifiers.modifiers.length > 0) {
          // Only remove if modifiers are also expired
          if (bullet.modifiers.isExpired()) {
            if (entity instanceof ex.Actor) {
              entity.kill();
            }
          }
        } else {
          if (entity instanceof ex.Actor) {
            entity.kill();
          }
        }
        continue;
      }
    }

    // Process bullets with modifiers
    for (const entity of this.modifierQuery.entities) {
      const modifierComponent = entity.get(BulletModifierComponent)!;
      
      // Update modifier durations
      modifierComponent.updateModifiers(elapsed);

      // Remove bullet if all modifiers are expired
      if (modifierComponent.isExpired()) {
        if (entity instanceof ex.Actor) {
          entity.kill();
        }
      }
    }
  }
}

