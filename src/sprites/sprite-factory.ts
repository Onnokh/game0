import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class SpriteFactory {
  // Factory methods for creating sprites and animations
  
  static createPlayerIdleSprite(): ex.Sprite {
    // Create sprite from new animation sheet (row 0, col 0 = idle)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    const sprite = characterSheet.getSprite(0, 0);
    sprite.scale = ex.vec(2, 2); // Double the size
    return sprite;
  }

  static createPlayerWalkSprite(): ex.Sprite {
    // Create sprite from new animation sheet (row 1, col 0 = walk)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    const sprite = characterSheet.getSprite(0, 1);
    sprite.scale = ex.vec(2, 2); // Double the size
    return sprite;
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
    // Create idle animation from new animation sheet (row 0, cols 0-1 = idle)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    
    // Create animation from row 0, columns 0-1 (2 frames for idle)
    const frames = [];
    for (let col = 0; col < 2; col++) {
      const sprite = characterSheet.getSprite(col, 0);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 400 });
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop
    });
  }

  static createPlayerWalkAnimation(): ex.Animation {
    // Create walk animation from new animation sheet (row 1, cols 0-3 = walk)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    
    // Create animation from row 1, columns 0-3 (4 frames for walk)
    const frames = [];
    for (let col = 0; col < 4; col++) {
      const sprite = characterSheet.getSprite(col, 1);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 120 });
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop
    });
  }

  static createPlayerSprintAnimation(): ex.Animation {
    // Create sprint animation from new animation sheet (row 1, cols 4-7 = run)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    
    // Create animation from row 1, columns 4-7 (4 frames for run)
    const frames = [];
    for (let col = 4; col < 8; col++) {
      const sprite = characterSheet.getSprite(col, 1);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 80 }); // Faster frames for sprint
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop
    });
  }

  static createPlayerJumpAnimation(): ex.Animation {
    // Create jump animation from new animation sheet (row 3, cols 0-3 = jump)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    
    // Create animation from row 3, columns 0-3 (4 frames for jump)
    const frames = [];
    for (let col = 0; col < 4; col++) {
      const sprite = characterSheet.getSprite(col, 3);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 200 }); // Much slower to see the animation clearly
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Loop // Loop the jump animation
    });
  }

  static createPlayerDodgeRollAnimation(): ex.Animation {
    // Create dodge roll animation from new animation sheet (row 5, cols 0-1 = sit for dodge roll)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    
    // Create animation from row 5, columns 0-1 (2 frames for sit/dodge roll)
    const frames = [];
    const sprite1 = characterSheet.getSprite(0, 5);
    sprite1.scale = ex.vec(2, 2); // Double the size
    frames.push({ graphic: sprite1, duration: 80 }); // First frame: fast like running/walking
    
    const sprite2 = characterSheet.getSprite(1, 5);
    sprite2.scale = ex.vec(2, 2); // Double the size
    frames.push({ graphic: sprite2, duration: 370 }); // Second frame: longer duration (80 + 370 = 450ms total)
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.End // Play once and stop on last frame
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

  static createSkeletonDeathAnimation(): ex.Animation {
    // Create death animation from Skeleton.png sprite sheet (10 rows, 6 columns)
    // Row 7 (index 6) = death animation, 4 frames
    const skeletonSpriteSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.SkeletonSprite,
      grid: {
        rows: 10,
        columns: 6,
        spriteWidth: 32,
        spriteHeight: 32
      }
    });
    
    // Create animation from row 7 (4 frames for death)
    const frames = [];
    for (let col = 0; col < 4; col++) {
      const sprite = skeletonSpriteSheet.getSprite(col, 6); // Row index 6 = Row 7
      sprite.scale = ex.vec(2, 2); // Scale up 2x like other sprites
      frames.push({ graphic: sprite, duration: 250 });
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.End // Play once and stop on last frame
    });
  }

  // Additional animations from the new spritesheet
  static createPlayerKickAnimation(): ex.Animation {
    // Create kick animation from new animation sheet (row 0, cols 2-3 = kick)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    
    // Create animation from row 0, columns 2-3 (2 frames for kick)
    const frames = [];
    for (let col = 2; col < 4; col++) {
      const sprite = characterSheet.getSprite(col, 0);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 80 });
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Freeze // Play once and freeze on last frame
    });
  }

  static createPlayerAttackAnimation(): ex.Animation {
    // Create attack animation from new animation sheet (row 0, cols 4-5 = attack)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    
    // Create animation from row 0, columns 4-5 (2 frames for attack)
    const frames = [];
    for (let col = 4; col < 6; col++) {
      const sprite = characterSheet.getSprite(col, 0);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 150 });
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Freeze // Play once and freeze on last frame
    });
  }

  static createPlayerDamageAnimation(): ex.Animation {
    // Create damage animation from new animation sheet (row 0, cols 6-7 = damage)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    
    // Create animation from row 0, columns 6-7 (2 frames for damage)
    const frames = [];
    for (let col = 6; col < 8; col++) {
      const sprite = characterSheet.getSprite(col, 0);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 80 }); // 80ms per frame = 160ms total
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.Freeze
    });
  }

  static createPlayerDeathAnimation(): ex.Animation {
    // Create death animation from new animation sheet (row 4, cols 4-7 = die)
    const characterSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterAnimationSheet,
      grid: {
        rows: 6,
        columns: 8,
        spriteWidth: 24,
        spriteHeight: 24
      }
    });
    
    // Create animation from row 4, columns 4-7 (4 frames for death)
    const frames = [];
    for (let col = 4; col < 8; col++) {
      const sprite = characterSheet.getSprite(col, 4);
      sprite.scale = ex.vec(2, 2); // Double the size
      frames.push({ graphic: sprite, duration: 300 });
    }
    
    return new ex.Animation({
      frames: frames,
      strategy: ex.AnimationStrategy.End // Play once and stop on last frame
    });
  }
 
}
