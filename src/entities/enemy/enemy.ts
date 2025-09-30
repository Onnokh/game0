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
  private idleSpeed = 50;
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
  public readonly wanderRange = 150;
  
  // Wander behavior
  private spawnPosition: ex.Vector;
  private wanderTarget: ex.Vector | null = null;
  private wanderWaitTime = 0;
  
  // Rotation
  private rotationSpeed = 5; // radians per second

  constructor(x: number, y: number) {
    super({
      name: 'Enemy',
      pos: new ex.Vector(x, y),
      width: 32,
      height: 32,
      collisionType: ex.CollisionType.Active,
    });

    // Store spawn position for wander range
    this.spawnPosition = new ex.Vector(x, y);

    // Initialize states
    this.states = new Map<EnemyStateType, IEnemyState>();
    this.states.set(EnemyStateType.Idle, new IdleState());
    this.states.set(EnemyStateType.Chase, new ChaseState());
    this.states.set(EnemyStateType.Attack, new AttackState());

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

  getSpawnPosition(): ex.Vector {
    return this.spawnPosition;
  }

  setWanderTarget(target: ex.Vector | null): void {
    this.wanderTarget = target;
  }

  getWanderTarget(): ex.Vector | null {
    return this.wanderTarget;
  }

  setWanderWaitTime(time: number): void {
    this.wanderWaitTime = time;
  }

  updateWanderWaitTime(delta: number): void {
    this.wanderWaitTime -= delta;
  }

  getWanderWaitTime(): number {
    return this.wanderWaitTime;
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
    
    // Auto-rotate towards movement direction or target
    this.updateRotation(delta);
  }

  private updateRotation(delta: number): void {
    let targetRotation: number | null = null;
    
    // If moving, rotate towards velocity direction
    if (this.vel.magnitude > 0) {
      const direction = this.vel.normalize();
      targetRotation = Math.atan2(direction.y, direction.x);
    }
    // If stationary but has a player target (attacking), face the player
    else if (this.player) {
      const distance = this.pos.distance(this.player.pos);
      if (distance < this.attackRange * 1.5) {
        const direction = this.player.pos.sub(this.pos).normalize();
        targetRotation = Math.atan2(direction.y, direction.x);
      }
    }
    
    // Lerp rotation towards target
    if (targetRotation !== null) {
      this.rotation = this.lerpAngle(this.rotation, targetRotation, this.rotationSpeed * (delta / 1000));
    }
  }

  private lerpAngle(from: number, to: number, t: number): number {
    // Normalize angles to -π to π range
    const normalizeAngle = (angle: number) => {
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;
      return angle;
    };
    
    from = normalizeAngle(from);
    to = normalizeAngle(to);
    
    // Find the shortest rotation direction
    let diff = to - from;
    if (diff > Math.PI) {
      diff -= Math.PI * 2;
    } else if (diff < -Math.PI) {
      diff += Math.PI * 2;
    }
    
    // Clamp t to prevent overshooting
    const clampedT = Math.min(t, 1);
    
    return normalizeAngle(from + diff * clampedT);
  }

  followPath(speed?: number): void {
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      const target = this.currentPath[this.pathIndex];
      const direction = target.sub(this.pos).normalize();
      const actualSpeed = speed ?? this.moveSpeed;
      this.vel = direction.scale(actualSpeed);

      // Check if we've reached the current waypoint
      if (this.pos.distance(target) < 8) {
        this.pathIndex++;
      }
    } else {
      this.vel = ex.Vector.Zero;
    }
  }

  getIdleSpeed(): number {
    return this.idleSpeed;
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

    // Draw wander range (centered on spawn position)
    ex.Debug.drawCircle(this.spawnPosition, this.wanderRange, { color: ex.Color.fromHex('#0000FF22') });
    
    // Draw detection range
    ex.Debug.drawCircle(this.pos, this.detectionRange, { color: ex.Color.fromHex('#FF000033') });
    
    // Draw attack range
    ex.Debug.drawCircle(this.pos, this.attackRange, { color: ex.Color.fromHex('#FFFF0033') });
    
    // Draw wander target if any
    if (this.wanderTarget) {
      ex.Debug.drawCircle(this.wanderTarget, 8, { color: ex.Color.Cyan });
    }
    
    // Draw current state
    ex.Debug.drawText(
      this.currentStateType,
      this.pos.add(ex.vec(-30, -30))
    );
  }
}

