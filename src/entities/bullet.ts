import * as ex from 'excalibur';
import { bulletCollisionGroup } from '../lib/collision-groups';

export class Bullet extends ex.Actor {
    private speed = 600; // pixels per second - increased for better visibility
    private maxDistance = 1200; // maximum distance before bullet disappears
    private distanceTraveled = 0;
    private damage: number;

    constructor(startPos: ex.Vector, direction: ex.Vector, damage: number = 25) {
        super({
            name: 'Bullet',
            pos: startPos,
            width: 4,
            height: 4,
            collisionType: ex.CollisionType.Active,
            collisionGroup: bulletCollisionGroup,
            anchor: ex.vec(0.5, 0.5) // Center the bullet
        });

        this.damage = damage;
        
        // Set velocity based on direction and speed
        this.vel = direction.normalize().scale(this.speed);
        
        // Debug logging
        console.log(`Bullet created with direction: (${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}), velocity: (${this.vel.x.toFixed(2)}, ${this.vel.y.toFixed(2)})`);
        
        // Set z-index to be above most things
        this.z = 1000;
    }

    override onInitialize(): void {
        // Create a more visible bullet graphic (larger red circle)
        const bulletGraphic = new ex.Circle({
            radius: 4,
            color: ex.Color.Red
        });
        
        this.graphics.use(bulletGraphic);
        
        // Add collision event handlers
        this.on('precollision', this.onPreCollision.bind(this));
    }

    override onPreUpdate(engine: ex.Engine, delta: number): void {
        // Update distance traveled
        const distanceThisFrame = this.vel.magnitude * (delta / 1000);
        this.distanceTraveled += distanceThisFrame;
        
        // Remove bullet if it has traveled too far
        if (this.distanceTraveled >= this.maxDistance) {
            this.kill();
            return;
        }
        
        // Update z-index for proper depth sorting
        this.z = this.pos.y + 1000; // Keep bullets above everything else
    }

    onPreCollision(event: ex.PreCollisionEvent): void {
        const otherActor = event.other.owner as ex.Actor;
        
        // Check if collision is with a tile or tilemap
        if (event.other.owner instanceof ex.Tile || event.other.owner instanceof ex.TileMap) {
            console.log('Bullet hit tile/tilemap!');
            this.kill();
            return;
        }
        
        console.log(`Bullet colliding with: ${otherActor?.name || 'Unknown'}`);
        
        // Handle collision with enemies
        if (otherActor?.name === 'Enemy') {
            console.log('Bullet hit enemy!');
            // Deal damage to enemy
            if (typeof (otherActor as any).takeDamage === 'function') {
                // Calculate critical hit chance (10% chance)
                const isCritical = Math.random() < 0.1;
                const finalDamage = isCritical ? this.damage * 2 : this.damage;
                (otherActor as any).takeDamage(finalDamage, isCritical);
            }
            this.kill();
            return;
        }
        
        // Handle collision with solid objects (walls, trees, etc.)
        if (otherActor?.body?.collisionType === ex.CollisionType.Fixed) {
            console.log('Bullet hit solid object!');
            this.kill();
            return;
        }
    }

    getDamage(): number {
        return this.damage;
    }
}
