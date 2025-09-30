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
    private currentWeaponSprite?: ex.Sprite;
    private hasWeapon = false;
    private gameUI?: GameUI;

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
        this.on('precollision', this.onPreCollision.bind(this));

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
        let targetAnimation;
        if (this.isMoving) {
            if (this.isSprinting) {
                targetAnimation = this.sprintAnimation;
            } else {
                targetAnimation = this.walkAnimation;
            }
        } else {
            targetAnimation = this.idleAnimation;
        }

        // Only update graphics if we need to change animation or add weapon
        if (this.hasWeapon) {
            this.updateGraphicsWithWeapon(targetAnimation);
        } else if (this.graphics.current !== targetAnimation) {
            this.graphics.use(targetAnimation);
        }

        // Apply horizontal flipping based on facing direction
        if (this.graphics.current) {
            this.graphics.current.flipHorizontal = this.isFacingRight;
        }

    }

    private updateGraphicsWithWeapon(animation: ex.Animation): void {
        if (!this.currentWeaponSprite) return;

        // Create a graphics group that combines the animation with the weapon
        const weaponGroup = new ex.GraphicsGroup({
            members: [
                { graphic: animation, offset: ex.vec(0, 0) },
                { graphic: this.currentWeaponSprite, offset: ex.vec(48, 72) } // Offset weapon relative to player
            ]
        });

        // Create a unique key for this animation + weapon combo
        const groupKey = `${animation.constructor.name}_with_weapon`;

        // Add or update the graphics group
        this.graphics.add(groupKey, weaponGroup);
        
        if (this.graphics.current !== weaponGroup) {
            this.graphics.use(groupKey);
        }
    }

    onPreCollision(event: ex.PreCollisionEvent): void {
        const otherActor = event.other.owner as ex.Actor;
        if (otherActor?.tags?.has('pickup')) {
            // Get weapon sprite from the weapon actor
            const weaponSprite = otherActor.graphics.current as ex.Sprite;
            if (weaponSprite) {
                this.currentWeaponSprite = weaponSprite.clone();
                console.log('Weapon picked up!', this.currentWeaponSprite);

                
                this.hasWeapon = true;
                
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

}
