import * as ex from 'excalibur';
import { Resources } from './resources';

export class SpriteFactory {
  // Factory methods for creating sprites and animations
  
  static createPlayerIdleSprite(): ex.Sprite {
    // Create sprite from idle.png
    return Resources.IdleSprite.toSprite();
  }

  static createPlayerWalkSprite(): ex.Sprite {
    // Create sprite from walk.png  
    return Resources.WalkSprite.toSprite();
  }

  static createSimpleAnimation(
    width: number, 
    height: number, 
    color: ex.Color, 
    duration: number = 1000
  ): ex.Animation {
    // Create a simple pulsing animation
    const frame1 = new ex.Rectangle({ width, height, color });
    const frame2 = new ex.Rectangle({ 
      width: width * 1.2, 
      height: height * 1.2, 
      color: color.lighten(0.2) 
    });

    return new ex.Animation({
      frames: [
        { graphic: frame1, duration },
        { graphic: frame2, duration }
      ],
      strategy: ex.AnimationStrategy.Loop
    });
  }

  // Character animations
  static createPlayerIdleAnimation(): ex.Animation {
    // Create idle animation from idle.png sprite sheet (3 rows, 4 columns)
    // Middle row (row 1) = front idle
    const idleSpriteSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.IdleSprite,
      grid: {
        rows: 3,
        columns: 4,
        spriteWidth: 80,
        spriteHeight: 80
      }
    });
    
    // Create animation from only the middle row (4 frames for front idle)
    const frames = [];
    for (let col = 0; col < 4; col++) {
      const sprite = idleSpriteSheet.getSprite(col, 1);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 400 });
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop
    });
  }

  static createPlayerWalkAnimation(): ex.Animation {
    // Create walk animation from walk.png sprite sheet (640x240, 3 rows, 8 cols)
    // Top row (row 0) = sides (left/right movement)
    const walkSpriteSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.WalkSprite,
      grid: {
        rows: 3,
        columns: 8,
        spriteWidth: 80,
        spriteHeight: 80
      }
    });
    
    // Create animation from only the top row (8 frames for sides movement)
    const frames = [];
    for (let col = 0; col < 8; col++) {
      const sprite = walkSpriteSheet.getSprite(col, 0);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 120 });
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop
    });
  }

  static createPlayerSprintAnimation(): ex.Animation {
    // Create sprint animation from run.png sprite sheet (3 rows, 8 columns)
    // Top row (row 0) = sides (left/right sprint)
    const runSpriteSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.RunSprite,
      grid: {
        rows: 3,
        columns: 8,
        spriteWidth: 80,
        spriteHeight: 80
      }
    });
    
    // Create animation from only the top row (8 frames for sides sprint)
    const frames = [];
    for (let col = 0; col < 8; col++) {
      const sprite = runSpriteSheet.getSprite(col, 0);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 80 }); // Faster frames for sprint
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop
    });
  }

  // Future methods for loading actual spritesheets
  static async loadSpriteSheet(imagePath: string, frameWidth: number, frameHeight: number): Promise<ex.SpriteSheet> {
    const imageSource = new ex.ImageSource(imagePath);
    // This would load an actual spritesheet
    // For now, return a placeholder
    throw new Error('Sprite sheet loading not implemented yet');
  }
}
