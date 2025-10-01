import * as ex from 'excalibur';

/**
 * Component for unarmed punch combat state
 * Only handles punch properties and cooldown logic
 */
export class PunchComponent extends ex.Component {
  public damage: number;
  public range: number;
  public cooldown: number; // milliseconds between punches
  private lastPunchTime: number;

  constructor(damage: number = 10, range: number = 40, cooldown: number = 500) {
    super();
    this.damage = damage;
    this.range = range;
    this.cooldown = cooldown;
    this.lastPunchTime = 0;
  }

  /**
   * Check if the actor can punch (cooldown check)
   */
  canPunch(): boolean {
    const currentTime = Date.now();
    return currentTime - this.lastPunchTime >= this.cooldown;
  }

  /**
   * Execute punch cooldown (updates lastPunchTime)
   * @returns true if punch was executed, false if on cooldown
   */
  punch(): boolean {
    if (!this.canPunch()) {
      return false;
    }

    this.lastPunchTime = Date.now();
    return true;
  }

  /**
   * Calculate punch area position relative to owner
   * @param owner The actor performing the punch
   * @param direction The direction of the punch
   * @returns The world position of the punch area
   */
  getPunchArea(owner: ex.Actor, direction: ex.Vector): ex.Vector {
    const normalizedDirection = direction.normalize();
    const punchOffset = normalizedDirection.scale(this.range);
    return owner.pos.add(punchOffset);
  }
}
