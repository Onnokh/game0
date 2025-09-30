import * as ex from 'excalibur';
import { SpriteFactory } from './sprite-factory';

export class Player extends ex.Actor {
  private walkSpeed = 100; // pixels per second for walking
  private sprintSpeed = 200; // pixels per second for sprinting
  private isMoving = false;
  private isSprinting = false;
  private isFacingRight = true;
  private idleAnimation: ex.Animation;
  private walkAnimation: ex.Animation;
  private sprintAnimation: ex.Animation;

  constructor() {
    super({
      name: 'Player',
      pos: new ex.Vector(400, 1100), // Middle x (400), near bottom y (1100)
      width: 32,
      height: 32, // Doubled size: 80x80 -> 160x160
      collisionType: ex.CollisionType.Active, // Enable collision for the player
    });
  }

  override onInitialize(): void {
    // Initialize with no velocity
    this.vel = ex.vec(0, 0);
    
    // Create animations
    this.idleAnimation = SpriteFactory.createPlayerIdleAnimation();
    this.walkAnimation = SpriteFactory.createPlayerWalkAnimation();
    this.sprintAnimation = SpriteFactory.createPlayerSprintAnimation();
    
    // Start with idle animation
    this.graphics.use(this.idleAnimation);
  }

  override onPreUpdate(engine: ex.Engine, delta: number): void {
    // Reset velocity each frame
    this.vel = ex.vec(0, 0);
    this.isMoving = false;

    // Handle keyboard input
    const input = engine.input.keyboard;
    let moveX = 0;
    let moveY = 0;
    
    // Check for sprint (left shift)
    this.isSprinting = input.isHeld(ex.Keys.ShiftLeft);
    
    if (input.isHeld(ex.Keys.ArrowLeft) || input.isHeld(ex.Keys.KeyA)) {
      moveX = -1;
      this.isMoving = true;
      this.isFacingRight = true;
    }
    if (input.isHeld(ex.Keys.ArrowRight) || input.isHeld(ex.Keys.KeyD)) {
      moveX = 1;
      this.isMoving = true;
      this.isFacingRight = false;
    }
    if (input.isHeld(ex.Keys.ArrowUp) || input.isHeld(ex.Keys.KeyW)) {
      moveY = -1;
      this.isMoving = true;
    }
    if (input.isHeld(ex.Keys.ArrowDown) || input.isHeld(ex.Keys.KeyS)) {
      moveY = 1;
      this.isMoving = true;
    }

    // Normalize diagonal movement to maintain consistent speed
    if (moveX !== 0 || moveY !== 0) {
      const normalizedMovement = ex.vec(moveX, moveY).normalize();
      const currentSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;
      this.vel = normalizedMovement.scale(currentSpeed);
    }

    // Update animation based on movement state
    if (this.isMoving) {
      if (this.isSprinting && this.graphics.current !== this.sprintAnimation) {
        this.graphics.use(this.sprintAnimation);
      } else if (!this.isSprinting && this.graphics.current !== this.walkAnimation) {
        this.graphics.use(this.walkAnimation);
      }
    } else if (!this.isMoving && this.graphics.current !== this.idleAnimation) {
      this.graphics.use(this.idleAnimation);
    }

    // Apply horizontal flipping based on facing direction
    if (this.graphics.current) {
      this.graphics.current.flipHorizontal = this.isFacingRight;
    }

    // Keep player within grass area bounds (account for 16x16 collision box)
    const collisionHalfWidth = 8; // 16px collision box / 2
    const collisionHalfHeight = 8; // 16px collision box / 2
    
    if (this.pos.x < 32 + collisionHalfWidth) {
      this.pos.x = 32 + collisionHalfWidth;
    }
    if (this.pos.x > 800 - 32 - collisionHalfWidth) {
      this.pos.x = 800 - 32 - collisionHalfWidth;
    }
    if (this.pos.y < 32 + collisionHalfHeight) { // Top cliff tiles
      this.pos.y = 32 + collisionHalfHeight;
    }
    if (this.pos.y > 1200 - 32 - collisionHalfHeight) { // Bottom cliff tiles (map is 1200px high)
      this.pos.y = 1200 - 32 - collisionHalfHeight;
    }
  }
}
