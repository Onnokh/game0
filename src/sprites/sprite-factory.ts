import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

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

  static createPlayerJumpAnimation(): ex.Animation {
    // Create jump animation from jump.png sprite sheet (480x240 = 6x3 grid)
    const jumpSpriteSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.JumpSprite,
      grid: {
        rows: 3,
        columns: 6, // 480/80 = 6 columns
        spriteWidth: 80,
        spriteHeight: 80
      }
    });
    
    // Create animation from top row (sides jump)
    const frames = [];
    for (let col = 0; col < 6; col++) { // Use all 6 frames
      const sprite = jumpSpriteSheet.getSprite(col, 0);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 200 }); // Much slower to see the animation clearly
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop // Loop the jump animation
    });
  }

  // Enemy animations
  static createSkeletonWalkAnimation(): ex.Animation {
    // Create walk animation from Skeleton.png sprite sheet (10 rows, 6 columns)
    // Row 2 (index 1) = walking animation
    const skeletonSpriteSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.SkeletonSprite,
      grid: {
        rows: 10,
        columns: 6,
        spriteWidth: 32,
        spriteHeight: 32
      }
    });
    
    // Create animation from row 2 (6 frames for walking)
    const frames = [];
    for (let col = 0; col < 6; col++) {
      const sprite = skeletonSpriteSheet.getSprite(col, 1); // Row index 1 = Row 2
      sprite.scale = ex.vec(2, 2); // Scale up 2x like player sprites
      frames.push({ graphic: sprite, duration: 150 });
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop
    });
  }

  static createSkeletonRunAnimation(): ex.Animation {
    // Create run animation from Skeleton.png sprite sheet (10 rows, 6 columns)
    // Row 5 (index 4) = running animation
    const skeletonSpriteSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.SkeletonSprite,
      grid: {
        rows: 10,
        columns: 6,
        spriteWidth: 32,
        spriteHeight: 32
      }
    });
    
    // Create animation from row 5 (6 frames for running)
    const frames = [];
    for (let col = 0; col < 6; col++) {
      const sprite = skeletonSpriteSheet.getSprite(col, 4); // Row index 4 = Row 5
      sprite.scale = ex.vec(2, 2); // Scale up 2x like player sprites
      frames.push({ graphic: sprite, duration: 100 }); // Faster frames for running
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop
    });
  }
 
}
