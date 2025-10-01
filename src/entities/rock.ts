import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class Rock extends ex.Actor {
  constructor(x: number, y: number, rockType: number = 0) {
    super({
      pos: new ex.Vector(x, y),
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.PreventCollision, // No collision for rocks
    });
    
    // Store the rock type (0-1) for the sprite
    this.graphics.use(this.createRockSprite(rockType));
  }

  private createRockSprite(rockType: number): ex.Sprite {
    // Create sprite sheet from the outdoor decor image
    // The spritesheet has 7 columns and 12 rows
    // Rocks are in row 3 (index 2), columns 2 and 3
    const spriteSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.OutdoorDecorFree,
      grid: {
        rows: 12,
        columns: 7,
        spriteWidth: 16,
        spriteHeight: 16
      }
    });
    
    // Map rockType (0-1) to row and column
    // 0 -> row 2, col 1 (row 3, col 2 in 1-based)
    // 1 -> row 2, col 2 (row 3, col 3 in 1-based)
    const row = 2;
    const col = 1 + rockType;
    
    const sprite = spriteSheet.getSprite(col, row) as ex.Sprite;
    sprite.scale = ex.vec(2, 2); // Double the size for better visibility
    return sprite;
  }

  override onInitialize(): void {
    // Set z-index based on y-position for proper depth sorting
    this.z = this.pos.y;
  }
}

