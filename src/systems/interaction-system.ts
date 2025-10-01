import * as ex from 'excalibur';
import { InteractableComponent } from '../components/interactable-component';

/**
 * System that handles player interactions with interactable entities
 */
export class InteractionSystem extends ex.System {
  public readonly systemType = ex.SystemType.Update;
  public priority = 50;

  private interactableQuery: ex.Query<typeof InteractableComponent | typeof ex.TransformComponent>;
  private scene?: ex.Scene;

  constructor(public world: ex.World) {
    super();
    this.interactableQuery = world.query([InteractableComponent, ex.TransformComponent]);
  }

  initialize(world: ex.World, scene: ex.Scene): void {
    this.scene = scene;
  }

  update(elapsed: number): void {
    if (!this.scene) return;

    // Find player by name (simple approach)
    const player = this.scene.actors.find((a: ex.Actor) => a.name === 'Player');
    if (!player) return;

    const engine = this.scene.engine;

    // Check each interactable entity
    for (const entity of this.interactableQuery.entities) {
      const interactable = entity.get(InteractableComponent)!;
      const transform = entity.get(ex.TransformComponent)!;

      // Calculate distance to player
      const distance = transform.pos.distance(player.pos);
      const wasNearby = interactable.playerNearby !== null;
      const isNearby = distance <= interactable.interactRadius;

      if (isNearby && !wasNearby) {
        // Player entered radius
        interactable.playerNearby = player;
        // Emit event on the entity (actors have .events property)
        if (entity instanceof ex.Actor) {
          entity.events.emit('player-nearby', { player });
        }
      } else if (!isNearby && wasNearby) {
        // Player left radius
        interactable.playerNearby = null;
        if (entity instanceof ex.Actor) {
          entity.events.emit('player-left', {});
        }
      }

      // Check for interaction input
      if (isNearby && engine.input.keyboard.wasPressed(interactable.interactKey)) {
        interactable.interact(player);
      }
    }
  }
}

