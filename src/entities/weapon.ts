import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class Weapon extends ex.Actor {
  // Weapon attributes
  public readonly name: string;
  public readonly damage: number;
  public readonly firerate: number; // bullets per second
  public readonly magazine_size: number;
  
  private pickupLabel!: ex.Label;
  private playerNearby: ex.Actor | null = null;

  constructor(x: number, y: number, name: string = "Shotgun", damage: number = 25, firerate: number = 3, magazine_size: number = 30) {
    super({
      pos: new ex.Vector(x, y),
      width: 32,  // Smaller size to match sprite
      height: 16, // Smaller height to match sprite
      collisionType: ex.CollisionType.Passive, // Passive allows player to walk through while detecting collisions
      anchor: ex.vec(0.5, 0.5) // Center the actor
    });
    
    this.name = name;
    this.damage = damage;
    this.firerate = firerate;
    this.magazine_size = magazine_size;
    
    this.tags.add('pickup');
    console.log(`Weapon constructor: ${name} at (${x}, ${y}), damage: ${damage}, firerate: ${firerate}, magazine: ${magazine_size}`);
  }

  override onInitialize(): void {
    const gunSprite = Resources.Shotgun.toSprite();
    // Keep at native size - the sprite is already a good size
    
    this.graphics.add('gun', gunSprite);
    this.graphics.use('gun');

    // Adjust collider to match the actual sprite size (approximately 32x16)
    const weaponCollider = ex.Shape.Box(32, 16, ex.vec(0.5, 0.5));
    this.collider.set(weaponCollider);
    
    // Create pickup label floating above the weapon (with dynamic weapon name)
    this.pickupLabel = new ex.Label({
      text: `Press [E] to pick up ${this.name}`,
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
    
    // Listen for collisions
    this.on('precollision', this.handleCollision.bind(this));
    this.on('collisionend', this.handleCollisionEnd.bind(this));
    
    console.log(`Weapon initialized at: (${this.pos.x}, ${this.pos.y})`);
  }

  override onPreUpdate(engine: ex.Engine, delta: number): void {
    // Check if player is nearby and E key is pressed
    if (this.playerNearby && engine.input.keyboard.wasPressed(ex.Keys.KeyE)) {
      this.pickupWeapon();
    }

    // Defensive check: ensure label visibility matches playerNearby state
    if (this.pickupLabel) {
      const shouldBeVisible = this.playerNearby !== null;
      if (this.pickupLabel.graphics.visible !== shouldBeVisible) {
        this.pickupLabel.graphics.visible = shouldBeVisible;
      }
    }
  }

  private handleCollision(event: ex.PreCollisionEvent): void {
    const otherActor = event.other.owner as ex.Actor;
    
    // Check if it's the player
    if (otherActor?.name === 'Player') {
      const player = otherActor as any;
      this.playerNearby = otherActor;
      
      // Update label text based on whether player has a weapon
      const hasWeapon = player.getEquippedWeapon && player.getEquippedWeapon();
      if (hasWeapon) {
        this.pickupLabel.text = `Press [E] to swap for ${this.name}`;
      } else {
        this.pickupLabel.text = `Press [E] to pick up ${this.name}`;
      }
      
      this.pickupLabel.graphics.visible = true;
      console.log('Player near weapon! Press E to', hasWeapon ? 'swap' : 'pick up');
    }
  }

  private handleCollisionEnd(event: ex.CollisionEndEvent): void {
    const otherActor = event.other.owner as ex.Actor;
    
    // Check if player left the area
    if (otherActor === this.playerNearby) {
      this.playerNearby = null;
      this.pickupLabel.graphics.visible = false;
      console.log('Player left weapon area');
    }
  }

  private pickupWeapon(): void {
    if (!this.playerNearby) return;
    
    const player = this.playerNearby as any;
    
    // Check if player has the equipWeapon method
    if (typeof player.equipWeapon === 'function') {
      player.equipWeapon(this);
      console.log(`${this.name} picked up by player!`);
    }
  }

}
