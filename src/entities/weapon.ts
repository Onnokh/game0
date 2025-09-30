import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class Weapon extends ex.Actor {
  constructor(x: number, y: number) {
    super({
      pos: new ex.Vector(x, y),
      width: 32,  // Smaller size to match sprite
      height: 16, // Smaller height to match sprite
      collisionType: ex.CollisionType.Fixed, // Weapon is immovable
      anchor: ex.vec(0.5, 0.5) // Center the actor
    });
    this.tags.add('pickup');
    console.log(`Weapon constructor: position set to (${x}, ${y})`);
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
