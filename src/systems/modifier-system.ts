import * as ex from 'excalibur';
import { BulletModifierComponent } from '../components/bullet-modifier-component';
import { BulletComponent } from '../components/bullet-component';

/**
 * System that handles bullet modifier effects like fire DOT, lightning chaining, etc.
 */
export class ModifierSystem extends ex.System {
    public readonly systemType = ex.SystemType.Update;
    public priority = 200; // Run after bullet system

  private bulletQuery: ex.Query<typeof BulletModifierComponent | typeof BulletComponent | typeof ex.TransformComponent>;

  constructor(public world: ex.World) {
    super();
    this.bulletQuery = world.query([BulletModifierComponent, BulletComponent, ex.TransformComponent]);
  }

    update(elapsed: number): void {
        // Modifier effects are now handled on bullet hit in bullet.ts
        // This system is kept for any future continuous effects if needed
        for (const entity of this.bulletQuery.entities) {
            const modifierComponent = entity.get(BulletModifierComponent)!;

            if (!modifierComponent.isActive) continue;

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
