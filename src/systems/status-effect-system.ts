import * as ex from 'excalibur';
import { StatusEffectComponent } from '../components/status-effect-component';

/**
 * System that updates status effects on enemies
 */
export class StatusEffectSystem extends ex.System {
    public readonly systemType = ex.SystemType.Update;
    public priority = 200;

    private statusEffectQuery: ex.Query<typeof StatusEffectComponent | typeof ex.TransformComponent>;

    constructor(public world: ex.World) {
        super();
        this.statusEffectQuery = world.query([StatusEffectComponent, ex.TransformComponent]);
    }

    update(elapsed: number): void {
        for (const entity of this.statusEffectQuery.entities) {
            const statusComponent = entity.get(StatusEffectComponent)!;
            
            if (!(entity instanceof ex.Actor)) continue;

            // Skip if enemy is dead or dying
            if (entity.isKilled() || (entity as any).isDying) {
                continue;
            }

            // Update all status effects on this enemy
            statusComponent.updateEffects(elapsed, entity as ex.Actor);
        }
    }
}
