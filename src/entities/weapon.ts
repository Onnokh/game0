import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class Weapon extends ex.Actor {
  constructor(x: number, y: number) {
    super({
      pos: new ex.Vector(x, y),
      width: 64,  // 2 tiles wide (2 * 32px)
      height: 32, // 1 tile tall (1 * 32px)
      collisionType: ex.CollisionType.Fixed, // Weapon is immovable
      anchor: ex.vec(0.5, 0.5) // Center the actor
    });
    this.tags.add('pickup');
    console.log(`Weapon constructor: position set to (${x}, ${y})`);
  }

  override onInitialize(): void {
    const gunSprite = Resources.Weapon.toSprite();

    gunSprite.width = 64;
    gunSprite.height = 32;
    // Use default anchor (top-left) to see if that fixes positioning
    // gunSprite.anchor = ex.vec(0.5, 0.5);
    
    // Create a background rectangle
    
    // Create a graphics group with background and weapon
    const weaponGroup = new ex.GraphicsGroup({
      members: [
        { graphic: gunSprite, offset: ex.vec(0, 0) }
      ]
    });
    
    this.graphics.add('gun', weaponGroup);
    this.graphics.use('gun');

    // Make collider match the visual size and center it
    const weaponCollider = ex.Shape.Box(64, 32, ex.vec(0.5, 0.5));
    this.collider.set(weaponCollider);
    
    console.log(`Weapon initialized at: (${this.pos.x}, ${this.pos.y})`);
  }

}
