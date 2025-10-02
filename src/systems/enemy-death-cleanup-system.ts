import * as ex from 'excalibur';
import { StatusEffectComponent } from '../components/status-effect-component';

/**
 * System that cleans up status effects when enemies die
 */
export class EnemyDeathCleanupSystem extends ex.System {
    public readonly systemType = ex.SystemType.Update;
    public priority = 400; // Run after other systems

    private enemyQuery: ex.Query<typeof ex.TransformComponent>;

    constructor(public world: ex.World) {
        super();
        this.enemyQuery = world.query([ex.TransformComponent]);
    }

    update(elapsed: number): void {
        // Check for enemies that are about to be killed
        for (const entity of this.enemyQuery.entities) {
            if (entity instanceof ex.Actor && entity.name === 'Enemy') {
                // Check if enemy is dying or dead
                if (entity.isKilled() || (entity as any).isDying) {
                    this.cleanupEnemyStatusEffects(entity);
                }
            }
        }
    }

    private cleanupEnemyStatusEffects(enemy: ex.Actor): void {
        // Get status effect component
        const statusComponent = enemy.get(StatusEffectComponent);
        if (statusComponent) {
            statusComponent.clearAllEffects();
        }

        // Remove status effect visual actors
        this.removeStatusEffectVisuals(enemy);
    }

    private removeStatusEffectVisuals(enemy: ex.Actor): void {
        // Find and remove all status effect actors for this enemy
        const statusActors = this.world.entities.filter(e => 
            e.name?.startsWith('StatusEffect_') || e.name === 'FreezeEffect'
        );

        statusActors.forEach(statusActor => {
            if (statusActor instanceof ex.Actor) {
                // Check if this status actor belongs to the current enemy
                const distance = enemy.pos.distance(statusActor.pos);
                if (distance < 50) { // Within reasonable distance
                    statusActor.kill();
                }
            }
        });
    }
}
