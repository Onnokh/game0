import * as ex from 'excalibur';
import { Resources } from '../lib/resources';
import { environmentGroup } from '../lib/collision-groups';

export class OakTree extends ex.Actor {
  constructor(x: number, y: number) {
    super({
      pos: new ex.Vector(x, y),
      width: 64,  // 2 tiles wide (2 * 32px)
      height: 80, // 5 tiles tall (5 * 16px)
      collisionType: ex.CollisionType.Fixed, // Tree is immovable
      collisionGroup: environmentGroup,
    });
  }

  override onInitialize(): void {
    // Create sprite from the oak tree image
    const oakTreeSprite = Resources.OakTree.toSprite();
    oakTreeSprite.scale = ex.vec(2, 2); // Double the size
    
    // Add the sprite to graphics
    this.graphics.add('oak-tree', oakTreeSprite);
    this.graphics.use('oak-tree');
    
    // Create a box collider for the bottom 32x32px of the tree
    const trunkCollider = ex.Shape.Box(64, 32, ex.vec(0.5,-0.5));
    this.collider.set(trunkCollider);
    
    // Set z-index based on y-position for proper depth sorting
    this.z = this.pos.y;
  }

}
