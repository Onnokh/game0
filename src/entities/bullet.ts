import * as ex from 'excalibur';
import { bulletCollisionGroup } from '../lib/collision-groups';
import { BulletComponent } from '../components/bullet-component';
import { DamageNumberSystem } from '../systems/damage-number-system';

export class Bullet extends ex.Actor {
    private speed = 600; // pixels per second
    private trailEmitter!: ex.ParticleEmitter;

    constructor(startPos: ex.Vector, direction: ex.Vector, damage: number = 25) {
        super({
            name: 'Bullet',
            pos: startPos,
            width: 8,
            height: 8,
            collisionType: ex.CollisionType.Active,
            collisionGroup: bulletCollisionGroup,
            anchor: ex.vec(0.5, 0.5) // Center the bullet
        });

        // Add the bullet component
        this.addComponent(new BulletComponent(damage));
        
        // Set velocity based on direction and speed
        this.vel = direction.normalize().scale(this.speed);
        
        // Calculate rotation angle to face the direction of travel
        this.rotation = Math.atan2(direction.y, direction.x);
        
        // Set z-index to be above most things
        this.z = 1000;
    }

    override onInitialize(): void {
        // Create simple bullet body (small elongated rectangle)
        const bulletBody = new ex.Rectangle({
            width: 8,
            height: 3,
            color: ex.Color.fromHex('#FFD700') // Gold/yellow color
        });
        
        this.graphics.use(bulletBody);
        
        // Create minimal trail particle emitter
        this.trailEmitter = new ex.ParticleEmitter({
            pos: ex.vec(0, 0),
            emitterType: ex.EmitterType.Rectangle,
            radius: 1,
            isEmitting: true,
            emitRate: 8, // Much fewer particles per second for better performance
            particle: {
                life: 200, // Shorter life for better performance
                opacity: 0.8,
                fade: true,
                minSize: 1,
                maxSize: 2,
                startSize: 2,
                endSize: 0,
                minSpeed: 3,
                maxSpeed: 10,
                minAngle: Math.PI - 0.2,
                maxAngle: Math.PI + 0.2,
                beginColor: ex.Color.fromHex('#FFD700'),
                endColor: ex.Color.fromHex('#FF8800'),
            }
        });
        
        this.addChild(this.trailEmitter);
        
        // Add collision event handlers
        this.on('precollision', this.onPreCollision.bind(this));
    }

    onPreCollision(event: ex.PreCollisionEvent): void {
        const otherActor = event.other.owner as ex.Actor;
        const bulletComponent = this.get(BulletComponent)!;
        
        // Early exit if bullet is already being destroyed
        if (this.isKilled()) return;
        
        // Check if collision is with a tile or tilemap
        if (event.other.owner instanceof ex.Tile || event.other.owner instanceof ex.TileMap) {
            this.kill();
            return;
        }
        
        // Handle collision with enemies
        if (otherActor?.name === 'Enemy') {
            // Calculate critical hit (10% chance)
            const isCritical = Math.random() < 0.05;
            const finalDamage = isCritical ? bulletComponent.damage * 2 : bulletComponent.damage;
            
            // Deal damage to enemy
            if (typeof (otherActor as any).takeDamage === 'function') {
                (otherActor as any).takeDamage(finalDamage, isCritical);
            }
            
            // Notify damage number system
            const damageNumberSystem = DamageNumberSystem.getInstance();
            if (damageNumberSystem) {
                damageNumberSystem.addDamage(otherActor, finalDamage, isCritical);
            }
            
            this.kill();
            return;
        }
        
        // Handle collision with solid objects (walls, trees, etc.)
        if (otherActor?.body?.collisionType === ex.CollisionType.Fixed) {
            this.kill();
            return;
        }
    }

    getDamage(): number {
        return this.get(BulletComponent)?.damage ?? 0;
    }
    
    override onPostKill(): void {
        // Stop emitting particles when bullet is destroyed
        if (this.trailEmitter) {
            this.trailEmitter.isEmitting = false;
            this.trailEmitter.kill(); // Properly destroy the emitter to prevent memory leaks
        }
    }
}
