import * as ex from 'excalibur';
import { Resources } from '../lib/resources';
import { WeaponStatsComponent, WeaponType } from '../components/weapon-stats-component';
import { InteractableComponent } from '../components/interactable-component';

export class Weapon extends ex.Actor {
  private pickupLabel!: ex.Label;

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
      50, // interact radius
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
    return this.get(WeaponStatsComponent)?.canShoot() || false;
  }

  shoot(): boolean {
    return this.get(WeaponStatsComponent)?.shoot() || false;
  }

  reload(): void {
    this.get(WeaponStatsComponent)?.reload();
  }

  override onInitialize(): void {
    // Get the sprite from the weapon stats component
    const weaponStats = this.get(WeaponStatsComponent)!;
    const gunSprite = weaponStats.spriteSource.toSprite();
    gunSprite.scale = ex.vec(0.5, 0.5); // Scale down to 50% of original size
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
    this.pickupLabel.graphics.visible = false; // Hidden by default
    this.addChild(this.pickupLabel);
    
    // Listen for interaction events from InteractionSystem
    this.on('player-nearby', (evt: any) => {
      const player = evt.player;
      const hasWeapon = player.getEquippedWeapon && player.getEquippedWeapon();
      if (hasWeapon) {
        this.pickupLabel.text = `Press [E] to swap for ${weaponStats.name}`;
      } else {
        this.pickupLabel.text = `Press [E] to pick up ${weaponStats.name}`;
      }
      this.pickupLabel.graphics.visible = true;
    });

    this.on('player-left', () => {
      this.pickupLabel.graphics.visible = false;
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
