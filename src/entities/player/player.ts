import * as ex from 'excalibur';
import {SpriteFactory} from '../../sprites/sprite-factory';
import {GameUI} from '../../ui/game-ui';
import {Bullet} from '../bullet';
import {Weapon} from '../weapon';
import { playerGroup } from '../../lib/collision-groups';
import { IPlayerState, PlayerStateType } from './states/player-state';
import { IdleState } from './states/idle-state';
import { MovingState } from './states/moving-state';
import { DodgeRollingState } from './states/dodge-rolling-state';

export class Player extends ex.Actor {
    private walkSpeed = 100; // pixels per second for walking
    private sprintSpeed = 150; // pixels per second for sprinting
    private isFacingRight = true;
    private isSprinting = false;
    private idleAnimation!: ex.Animation;
    private walkAnimation!: ex.Animation;
    private sprintAnimation!: ex.Animation;
    private jumpAnimation!: ex.Animation;
    private dodgeRollAnimation!: ex.Animation;
    private dodgeRollParticles!: ex.ParticleEmitter;
    private gameUI?: GameUI;
    
    // Shooting mechanics
    private lastShotTime = 0;
    private currentAmmo = 0;
    private equippedWeapon?: Weapon;
    private weaponVisual?: ex.Actor;
    private isMousePressed = false;
    private mouseTargetPos?: ex.Vector;
    
    // Dodge roll properties
    private isDodgeRolling = false;
    private dodgeRollSpeed = 300; // pixels per second during dodge roll
    private dodgeRollDuration = 450; // milliseconds - longer to see animation
    private dodgeRollCooldown = 1000; // milliseconds
    private lastDodgeRollTime = 0;
    private dodgeRollDirection = ex.vec(0, 0);
    private cooldownBarCanvas!: ex.Canvas;

    // Jump properties
    private isJumping = false;

    // State Machine
    private currentState: IPlayerState;
    private states: Map<PlayerStateType, IPlayerState>;
    private currentStateType: PlayerStateType = PlayerStateType.Idle;

    constructor() {
        super({
            name: 'Player',
            pos: new ex.Vector(400, 1104), // Aligned to 16px grid (1100->1104)
            width: 32,
            height: 32,
            collisionType: ex.CollisionType.Active, // Enable collision for the player
            collisionGroup: playerGroup,
        });

        // Initialize states
        this.states = new Map<PlayerStateType, IPlayerState>();
        this.states.set(PlayerStateType.Idle, new IdleState());
        this.states.set(PlayerStateType.Moving, new MovingState());
        this.states.set(PlayerStateType.DodgeRolling, new DodgeRollingState());

        // Set initial state
        this.currentState = this.states.get(PlayerStateType.Idle)!;
    }

    override onInitialize(): void {
        // Initialize with no velocity
        this.vel = ex.vec(0, 0);

        // Create animations
        this.idleAnimation = SpriteFactory.createPlayerIdleAnimation();
        this.walkAnimation = SpriteFactory.createPlayerWalkAnimation();
        this.sprintAnimation = SpriteFactory.createPlayerSprintAnimation();
        this.jumpAnimation = SpriteFactory.createPlayerJumpAnimation();
        this.dodgeRollAnimation = SpriteFactory.createPlayerDodgeRollAnimation();
        
        // Create dodge roll particle emitter
        this.dodgeRollParticles = new ex.ParticleEmitter({
            pos: ex.vec(0, 0),
            emitterType: ex.EmitterType.Circle,
            radius: 5,
            isEmitting: false,
            emitRate: 100, // particles per second
            particle: {
                life: 400, // milliseconds
                opacity: 0.6,
                fade: true,
                minSize: 2,
                maxSize: 6,
                startSize: 6,
                endSize: 1,
                minSpeed: 10,
                maxSpeed: 30,
                minAngle: 0, // Will be set dynamically based on dodge direction
                maxAngle: 0, // Will be set dynamically based on dodge direction
                beginColor: ex.Color.fromHex('#F5DEB3'), // Light wheat/tan
                endColor: ex.Color.fromHex('#D4A574'), // Light dusty brown
                acc: ex.vec(0, 20) // Slight downward acceleration
            }
        });
        this.addChild(this.dodgeRollParticles);
        
        this.on('precollision', this.onPreCollision.bind(this));

        // Start with idle animation
        this.graphics.use(this.idleAnimation);
        
        // Create cooldown bar canvas
        this.cooldownBarCanvas = new ex.Canvas({
            width: 34, // 32px bar + 2px for border
            height: 6,  // 4px bar + 2px for border
            cache: true,
            draw: (ctx) => this.drawCooldownBarToCanvas(ctx)
        });
        
        // Set up cooldown indicator drawing
        this.graphics.onPostDraw = this.drawCooldownIndicator.bind(this);
        
        // Set up mouse input for shooting
        this.scene?.engine.input.pointers.primary.on('down', this.onPointerDown.bind(this));
        this.scene?.engine.input.pointers.primary.on('up', this.onPointerUp.bind(this));
        this.scene?.engine.input.pointers.primary.on('move', this.onPointerMove.bind(this));

        // Enter initial state
        this.currentState.enter(this);
    }

    override onPreUpdate(engine: ex.Engine, delta: number): void {
        // Update z-index based on y-position for proper depth sorting
        this.z = this.pos.y;

        const currentTime = Date.now();
        const input = engine.input.keyboard;

        // Handle jump input (J key)
        if (input.wasPressed(ex.Keys.KeyJ)) {
            this.isJumping = !this.isJumping; // Toggle jump animation
            console.log('Jump toggled:', this.isJumping);
        }

        // Handle reload (R key)
        if (input.wasPressed(ex.Keys.KeyR) && this.equippedWeapon && this.currentAmmo < this.equippedWeapon.magazine_size) {
            this.reload();
        }

        // Update current state
        this.currentState.update(this, engine, delta);
        
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
        
        // Flag cooldown bar for redraw if cooldown is active but dodge roll is finished
        const cooldownRemaining = Math.max(0, this.dodgeRollCooldown - (currentTime - this.lastDodgeRollTime));
        if (cooldownRemaining > 0 && !this.isDodgeRolling) {
            this.cooldownBarCanvas.flagDirty();
        }
    }

    // State Machine Methods
    changeState(newStateType: PlayerStateType): void {
        if (this.currentStateType === newStateType) return;

        this.currentState.exit(this);
        this.currentStateType = newStateType;
        this.currentState = this.states.get(newStateType)!;
        this.currentState.enter(this);
    }

    getCurrentStateType(): PlayerStateType {
        return this.currentStateType;
    }

    // Public methods for states to access

    setAnimation(animationName: string): void {
        let targetAnimation;
        switch (animationName) {
            case 'idle':
                targetAnimation = this.idleAnimation;
                break;
            case 'walk':
                targetAnimation = this.walkAnimation;
                break;
            case 'sprint':
                targetAnimation = this.sprintAnimation;
                break;
            case 'jump':
                targetAnimation = this.jumpAnimation;
                break;
            case 'dodgeroll':
                targetAnimation = this.dodgeRollAnimation;
                break;
            default:
                return;
        }

        if (this.graphics.current !== targetAnimation) {
            this.graphics.use(targetAnimation);
        }
    }

    setFacingRight(facingRight: boolean): void {
        this.isFacingRight = facingRight;
    }

    setSprinting(sprinting: boolean): void {
        this.isSprinting = sprinting;
    }

    getWalkSpeed(): number {
        return this.walkSpeed;
    }

    getSprintSpeed(): number {
        return this.sprintSpeed;
    }

    tryDodgeRoll(): boolean {
        const currentTime = Date.now();
        
        // Check if dodge roll is on cooldown
        if (currentTime - this.lastDodgeRollTime < this.dodgeRollCooldown) {
            return false; // Still on cooldown
        }

        // Dodge roll is available
        this.isDodgeRolling = true;
        this.lastDodgeRollTime = currentTime;
        return true;
    }

    setIsDodgeRolling(isDodgeRolling: boolean): void {
        this.isDodgeRolling = isDodgeRolling;
    }

    setDodgeDirection(direction: ex.Vector): void {
        this.dodgeRollDirection = direction;
    }

    getDodgeDirection(): ex.Vector {
        return this.dodgeRollDirection;
    }

    getDodgeRollSpeed(): number {
        return this.dodgeRollSpeed;
    }

    getDodgeRollDuration(): number {
        return this.dodgeRollDuration;
    }

    getLastDodgeRollTime(): number {
        return this.lastDodgeRollTime;
    }

    getDodgeRollAnimation(): ex.Animation {
        return this.dodgeRollAnimation;
    }

    getDodgeRollParticles(): ex.ParticleEmitter {
        return this.dodgeRollParticles;
    }

    // Collision handling
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
                    this.gameUI.updateWeaponStatus(true, otherActor.name);
                    this.gameUI.updateAmmoCount(this.currentAmmo, otherActor.magazine_size);
                }
            }
        }
    }

    setGameUI(gameUI: GameUI): void {
        this.gameUI = gameUI;
    }

    // Shooting methods
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

    // Cooldown bar drawing
    private drawCooldownIndicator(ctx: ex.ExcaliburGraphicsContext): void {
        const currentTime = Date.now();
        const cooldownRemaining = Math.max(0, this.dodgeRollCooldown - (currentTime - this.lastDodgeRollTime));
        
        // Only draw if there's a cooldown active AND the dodge roll is finished
        if (cooldownRemaining <= 0 || this.isDodgeRolling) return;
        
        // Draw the canvas below the player using the graphic's draw method
        ctx.save();
        ctx.translate(0, 20); // Position below player
        this.cooldownBarCanvas.draw(ctx, -17, 0); // Draw centered
        ctx.restore();
    }

    private drawCooldownBarToCanvas(ctx: CanvasRenderingContext2D): void {
        // Calculate progress from when dodge finishes to when cooldown ends
        // Dodge duration: 0-1200ms (not shown)
        // Cooldown shown: 1200-2000ms (800ms window)
        const cooldownAfterDodge = this.dodgeRollCooldown - this.dodgeRollDuration; // 800ms
        const progressStart = this.dodgeRollDuration; // 1200ms
        const timeElapsed = Date.now() - this.lastDodgeRollTime;
        const cooldownProgress = Math.max(0, Math.min(1, (timeElapsed - progressStart) / cooldownAfterDodge));
        
        const barWidth = 32;
        const barHeight = 4;
        
        // Clear canvas
        ctx.clearRect(0, 0, 34, 6);
        
        // Draw background (dark gray)
        ctx.fillStyle = '#333333';
        ctx.fillRect(1, 1, barWidth, barHeight);
        
        // Calculate filled width (fills as cooldown progresses)
        const filledWidth = barWidth * cooldownProgress;
        
        // Light blue progress bar
        ctx.fillStyle = '#64C8FF';
        
        // Draw progress bar
        if (filledWidth > 0) {
            ctx.fillRect(1, 1, filledWidth, barHeight);
        }
        
        // Draw border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, barWidth, barHeight);
    }
}


