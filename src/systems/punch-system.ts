import * as ex from 'excalibur';
import { PunchComponent } from '../components/punch-component';
import { DamageNumberSystem } from './damage-number-system';
import { Resources } from '../lib/resources';

/**
 * System to handle punch combat mechanics
 */
export class PunchSystem extends ex.System {
  public readonly types = ['punch'] as const;
  public systemType = ex.SystemType.Update;

  constructor(public world: ex.World) {
    super();
  }

  update(elapsed: number): void {
    // This system will be called by the scene, but the actual punch logic
    // will be handled by the player's punch method
  }

  /**
   * Execute a punch attack from the given actor
   * @param puncher The actor performing the punch
   * @param direction The direction of the punch
   * @returns Array of entities that were hit
   */
  public executePunch(puncher: ex.Actor, direction: ex.Vector): ex.Actor[] {
    const punchComponent = puncher.get(PunchComponent);
    if (!punchComponent) {
      console.warn('Actor does not have PunchComponent');
      return [];
    }

    if (!punchComponent.canPunch()) {
      return [];
    }

    // Execute the punch (updates cooldown)
    if (!punchComponent.punch()) {
      return [];
    }

    // Calculate punch area position and bounds
    const punchPos = punchComponent.getPunchArea(puncher, direction);
    const punchSize = 32;
    const punchBounds = new ex.BoundingBox(
      punchPos.x - punchSize / 2,
      punchPos.y - punchSize / 2,
      punchPos.x + punchSize / 2,
      punchPos.y + punchSize / 2
    );

    // Find all enemies in the punch area (using same approach as bullet system)
    const scene = puncher.scene;
    if (!scene) {
      console.warn('Puncher is not in a scene');
      return [];
    }

    // Determine targets based on who's punching
    let targets: ex.Actor[];
    if (puncher.name === 'Enemy') {
      // Enemy punching - target the player
      targets = scene.actors.filter(actor => 
        actor.name === 'Player' && actor !== puncher
      );
    } else {
      // Player punching - target enemies
      targets = scene.actors.filter(actor => 
        actor.name === 'Enemy' && actor !== puncher
      );
    }

    const hitEntities: ex.Actor[] = [];
    for (const target of targets) {
      // Check if punch area collides with target using bounding box intersection
      const targetBounds = target.collider.bounds;
      
      if (punchBounds.intersect(targetBounds)) {
        hitEntities.push(target);
        
        // Apply damage (using same approach as bullet system)
        const targetAny = target as any;
        if (typeof targetAny.takeDamage === 'function') {
          const died = targetAny.takeDamage(punchComponent.damage);
          console.log(`Punch hit ${target.name} for ${punchComponent.damage} damage${died ? ' (killed)' : ''}`);
          
          // Only show damage numbers when player is punching (not when player receives damage)
          if (puncher.name === 'Player') {
            const damageNumberSystem = DamageNumberSystem.getInstance();
            if (damageNumberSystem) {
              damageNumberSystem.addDamage(target, punchComponent.damage, false);
            }
          }
        }
      }
    }

    return hitEntities;
  }

  /**
   * Create and show punch area visual with animation
   * @param puncher The actor performing the punch
   * @param direction The direction of the punch
   */
  public showPunchArea(puncher: ex.Actor, direction: ex.Vector): void {
    const punchComponent = puncher.get(PunchComponent);
    if (!punchComponent) return;

    // Create visual punch area as a child of the puncher so it follows movement
    const punchArea = new ex.Actor({
      pos: ex.vec(0, 0), // Relative to puncher
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.PreventCollision,
      anchor: ex.vec(0.5, 0.5)
    });

    // Position the punch area in the direction of the punch
    const normalizedDirection = direction.normalize();
    const punchOffset = normalizedDirection.scale(punchComponent.range);
    punchArea.pos = punchOffset;
    
    // Rotate the punch area to face the punch direction
    punchArea.rotation = Math.atan2(normalizedDirection.y, normalizedDirection.x);

    // Create punch animation from individual sprites
    const allSprites = [
      Resources.PunchSprite1.toSprite(),
      Resources.PunchSprite2.toSprite(),
      Resources.PunchSprite3.toSprite()
    ];

    const punchAnimation = new ex.Animation({
      frames: allSprites.map(sprite => ({ graphic: sprite, duration: 80 })),
      strategy: ex.AnimationStrategy.Freeze
    });
    
    punchArea.graphics.add('punch', punchAnimation);
    punchArea.graphics.use('punch');

    // Add as child of puncher so it follows movement
    puncher.addChild(punchArea);
    
    // Remove after animation completes (240ms = 3 frames * 80ms)
    setTimeout(() => {
      punchArea.kill();
    }, 240);
  }
}
