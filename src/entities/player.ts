import * as ex from 'excalibur';
import {SpriteFactory} from '../sprites/sprite-factory';
import {GameUI} from '../ui/game-ui';

export class Player extends ex.Actor {
    private walkSpeed = 100; // pixels per second for walking
    private sprintSpeed = 200; // pixels per second for sprinting
    private isMoving = false;
    private isSprinting = false;
    private isFacingRight = true;
    private idleAnimation!: ex.Animation;
    private walkAnimation!: ex.Animation;
    private sprintAnimation!: ex.Animation;
    private jumpAnimation!: ex.Animation;
    private weaponActor?: ex.Actor;
    private gameUI?: GameUI;
    private isDodgeRolling = false;
    private dodgeRollSpeed = 200; // pixels per second during dodge roll
    private dodgeRollDuration = 1200; // milliseconds - longer to see animation
    private dodgeRollCooldown = 2000; // milliseconds
    private lastDodgeRollTime = 0;
    private dodgeRollDirection = ex.vec(0, 0);
    
    // Jump properties
    private isJumping = false;

    constructor() {
        super({
            name: 'Player',
            pos: new ex.Vector(400, 1104), // Aligned to 16px grid (1100->1104)
            width: 32,
            height: 32,
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
        this.jumpAnimation = SpriteFactory.createPlayerJumpAnimation();
        this.on('precollision', this.onPreCollision.bind(this));

        // Start with idle animation
        this.graphics.use(this.idleAnimation);
    }

    override onPreUpdate(engine: ex.Engine, delta: number): void {
        // Update z-index based on y-position for proper depth sorting
        this.z = this.pos.y;

        // Handle keyboard input
        const input = engine.input.keyboard;
        const currentTime = Date.now();

        // Handle dodge roll input (spacebar)
        if (input.wasPressed(ex.Keys.Space) && !this.isDodgeRolling) {
            this.tryDodgeRoll(currentTime);
        }
        
        // Handle jump input (J key)
        if (input.wasPressed(ex.Keys.KeyJ)) {
            this.isJumping = !this.isJumping; // Toggle jump animation
            console.log('Jump toggled:', this.isJumping);
        }

        // Update dodge roll state
        if (this.isDodgeRolling) {
            if (currentTime - this.lastDodgeRollTime >= this.dodgeRollDuration) {
                this.isDodgeRolling = false;
            }
        }

        // Reset velocity each frame
        this.vel = ex.vec(0, 0);
        this.isMoving = false;

        // If dodge rolling, use dodge roll movement
        if (this.isDodgeRolling) {
            this.vel = this.dodgeRollDirection.scale(this.dodgeRollSpeed);
            this.isMoving = true;
            return; // Skip normal movement input during dodge roll
        }

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
        let targetAnimation;
        if (this.isDodgeRolling || this.isJumping) {
            // Use jump animation for dodge roll or explicit jump toggle
            targetAnimation = this.jumpAnimation;
        } else if (this.isMoving) {
            if (this.isSprinting) {
                targetAnimation = this.sprintAnimation;
            } else {
                targetAnimation = this.walkAnimation;
            }
        } else {
            targetAnimation = this.idleAnimation;
        }

        // Update animation if needed
        if (this.graphics.current !== targetAnimation) {
            this.graphics.use(targetAnimation);
        }

        // Apply horizontal flipping based on facing direction
        this.graphics.flipHorizontal = this.isFacingRight;

        // Update weapon flip and position
        if (this.weaponActor) {
            this.weaponActor.graphics.flipHorizontal = this.isFacingRight;
            // Adjust weapon position based on facing direction
            const offsetX = this.isFacingRight ? -8 : 8;
            this.weaponActor.pos = ex.vec(offsetX, 6);
        }

        // Update UI with dodge roll status
        if (this.gameUI) {
            const cooldownRemaining = Math.max(0, this.dodgeRollCooldown - (currentTime - this.lastDodgeRollTime));
            this.gameUI.updateDodgeStatus(this.isDodgeRolling, cooldownRemaining, this.isJumping);
        }
    }

    onPreCollision(event: ex.PreCollisionEvent): void {
        const otherActor = event.other.owner as ex.Actor;
        if (otherActor?.tags?.has('pickup')) {
            // Get weapon sprite from the weapon actor
            const weaponSprite = otherActor.graphics.current as ex.Sprite;
            if (weaponSprite) {
                console.log('Weapon picked up!', weaponSprite);

                // Create a child actor for the weapon
                this.weaponActor = new ex.Actor({
                    width: 32,
                    height: 16,
                    pos: ex.vec(20, 5), // Offset relative to player center
                    collisionType: ex.CollisionType.PreventCollision
                });

                // Clone and add the weapon sprite
                const clonedSprite = weaponSprite.clone();
                this.weaponActor.graphics.use(clonedSprite);

                // Add weapon as a child of the player
                this.addChild(this.weaponActor);
                
                // Update UI if available
                if (this.gameUI) {
                    this.gameUI.updateWeaponStatus(true);
                }
                
                // Remove pickup from scene
                otherActor.kill();
            }
        }
    }

    setGameUI(gameUI: GameUI): void {
        this.gameUI = gameUI;
    }

    private tryDodgeRoll(currentTime: number): void {
        // Check if dodge roll is on cooldown
        if (currentTime - this.lastDodgeRollTime < this.dodgeRollCooldown) {
            return; // Still on cooldown
        }

        // Determine dodge roll direction based on current input or facing direction
        const input = this.scene?.engine.input.keyboard;
        let dodgeX = 0;
        let dodgeY = 0;

        if (input) {
            // Check for movement input to determine dodge direction
            if (input.isHeld(ex.Keys.ArrowLeft) || input.isHeld(ex.Keys.KeyA)) {
                dodgeX = -1;
            }
            if (input.isHeld(ex.Keys.ArrowRight) || input.isHeld(ex.Keys.KeyD)) {
                dodgeX = 1;
            }
            if (input.isHeld(ex.Keys.ArrowUp) || input.isHeld(ex.Keys.KeyW)) {
                dodgeY = -1;
            }
            if (input.isHeld(ex.Keys.ArrowDown) || input.isHeld(ex.Keys.KeyS)) {
                dodgeY = 1;
            }
        }

        // If no input direction, dodge in the facing direction
        if (dodgeX === 0 && dodgeY === 0) {
            dodgeX = this.isFacingRight ? -1 : 1; // Dodge in facing direction
        }

        // Normalize the dodge direction
        this.dodgeRollDirection = ex.vec(dodgeX, dodgeY).normalize();

        // Start dodge roll
        this.isDodgeRolling = true;
        this.lastDodgeRollTime = currentTime;

        console.log(`Dodge roll started in direction: (${this.dodgeRollDirection.x.toFixed(2)}, ${this.dodgeRollDirection.y.toFixed(2)})`);
    }

}
