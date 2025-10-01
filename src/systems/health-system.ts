import * as ex from 'excalibur';
import { HealthComponent } from '../components/health-component';

export class HealthSystem extends ex.System {
    public readonly systemType = ex.SystemType.Update;
    public priority = 0;

    constructor(public world: ex.World) {
        super();
    }

    update(elapsed: number): void {
        // This system can be used for health-related updates
        // For now, it's a placeholder for future health management features
        // like health regeneration, poison effects, etc.
    }

    /**
     * Apply damage to an entity with a health component
     */
    damageEntity(entity: ex.Entity, amount: number): boolean {
        const healthComponent = entity.get(HealthComponent);
        if (!healthComponent) return false;

        return healthComponent.takeDamage(amount);
    }

    /**
     * Heal an entity with a health component
     */
    healEntity(entity: ex.Entity, amount: number): void {
        const healthComponent = entity.get(HealthComponent);
        if (!healthComponent) return;

        healthComponent.heal(amount);
    }

    /**
     * Check if an entity is alive
     */
    isEntityAlive(entity: ex.Entity): boolean {
        const healthComponent = entity.get(HealthComponent);
        if (!healthComponent) return false;

        return healthComponent.isAlive();
    }
}
