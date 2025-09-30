import * as ex from 'excalibur';
import { Resources } from './resources';

export class OakTree extends ex.Actor {
  constructor(x: number, y: number) {
    super({
      pos: new ex.Vector(x, y),
      width: 64,  // 2 tiles wide (2 * 32px)
      height: 80, // 5 tiles tall (5 * 16px)
      collisionType: ex.CollisionType.Fixed, // Tree is immovable
    });
  }

  override onInitialize(): void {
    // Create sprite from the oak tree image
    const oakTreeSprite = Resources.OakTree.toSprite();
    
    // Add the sprite to graphics
    this.graphics.add('oak-tree', oakTreeSprite);
    this.graphics.use('oak-tree');
    
    // Set z-index to be above ground but below UI
    this.z = 1;
    
    // Create a box collider for the bottom 32x32px of the tree
    const trunkCollider = ex.Shape.Box(32, 16, ex.vec(0.5,-0.5));
    this.collider.set(trunkCollider);
  }

}
