import * as ex from 'excalibur';
import { StatusEffect, StatusEffectComponent } from '../components/status-effect-component';
import { MODIFIER_CONFIGS, BulletModifierType } from '../components/bullet-modifier-component';

/**
 * System that handles visual display of status effects on enemies
 */
export class StatusEffectVisualSystem extends ex.System {
    public readonly systemType = ex.SystemType.Update;
    public priority = 300;

    private statusEffectQuery: ex.Query<typeof StatusEffectComponent | typeof ex.TransformComponent>;

    constructor(public world: ex.World) {
        super();
        this.statusEffectQuery = world.query([StatusEffectComponent, ex.TransformComponent]);
    }

    update(elapsed: number): void {
        for (const entity of this.statusEffectQuery.entities) {
            const statusComponent = entity.get(StatusEffectComponent)!;
            const transform = entity.get(ex.TransformComponent)!;

            if (!(entity instanceof ex.Actor)) continue;

            // Skip if enemy is dead or dying
            if (entity.isKilled() || (entity as any).isDying) {
                continue;
            }

            // Update status effect visuals
            this.updateStatusEffectVisuals(entity as ex.Actor, statusComponent, transform);
        }
    }

    private updateStatusEffectVisuals(actor: ex.Actor, statusComponent: StatusEffectComponent, transform: ex.TransformComponent): void {
        const activeEffects = statusComponent.getActiveEffects();
        
        // Remove existing status effect actors
        this.removeStatusEffectActors(actor);
        
        // Create visual indicators for each active effect
        activeEffects.forEach((effect, index) => {
            this.createStatusEffectVisual(actor, effect, index);
        });

        // Create freeze visual if frozen
        if (statusComponent.isFrozen) {
            this.createFreezeVisual(actor);
        }
    }

    private createStatusEffectVisual(actor: ex.Actor, effect: StatusEffect, index: number): void {
        const config = MODIFIER_CONFIGS[effect.type as unknown as BulletModifierType];
        if (!config) return;

        // Create status effect indicator
        const statusActor = new ex.Actor({
            pos: ex.vec(actor.pos.x, actor.pos.y - 20 - (index * 15)),
            width: 20,
            height: 15,
            z: actor.z + 1
        });

        // Create visual representation
        const canvas = new ex.Canvas({
            width: 20,
            height: 15,
            draw: (ctx: CanvasRenderingContext2D) => {
                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, 20, 15);

                // Border
                ctx.strokeStyle = config.secondaryColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(0, 0, 20, 15);

                // Symbol
                ctx.fillStyle = config.secondaryColor;
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(config.symbol, 10, 7.5);

                // Duration bar
                const progress = effect.duration / 3000; // Assuming 3 second duration
                const barWidth = 16 * progress;
                ctx.fillStyle = config.primaryColor;
                ctx.fillRect(2, 12, barWidth, 2);
            }
        });

        statusActor.graphics.use(canvas);
        statusActor.name = `StatusEffect_${effect.type}`;
        
        // Add to scene
        this.world.add(statusActor);

        // Update position to follow the actor
        const updatePosition = () => {
            if (statusActor.isKilled()) return;
            statusActor.pos = ex.vec(actor.pos.x, actor.pos.y - 20 - (index * 15));
        };

        // Update position every frame
        statusActor.on('preupdate', updatePosition);
    }

    private createFreezeVisual(actor: ex.Actor): void {
        // Create ice crystal effect
        const iceActor = new ex.Actor({
            pos: actor.pos,
            width: 40,
            height: 40,
            z: actor.z + 2
        });

        const canvas = new ex.Canvas({
            width: 40,
            height: 40,
            draw: (ctx: CanvasRenderingContext2D) => {
                // Ice crystal outline
                ctx.strokeStyle = '#87CEEB';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(20, 5);
                ctx.lineTo(30, 15);
                ctx.lineTo(25, 25);
                ctx.lineTo(15, 25);
                ctx.lineTo(10, 15);
                ctx.closePath();
                ctx.stroke();

                // Fill with semi-transparent blue
                ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
                ctx.fill();

                // Sparkle effect
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(18, 8, 2, 2);
                ctx.fillRect(25, 12, 1, 1);
                ctx.fillRect(12, 18, 1, 1);
            }
        });

        iceActor.graphics.use(canvas);
        iceActor.name = 'FreezeEffect';
        
        // Add to scene
        this.world.add(iceActor);

        // Update position to follow the actor
        const updatePosition = () => {
            if (iceActor.isKilled()) return;
            iceActor.pos = actor.pos;
        };

        iceActor.on('preupdate', updatePosition);
    }

    private removeStatusEffectActors(actor: ex.Actor): void {
        // Find and remove all status effect actors for this enemy
        const statusActors = this.world.entities.filter(e => 
            e.name?.startsWith('StatusEffect_') || e.name === 'FreezeEffect'
        );

        statusActors.forEach(statusActor => {
            if (statusActor instanceof ex.Actor) {
                // Check if this status actor belongs to the current enemy
                const distance = actor.pos.distance(statusActor.pos);
                if (distance < 50) { // Within reasonable distance
                    statusActor.kill();
                }
            }
        });
    }
}
