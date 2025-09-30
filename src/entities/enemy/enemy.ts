import * as ex from 'excalibur';
import { Player } from '../player';
import { EnemyStateType, IEnemyState } from './states/enemy-state';
import { IdleState } from './states/idle-state';
import { ChaseState } from './states/chase-state';
import { AttackState } from './states/attack-state';
import { AIActor } from '../ai-actor';
import { SpriteFactory } from '../../sprites/sprite-factory';
import { DamageNumber } from '../damage-number';

export class Enemy extends AIActor {
  private player: Player | null = null;
  private moveSpeed = 100;
  private idleSpeed = 50;
  
  // Health
  private life = 100;
  private maxLife = 100;
  
  // State Machine
  private currentState: IEnemyState;
  private states: Map<EnemyStateType, IEnemyState>;
  private currentStateType: EnemyStateType = EnemyStateType.Idle;
  
  // Graphics
  private walkAnimation!: ex.Animation;
  private runAnimation!: ex.Animation;
  private currentAnimation!: ex.Animation;
  private healthBarCanvas!: ex.Canvas;
  
  // Public properties for state access
  public readonly detectionRange = 200;
  public readonly attackRange = 50;
  public readonly wanderRange = 150;
  
  // Wander behavior
  private spawnPosition: ex.Vector;
  private wanderTarget: ex.Vector | null = null;
  private wanderWaitTime = 0;

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

  setAnimation(isRunning: boolean): void {
    const targetAnimation = isRunning ? this.runAnimation : this.walkAnimation;
    if (this.currentAnimation !== targetAnimation) {
      // Update the graphics group with new animation
      const group = new ex.GraphicsGroup({
        members: [
          {
            graphic: targetAnimation,
            offset: ex.vec(0, 0)
          },
          {
            graphic: this.healthBarCanvas,
            offset: ex.vec(0, -20) // Position above sprite (negative Y = up)
          }
        ]
      });
      this.graphics.use(group);
      this.currentAnimation = targetAnimation;
    }
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
    // Create skeleton animations
    this.walkAnimation = SpriteFactory.createSkeletonWalkAnimation();
    this.runAnimation = SpriteFactory.createSkeletonRunAnimation();
    
    // Start with walk animation
    this.currentAnimation = this.walkAnimation;
    this.graphics.use(this.walkAnimation);
    
    // Create healthbar canvas
    this.healthBarCanvas = new ex.Canvas({
      width: 64,
      height: 8,
      draw: (ctx) => this.drawHealthBarToCanvas(ctx)
    });
    
    // Add healthbar graphic
    this.graphics.add(this.healthBarCanvas);
    
    // Create a graphics group to show both animation and healthbar
    const group = new ex.GraphicsGroup({
      members: [
        {
          graphic: this.walkAnimation,
          offset: ex.vec(0, 0)
        },
        {
          graphic: this.healthBarCanvas,
          offset: ex.vec(0, -20) // Position above sprite (negative Y = up)
        }
      ]
    });
    this.graphics.use(group);
    
    // Enter initial state
    this.currentState.enter(this);
  }

  override onPreUpdate(engine: ex.Engine, delta: number): void {
    // Update z-index based on y-position for proper depth sorting
    this.z = this.pos.y;
    
    // Update current state
    this.currentState.update(this, engine, delta);
    
    // Update sprite direction based on velocity
    this.updateSpriteDirection();
    
    // Flag healthbar for redraw
    this.healthBarCanvas.flagDirty();
  }

  private updateSpriteDirection(): void {
    // Flip sprite based on movement direction
    if (this.vel.x < -10) {
      // Moving left - flip sprite
      this.graphics.flipHorizontal = true;
    } else if (this.vel.x > 10) {
      // Moving right - normal sprite
      this.graphics.flipHorizontal = false;
    }
    
    // Update animation based on speed
    const speed = this.vel.magnitude;
    const isRunning = speed > this.idleSpeed * 1.2; // Switch to run animation when moving faster than idle speed
    this.setAnimation(isRunning);
  }

  getIdleSpeed(): number {
    return this.idleSpeed;
  }

  getMoveSpeed(): number {
    return this.moveSpeed;
  }

  getLife(): number {
    return this.life;
  }

  getMaxLife(): number {
    return this.maxLife;
  }

  takeDamage(damage: number, isCritical: boolean = false): void {
    this.life = Math.max(0, this.life - damage);
    
    // Create damage number above the enemy
    const damagePos = this.pos.add(ex.vec(0, -30)); // Position above the enemy
    const damageNumber = DamageNumber.createDamageNumber(damagePos, damage, isCritical);
    this.scene?.add(damageNumber);
    
    if (this.life <= 0) {
      this.kill();
    }
  }

  heal(amount: number): void {
    this.life = Math.min(this.maxLife, this.life + amount);
  }

  override onPostUpdate(engine: ex.Engine, delta: number): void {
    const currentPath = this.getPath();
    const pathIndex = this.getPathIndex();
    
    // Draw path
    for (let i = 0; i < currentPath.length - 1; i++) {
      ex.Debug.drawLine(
        currentPath[i],
        currentPath[i + 1],
        { color: ex.Color.Green }
      );
    }
    
    // Draw current target
    if (currentPath.length > 0 && pathIndex < currentPath.length) {
      ex.Debug.drawLine(
        this.pos.add(ex.vec(this.width / 2, this.height / 2)),
        currentPath[pathIndex],
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

  private drawHealthBarToCanvas(ctx: CanvasRenderingContext2D): void {
    const barWidth = 64;
    const barHeight = 8;
    
    // Clear canvas
    ctx.clearRect(0, 0, barWidth, barHeight);
    
    // Draw background (dark gray)
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, barWidth, barHeight);
    
    // Calculate health percentage and width
    const healthPercentage = this.life / this.maxLife;
    const healthWidth = barWidth * healthPercentage;
    
    // Color interpolation: red at low health, green at high health
    if (healthPercentage > 0.5) {
      ctx.fillStyle = '#00FF00'; // Green
    } else if (healthPercentage > 0.25) {
      ctx.fillStyle = '#FFFF00'; // Yellow
    } else {
      ctx.fillStyle = '#FF0000'; // Red
    }
    
    // Draw health bar
    if (healthWidth > 0) {
      ctx.fillRect(0, 0, healthWidth, barHeight);
    }
    
    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, barWidth, barHeight);
  }
}

