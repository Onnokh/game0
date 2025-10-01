import * as ex from 'excalibur';
import { Resources } from '../lib/resources';
import { WeaponType } from '../components/weapon-stats-component';
import { InteractableComponent } from '../components/interactable-component';

export class Ammo extends ex.Actor {
  private pickupLabel!: ex.Label;
  private ammoType: WeaponType;
  private ammoAmount: number;

  constructor(x: number, y: number, ammoType: WeaponType, ammoAmount: number = 30) {
    super({
      pos: new ex.Vector(x, y),
      width: 24,
      height: 24,
      collisionType: ex.CollisionType.Passive,
      anchor: ex.vec(0.5, 0.5)
    });
    
    this.ammoType = ammoType;
    this.ammoAmount = ammoAmount;
    
    this.addComponent(new InteractableComponent(
      ex.Keys.KeyE,
      25, // interact radius
      (interactor) => this.pickupAmmo(interactor)
    ));
    
    console.log(`Ammo pickup created: ${ammoAmount} ${ammoType} ammo at (${x}, ${y})`);
  }

  override onInitialize(): void {
    // Get the appropriate ammo sprite based on weapon type
    let ammoSprite: ex.ImageSource;
    switch (this.ammoType) {
      case WeaponType.AssaultRifle:
        ammoSprite = Resources.Ammo1; // Blue magazine with bullets
        break;
      case WeaponType.Shotgun:
        ammoSprite = Resources.Ammo2; // Golden shotgun shells
        break;
      case WeaponType.Pistol:
        ammoSprite = Resources.Ammo3; // Small blue box with bullets
        break;
      case WeaponType.SMG:
        ammoSprite = Resources.Ammo4; // Blue box with bullets
        break;
      default:
        ammoSprite = Resources.Ammo1; // Default to assault rifle ammo
    }

    // Create sprite from the ammo image
    const sprite = ammoSprite.toSprite();
    this.graphics.use(sprite);
    
    // Create pickup label floating above the ammo pickup
    this.pickupLabel = new ex.Label({
      text: `[E] ${this.ammoAmount}x ${this.ammoType} ammo`,
      pos: ex.vec(0, -30), // Position above the pickup
      font: Resources.DeterminationFont.toFont({
        size: 10,
        color: ex.Color.fromHex('#FFD700'), // Gold color
        textAlign: ex.TextAlign.Center,
      }),
      z: 1000 // High z-index to appear above other objects
    });
    this.pickupLabel.graphics.visible = false; // Hidden by default
    this.addChild(this.pickupLabel);
    
    // Listen for interaction events from InteractionSystem
    this.on('player-nearby', () => {
      this.pickupLabel.graphics.visible = true;
    });

    this.on('player-left', () => {
      this.pickupLabel.graphics.visible = false;
    });
    
    console.log(`Ammo pickup initialized at: (${this.pos.x}, ${this.pos.y})`);
  }

  private pickupAmmo(player: ex.Actor): void {
    const playerAny = player as any;
    
    // Check if player has the getAmmoComponent method
    if (typeof playerAny.getAmmoComponent === 'function') {
      const ammoComponent = playerAny.getAmmoComponent();
      const previousCount = ammoComponent.getAmmoCount(this.ammoType);
      const newCount = ammoComponent.addAmmo(this.ammoType, this.ammoAmount);
      
      console.log(`Picked up ${this.ammoAmount} ${this.ammoType} ammo! Total: ${previousCount} -> ${newCount}`);
      
      // Remove the pickup from the scene
      this.kill();
    }
  }

  getAmmoType(): WeaponType {
    return this.ammoType;
  }

  getAmmoAmount(): number {
    return this.ammoAmount;
  }
}
