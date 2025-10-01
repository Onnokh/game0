import * as ex from 'excalibur';

/**
 * Component for entities that can be interacted with
 */
export class InteractableComponent extends ex.Component {
  public playerNearby: ex.Actor | null = null;

  constructor(
    public interactKey: ex.Keys = ex.Keys.KeyE,
    public interactRadius: number = 50,
    public onInteract?: (interactor: ex.Actor) => void
  ) {
    super();
  }

  isPlayerNearby(): boolean {
    return this.playerNearby !== null;
  }

  interact(interactor: ex.Actor): void {
    if (this.onInteract) {
      this.onInteract(interactor);
    }
  }
}

