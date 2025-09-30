import * as ex from 'excalibur';
import { Player } from '../player';
import { EnemyStateType, IEnemyState } from './states/enemy-state';
import { IdleState } from './states/idle-state';
import { ChaseState } from './states/chase-state';
import { AttackState } from './states/attack-state';
import { worldToGrid } from '../../lib/grid-utils';
import { findPath } from '../../lib/pathfinding';

export class Enemy extends ex.Actor {
  private player: Player | null = null;
  private moveSpeed = 100;
  private tileSize = 16;
  private currentPath: ex.Vector[] = [];
  private pathIndex = 0;
  
  // State Machine
  private currentState: IEnemyState;
  private states: Map<EnemyStateType, IEnemyState>;
  private currentStateType: EnemyStateType = EnemyStateType.Idle;
  
  // Graphics
  private bodyGraphic!: ex.Rectangle;
  
  // Public properties for state access
  public readonly detectionRange = 200;
  public readonly attackRange = 50;

  constructor(x: number, y: number) {
    super({
      name: 'Enemy',
      pos: new ex.Vector(x, y),
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.Active,
    });

    // Initialize states
    this.states = new Map([
      [EnemyStateType.Idle, new IdleState()],
      [EnemyStateType.Chase, new ChaseState()],
      [EnemyStateType.Attack, new AttackState()],
    ]);

    // Set initial state
    this.currentState = this.states.get(EnemyStateType.Idle)!;
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  getPlayer(): Player | null {
    return this.player;
  }

  changeState(newStateType: EnemyStateType): void {
    if (this.currentStateType === newStateType) return;

    this.currentState.exit(this);
    this.currentStateType = newStateType;
    this.currentState = this.states.get(newStateType)!;
    this.currentState.enter(this);
  }

  getCurrentStateType(): EnemyStateType {
    return this.currentStateType;
  }

  setColor(color: ex.Color): void {
    this.bodyGraphic.color = color;
  }

  resetPath(): void {
    this.currentPath = [];
    this.pathIndex = 0;
  }

  override onInitialize(): void {
    // Create a simple red square graphic
    this.bodyGraphic = new ex.Rectangle({
      width: this.width,
      height: this.height,
      color: ex.Color.Red,
    });
    
    this.graphics.add(this.bodyGraphic);
    
    // Enter initial state
    this.currentState.enter(this);
  }

  override onPreUpdate(engine: ex.Engine, delta: number): void {
    // Update current state
    this.currentState.update(this, engine, delta);
  }

  followPath(): void {
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      const target = this.currentPath[this.pathIndex];
      const direction = target.sub(this.pos).normalize();
      this.vel = direction.scale(this.moveSpeed);

      // Check if we've reached the current waypoint
      if (this.pos.distance(target) < 8) {
        this.pathIndex++;
      }
    } else {
      this.vel = ex.Vector.Zero;
    }
  }

  updatePath(engine: ex.Engine): void {
    if (!this.player) return;

    const startGrid = worldToGrid(this.pos, this.tileSize);
    const endGrid = worldToGrid(this.player.pos, this.tileSize);
    
    this.currentPath = findPath(startGrid, endGrid, engine, this.tileSize, this);
    this.pathIndex = 0;
  }

  override onPostUpdate(engine: ex.Engine, delta: number): void {
    // Draw path
    for (let i = 0; i < this.currentPath.length - 1; i++) {
      ex.Debug.drawLine(
        this.currentPath[i],
        this.currentPath[i + 1],
        { color: ex.Color.Green }
      );
    }
    
    // Draw current target
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      ex.Debug.drawLine(
        this.pos.add(ex.vec(this.width / 2, this.height / 2)),
        this.currentPath[this.pathIndex],
        { color: ex.Color.Yellow }
      );
    }
    
    // Draw line to player
    if (this.player) {
      ex.Debug.drawLine(
        this.pos.add(ex.vec(this.width / 2, this.height / 2)),
        this.player.pos.add(ex.vec(this.player.width / 2, this.player.height / 2)),
        { color: ex.Color.Blue }
      );
    }

    // Draw detection range
    ex.Debug.drawCircle(this.pos, this.detectionRange, { color: ex.Color.fromHex('#FF000033') });
    
    // Draw attack range
    ex.Debug.drawCircle(this.pos, this.attackRange, { color: ex.Color.fromHex('#FFFF0033') });
    
    // Draw current state
    ex.Debug.drawText(
      this.currentStateType,
      this.pos.add(ex.vec(-30, -30))
    );
  }
}

