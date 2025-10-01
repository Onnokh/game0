import * as ex from 'excalibur';
import { Resources } from '../lib/resources';
import { WeaponStatsComponent, WeaponType } from '../components/weapon-stats-component';
import { InteractableComponent } from '../components/interactable-component';

export class Weapon extends ex.Actor {
  private pickupLabel!: ex.Label;
  private isLoading = false;
  private lastLoadTime = 0;
  private onAutoReloadStart?: () => void;;

  constructor(x: number, y: number, type: WeaponType) {
    super({
      pos: new ex.Vector(x, y),
      width: 32,  // Smaller size to match sprite
      height: 16, // Smaller height to match sprite
      collisionType: ex.CollisionType.Passive, // Passive allows player to walk through while detecting collisions
      anchor: ex.vec(0.5, 0.5) // Center the actor
    });
    
    // Add weapon stats component with type
    this.addComponent(new WeaponStatsComponent(type));
    this.addComponent(new InteractableComponent(
      ex.Keys.KeyE,
      25, // interact radius
      (interactor) => this.pickupWeapon(interactor)
    ));
    
    const stats = this.get(WeaponStatsComponent)!;
    console.log(`Weapon constructor: ${stats.name} (${type}) at (${x}, ${y}), damage: ${stats.damage}, firerate: ${stats.firerate}, magazine: ${stats.magazineSize}, bullets: ${stats.bulletCount}, spread: ${stats.spreadAngle}`);
  }

  // Getters for weapon stats (delegates to component)
  get weaponName(): string {
    return this.get(WeaponStatsComponent)?.name || 'Unknown';
  }

  get damage(): number {
    return this.get(WeaponStatsComponent)?.damage || 0;
  }

  get firerate(): number {
    return this.get(WeaponStatsComponent)?.firerate || 0;
  }

  get magazine_size(): number {
    return this.get(WeaponStatsComponent)?.magazineSize || 0;
  }

  get currentAmmo(): number {
    return this.get(WeaponStatsComponent)?.currentAmmo || 0;
  }

  // Weapon action methods (delegates to component)
  canShoot(): boolean {
    const weaponStats = this.get(WeaponStatsComponent);
    if (!weaponStats) return false;
    
    // Can't shoot if weapon is loading or has no ammo
    return !this.isLoading && weaponStats.canShoot();
  }

  shoot(): boolean {
    const weaponStats = this.get(WeaponStatsComponent);
    if (!weaponStats || this.isLoading) return false;
    
    const shot = weaponStats.shoot();
    
    // Always auto-reload when ammo hits 0
    if (shot && weaponStats.currentAmmo === 0 && !this.isLoading) {
      this.startLoading();
      // Notify player about auto-reload start
      if (this.onAutoReloadStart) {
        this.onAutoReloadStart();
      }
    }
    
    return shot;
  }

  reload(player?: ex.Actor): void {
    const weaponStats = this.get(WeaponStatsComponent);
    if (!weaponStats) return;

    // If we have a player reference, deduct ammo from player's reserves
    if (player) {
      const playerAny = player as any;
      if (typeof playerAny.getAmmoComponent === 'function') {
        const ammoComponent = playerAny.getAmmoComponent();
        const ammoNeeded = weaponStats.magazineSize - weaponStats.currentAmmo;
        const ammoRemoved = ammoComponent.removeAmmo(weaponStats.type, ammoNeeded, weaponStats.magazineSize);
        
        // Only reload if we have ammo to reload with
        if (ammoRemoved > 0) {
          weaponStats.currentAmmo += ammoRemoved;
          console.log(`Reloaded ${weaponStats.name}: ${weaponStats.currentAmmo}/${weaponStats.magazineSize} (${ammoRemoved} ammo used)`);
        } else {
          console.log(`Cannot reload ${weaponStats.name}: No ammo available`);
        }
      }
    } else {
      // Fallback to old behavior (infinite ammo) if no player provided
      weaponStats.reload();
    }
  }

  // Start weapon loading process
  startLoading(): boolean {
    if (this.isLoading) return false;
    
    this.isLoading = true;
    this.lastLoadTime = Date.now();
    console.log(`Starting weapon loading...`);
    return true;
  }

  // Check if loading is complete and finish if so
  checkLoadingComplete(player?: ex.Actor): boolean {
    if (!this.isLoading) return false;

    const weaponStats = this.get(WeaponStatsComponent);
    if (!weaponStats) return false;

    const timeElapsed = Date.now() - this.lastLoadTime;
    if (timeElapsed >= weaponStats.loadingDuration) {
      // Complete the reload with player reference for ammo deduction
      this.reload(player);
      this.isLoading = false;
      console.log(`Weapon loading complete! Ammo: ${this.currentAmmo}/${this.magazine_size}`);
      return true;
    }
    return false;
  }

  // Get loading progress (0-1)
  getLoadingProgress(): number {
    if (!this.isLoading) return 0;

    const weaponStats = this.get(WeaponStatsComponent);
    if (!weaponStats) return 0;

    const timeElapsed = Date.now() - this.lastLoadTime;
    return Math.max(0, Math.min(1, timeElapsed / weaponStats.loadingDuration));
  }

  // Check if currently loading
  get isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  // Set callback for when auto-reload starts
  setAutoReloadCallback(callback: () => void): void {
    this.onAutoReloadStart = callback;
  }

  override onInitialize(): void {
    // Get the sprite from the weapon stats component
    const weaponStats = this.get(WeaponStatsComponent)!;
    const gunSprite = weaponStats.spriteSource.toSprite();
    this.graphics.add('gun', gunSprite);
    this.graphics.use('gun');

    // Adjust collider to match the actual sprite size (approximately 32x16)
    const weaponCollider = ex.Shape.Box(32, 16, ex.vec(0.5, 0.5));
    this.collider.set(weaponCollider);
    
    // Create pickup label floating above the weapon
    this.pickupLabel = new ex.Label({
      text: `Press [E] to pick up ${weaponStats.name}`,
      pos: ex.vec(0, -30), // Position above the weapon
      font: Resources.DeterminationFont.toFont({
        size: 12,
        color: ex.Color.fromHex('#FFD700'), // Gold color
        textAlign: ex.TextAlign.Center,
      }),
      z: 1000 // High z-index to appear above other objects
    });
    this.pickupLabel.graphics.isVisible = false; // Hidden by default
    this.addChild(this.pickupLabel);
    
    // Listen for interaction events from InteractionSystem
    this.on('player-nearby', (evt: any) => {
      const player = evt.player;
      const hasWeapon = player.getEquippedWeapon && player.getEquippedWeapon();
      if (hasWeapon) {
        this.pickupLabel.text = `[E] to swap for ${weaponStats.name}`;
      } else {
        this.pickupLabel.text = `[E] ${weaponStats.name}`;
      }
      this.pickupLabel.graphics.isVisible = true;
    });

    this.on('player-left', () => {
      this.pickupLabel.graphics.isVisible = false;
    });
    
    console.log(`Weapon initialized at: (${this.pos.x}, ${this.pos.y})`);
  }

  private pickupWeapon(player: ex.Actor): void {
    const playerAny = player as any;
    
    // Check if player has the equipWeapon method
    if (typeof playerAny.equipWeapon === 'function') {
      playerAny.equipWeapon(this);
      const weaponStats = this.get(WeaponStatsComponent)!;
      console.log(`${weaponStats.name} picked up by player!`);
    }
  }
}
