import * as ex from 'excalibur';
import { BulletModifierType, MODIFIER_CONFIGS } from '../components/bullet-modifier-component';
import { InteractableComponent } from '../components/interactable-component';

export class ModifierBox extends ex.Actor {
    private modifierType: BulletModifierType;
    private glowEffect!: ex.Actor;
    private particleEmitter!: ex.ParticleEmitter;
    private pulseTimer: number = 0;

    constructor(position: ex.Vector, modifierType?: BulletModifierType) {
        // Use random modifier if none specified
        const modifiers = Object.values(BulletModifierType);
        const randomModifier = modifierType || modifiers[Math.floor(Math.random() * modifiers.length)];

        super({
            name: 'ModifierBox',
            pos: position,
            width: 32,
            height: 32,
            collisionType: ex.CollisionType.Passive,
            anchor: ex.vec(0.5, 0.5)
        });

        this.modifierType = randomModifier;
        this.z = 500; // Above ground but below bullets

        // Add interactable component
        this.addComponent(new InteractableComponent());
    }

    override onInitialize(): void {
        this.createVisual();
        this.createGlowEffect();
        this.createParticleEffect();
        this.setupInteraction();
    }

    private createVisual(): void {
        const boxCanvas = new ex.Canvas({
            width: 32,
            height: 32,
            draw: (ctx: CanvasRenderingContext2D) => {
                // Get colors based on modifier type
                const colors = this.getModifierColors();
                
                // Add glow effect
                ctx.shadowColor = colors.glow;
                ctx.shadowBlur = 8;
                
                // Draw main box
                ctx.fillStyle = colors.primary;
                ctx.fillRect(4, 4, 24, 24);
                
                // Draw border
                ctx.strokeStyle = colors.border;
                ctx.lineWidth = 2;
                ctx.strokeRect(4, 4, 24, 24);
                
                // Draw modifier symbol
                this.drawModifierSymbol(ctx, colors.symbol);
                
                // Reset shadow
                ctx.shadowBlur = 0;
            }
        });

        this.graphics.use(boxCanvas);
    }

    private getModifierColors(): { primary: string; border: string; glow: string; symbol: string } {
        const config = MODIFIER_CONFIGS[this.modifierType];
        return {
            primary: config.primaryColor,
            border: config.secondaryColor,
            glow: config.glowColor,
            symbol: config.symbol
        };
    }

    private drawModifierSymbol(ctx: CanvasRenderingContext2D, color: string): void {
        ctx.fillStyle = color;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const config = MODIFIER_CONFIGS[this.modifierType];
        ctx.fillText(config.symbol, 16, 16);
    }

    private createGlowEffect(): void {
        this.glowEffect = new ex.Actor({
            pos: this.pos,
            width: 40,
            height: 40,
            anchor: ex.vec(0.5, 0.5),
            z: this.z - 1
        });

        const glowCanvas = new ex.Canvas({
            width: 40,
            height: 40,
            draw: (ctx: CanvasRenderingContext2D) => {
                const colors = this.getModifierColors();
                
                // Create pulsing glow effect
                const alpha = 0.3 + Math.sin(this.pulseTimer * 0.01) * 0.2;
                ctx.fillStyle = colors.glow + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.fillRect(0, 0, 40, 40);
            }
        });

        this.glowEffect.graphics.use(glowCanvas);
        this.scene?.add(this.glowEffect);
    }

    private createParticleEffect(): void {
        const colors = this.getModifierColors();
        
        this.particleEmitter = new ex.ParticleEmitter({
            pos: ex.vec(0, 0),
            emitterType: ex.EmitterType.Circle,
            radius: 16,
            isEmitting: true,
            emitRate: 3,
            particle: {
                life: 2000,
                opacity: 0.6,
                fade: true,
                minSize: 1,
                maxSize: 3,
                startSize: 2,
                endSize: 0,
                minSpeed: 5,
                maxSpeed: 15,
                minAngle: 0,
                maxAngle: Math.PI * 2,
                beginColor: ex.Color.fromHex(colors.glow),
                endColor: ex.Color.fromHex(colors.primary),
            }
        });

        this.addChild(this.particleEmitter);
    }

    private setupInteraction(): void {
        this.on('precollision', (event: ex.PreCollisionEvent) => {
            const otherActor = event.other.owner as ex.Actor;
            
            if (otherActor?.name === 'Player') {
                // Notify the player about the modifier pickup
                this.emit('modifier-pickup', { modifierType: this.modifierType, box: this });
            }
        });
    }

    override onPreUpdate(engine: ex.Engine, delta: number): void {
        // Update pulse timer for glow effect
        this.pulseTimer += delta;
        
        // Update glow effect position and rotation
        if (this.glowEffect) {
            this.glowEffect.pos = this.pos;
            this.glowEffect.rotation = this.rotation;
        }
    }

    getModifierType(): BulletModifierType {
        return this.modifierType;
    }

    getModifierName(): string {
        const config = MODIFIER_CONFIGS[this.modifierType];
        return config.name;
    }

    override onPostKill(): void {
        // Clean up glow effect
        if (this.glowEffect) {
            this.glowEffect.kill();
        }
        
        // Stop particle emitter
        if (this.particleEmitter) {
            this.particleEmitter.isEmitting = false;
            this.particleEmitter.kill();
        }
    }
}
