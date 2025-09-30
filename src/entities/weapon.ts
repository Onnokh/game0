import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class Weapon extends ex.Actor {
  // Weapon attributes
  public readonly name: string;
  public readonly damage: number;
  public readonly firerate: number; // bullets per second
  public readonly magazine_size: number;

  constructor(x: number, y: number, name: string = "Shotgun", damage: number = 25, firerate: number = 3, magazine_size: number = 30) {
    super({
      pos: new ex.Vector(x, y),
      width: 32,  // Smaller size to match sprite
      height: 16, // Smaller height to match sprite
      collisionType: ex.CollisionType.Fixed, // Need collision for pickup detection
      anchor: ex.vec(0.5, 0.5) // Center the actor
    });
    
    this.name = name;
    this.damage = damage;
    this.firerate = firerate;
    this.magazine_size = magazine_size;
    
    this.tags.add('pickup');
    console.log(`Weapon constructor: ${name} at (${x}, ${y}), damage: ${damage}, firerate: ${firerate}, magazine: ${magazine_size}`);
  }

  override onInitialize(): void {
    const gunSprite = Resources.Shotgun.toSprite();
    // Keep at native size - the sprite is already a good size
    
    this.graphics.add('gun', gunSprite);
    this.graphics.use('gun');

    // Adjust collider to match the actual sprite size (approximately 32x16)
    const weaponCollider = ex.Shape.Box(32, 16, ex.vec(0.5, 0.5));
    this.collider.set(weaponCollider);
    
    console.log(`Weapon initialized at: (${this.pos.x}, ${this.pos.y})`);
  }

}
