import * as ex from 'excalibur';
import {SpriteFactory} from '../sprites/sprite-factory';
import {GameUI} from '../ui/game-ui';
import {Bullet} from './bullet';
import {Weapon} from './weapon';
import { playerGroup } from '../lib/collision-groups';

export class Player extends ex.Actor {
    private walkSpeed = 100; // pixels per second for walking
    private sprintSpeed = 200; // pixels per second for sprinting
    private isMoving = false;
    private isSprinting = false;
    private isFacingRight = true;
    private idleAnimation!: ex.Animation;
    private walkAnimation!: ex.Animation;
    private sprintAnimation!: ex.Animation;
    private gameUI?: GameUI;
    
    // Shooting mechanics
    private lastShotTime = 0;
    private currentAmmo = 0;
    private equippedWeapon?: Weapon;
    private weaponVisual?: ex.Actor;
    private isMousePressed = false;
    private mouseTargetPos?: ex.Vector;

    constructor() {
        super({
            name: 'Player',
            pos: new ex.Vector(400, 1104), // Aligned to 16px grid (1100->1104)
            width: 32,
            height: 32,
            collisionType: ex.CollisionType.Active, // Enable collision for the player
            collisionGroup: playerGroup,
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
        
        // Set up mouse input for shooting
        this.scene?.engine.input.pointers.primary.on('down', this.onPointerDown.bind(this));
        this.scene?.engine.input.pointers.primary.on('up', this.onPointerUp.bind(this));
        this.scene?.engine.input.pointers.primary.on('move', this.onPointerMove.bind(this));
    }

    override onPreUpdate(engine: ex.Engine, delta: number): void {
        // Update z-index based on y-position for proper depth sorting
        this.z = this.pos.y;
        
        // Reset velocity each frame
        this.vel = ex.vec(0, 0);
        this.isMoving = false;

        // Handle keyboard input
        const input = engine.input.keyboard;
        let moveX = 0;
        let moveY = 0;

        // Check for sprint (left shift)
        this.isSprinting = input.isHeld(ex.Keys.ShiftLeft);

        // Check for reload (R key)
        if (input.wasPressed(ex.Keys.KeyR) && this.equippedWeapon && this.currentAmmo < this.equippedWeapon.magazine_size) {
            this.reload();
        }

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

        // Update animation if needed
        if (this.graphics.current !== targetAnimation) {
            this.graphics.use(targetAnimation);
        }

        // Apply horizontal flipping based on facing direction
        this.graphics.flipHorizontal = this.isFacingRight;
        
        // Update weapon position and flip
        if (this.weaponVisual) {
            // Flip weapon to match character
            this.weaponVisual.graphics.flipHorizontal = this.isFacingRight;
            
            // Position weapon relative to player (switch sides when flipped)
            const offsetX = this.isFacingRight ? -8 : 8;
            this.weaponVisual.pos = ex.vec(offsetX, 6);
        }

        // Handle continuous shooting when mouse is held down
        if (this.isMousePressed && this.mouseTargetPos && this.equippedWeapon && this.currentAmmo > 0) {
            this.shoot(this.mouseTargetPos);
        }
    }

    onPreCollision(event: ex.PreCollisionEvent): void {
        const otherActor = event.other.owner as ex.Actor;
        if (otherActor?.tags?.has('pickup')) {
            // Check if it's a weapon and we don't already have one equipped
            if (otherActor instanceof Weapon && !this.equippedWeapon) {
                console.log('Weapon picked up!', otherActor);

                // Store reference to the weapon data
                this.equippedWeapon = otherActor;

                // Create a visual representation of the weapon
                this.weaponVisual = new ex.Actor({
                    width: 32,
                    height: 16,
                    pos: ex.vec(8, 0), // Offset relative to player center
                    collisionType: ex.CollisionType.PreventCollision,
                    anchor: ex.vec(0.5, 0.5)
                });
                
                // Clone the weapon sprite for the visual
                const weaponSprite = otherActor.graphics.current as ex.Sprite;
                if (weaponSprite) {
                    const clonedSprite = weaponSprite.clone();
                    this.weaponVisual.graphics.use(clonedSprite);
                }
                
                // Add weapon visual as child of player
                this.addChild(this.weaponVisual);
                
                // Remove the original weapon from scene
                otherActor.kill();
                
                // Initialize ammo
                this.currentAmmo = otherActor.magazine_size;
                
                // Update UI if available
                if (this.gameUI) {
                    this.gameUI.updateWeaponStatus(true);
                    this.gameUI.updateAmmoCount(this.currentAmmo, otherActor.magazine_size);
                }
            }
        }
    }

    setGameUI(gameUI: GameUI): void {
        this.gameUI = gameUI;
    }

    private onPointerDown(event: ex.PointerEvent): void {
        // Only start shooting if we have a weapon equipped and ammo
        if (this.equippedWeapon && this.currentAmmo > 0) {
            this.isMousePressed = true;
            this.mouseTargetPos = event.worldPos;
            console.log(`Mouse pressed - Screen: (${event.screenPos.x}, ${event.screenPos.y}), World: (${event.worldPos.x}, ${event.worldPos.y})`);
        }
    }

    private onPointerUp(event: ex.PointerEvent): void {
        this.isMousePressed = false;
        this.mouseTargetPos = undefined;
        console.log('Mouse released - stopped shooting');
    }

    private onPointerMove(event: ex.PointerEvent): void {
        // Update target position while mouse is pressed for continuous shooting
        if (this.isMousePressed) {
            this.mouseTargetPos = event.worldPos;
        }
    }

    private shoot(targetPos: ex.Vector): void {
        if (!this.equippedWeapon) return;

        const currentTime = Date.now();
        const timeSinceLastShot = currentTime - this.lastShotTime;
        const minTimeBetweenShots = 1000 / this.equippedWeapon.firerate; // Convert firerate to milliseconds

        // Check if enough time has passed since last shot
        if (timeSinceLastShot < minTimeBetweenShots) {
            return;
        }

        // Calculate direction from player center to mouse position
        const playerCenter = this.pos; // Player anchor is already centered (0.5, 0.5)
        let direction = targetPos.sub(playerCenter);
        
        // Don't shoot if direction is too small (clicking on player)
        if (direction.magnitude < 10) {
            return;
        }

        // Normalize the direction to ensure consistent bullet speed
        direction = direction.normalize();

        // Create bullet starting slightly away from player to avoid immediate collision
        const bulletStartPos = playerCenter.add(direction.scale(20)); // Start 20 pixels away from player
        const bullet = new Bullet(bulletStartPos, direction, this.equippedWeapon.damage);
        this.scene?.add(bullet);

        // Update shooting state
        this.lastShotTime = currentTime;
        this.currentAmmo--;

        // Update UI
        if (this.gameUI) {
            this.gameUI.updateAmmoCount(this.currentAmmo, this.equippedWeapon.magazine_size);
        }

        console.log(`Shot fired! Direction: (${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}), Ammo remaining: ${this.currentAmmo}/${this.equippedWeapon.magazine_size}`);
    }

    getCurrentAmmo(): number {
        return this.currentAmmo;
    }

    getMaxAmmo(): number {
        return this.equippedWeapon?.magazine_size || 0;
    }

    getWeaponDamage(): number {
        return this.equippedWeapon?.damage || 0;
    }

    getWeaponFirerate(): number {
        return this.equippedWeapon?.firerate || 0;
    }

    getEquippedWeapon(): Weapon | undefined {
        return this.equippedWeapon;
    }

    private reload(): void {
        if (!this.equippedWeapon) return;

        // Reload to full magazine
        this.currentAmmo = this.equippedWeapon.magazine_size;
        
        // Update UI
        if (this.gameUI) {
            this.gameUI.updateAmmoCount(this.currentAmmo, this.equippedWeapon.magazine_size);
        }
        
        console.log(`Reloaded! Ammo: ${this.currentAmmo}/${this.equippedWeapon.magazine_size}`);
    }

}
