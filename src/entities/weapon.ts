import * as ex from 'excalibur';
import { Resources } from '../lib/resources';
import { WeaponStatsComponent } from '../components/weapon-stats-component';
import { InteractableComponent } from '../components/interactable-component';

export class Weapon extends ex.Actor {
  private pickupLabel!: ex.Label;

  constructor(x: number, y: number, name: string = "Shotgun", damage: number = 25, firerate: number = 3, magazine_size: number = 30) {
    super({
      pos: new ex.Vector(x, y),
      width: 32,  // Smaller size to match sprite
      height: 16, // Smaller height to match sprite
      collisionType: ex.CollisionType.Passive, // Passive allows player to walk through while detecting collisions
      anchor: ex.vec(0.5, 0.5) // Center the actor
    });
    
    // Add weapon stats component
    this.addComponent(new WeaponStatsComponent(name, damage, firerate, magazine_size));
    this.addComponent(new InteractableComponent(
      ex.Keys.KeyE,
      50, // interact radius
      (interactor) => this.pickupWeapon(interactor)
    ));
    
    this.tags.add('pickup');
    console.log(`Weapon constructor: ${name} at (${x}, ${y}), damage: ${damage}, firerate: ${firerate}, magazine: ${magazine_size}`);
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
    const gunSprite = Resources.Shotgun.toSprite();
    this.graphics.add('gun', gunSprite);
    this.graphics.use('gun');

    // Adjust collider to match the actual sprite size (approximately 32x16)
    const weaponCollider = ex.Shape.Box(32, 16, ex.vec(0.5, 0.5));
    this.collider.set(weaponCollider);
    
    // Create pickup label floating above the weapon
    const weaponStats = this.get(WeaponStatsComponent)!;
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
