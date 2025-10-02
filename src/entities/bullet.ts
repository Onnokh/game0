import * as ex from 'excalibur';
import { bulletCollisionGroup } from '../lib/collision-groups';
import { BulletComponent } from '../components/bullet-component';
import { BulletModifierComponent, BulletModifierType } from '../components/bullet-modifier-component';
import { StatusEffectComponent } from '../components/status-effect-component';
import { DamageNumberSystem } from '../systems/damage-number-system';

export class Bullet extends ex.Actor {
    private speed = 600; // pixels per second
    private trailEmitter!: ex.ParticleEmitter;
    private shadow!: ex.Actor;

    constructor(startPos: ex.Vector, direction: ex.Vector, damage: number = 25, modifiers: BulletModifierType[] = []) {
        super({
            name: 'Bullet',
            pos: startPos,
            width: 8,
            height: 8,
            collisionType: ex.CollisionType.Active,
            collisionGroup: bulletCollisionGroup,
            anchor: ex.vec(0.5, 0.5) // Center the bullet
        });

        // Add the bullet component
        const bulletComponent = new BulletComponent(damage);
        this.addComponent(bulletComponent);
        
        // Add modifiers if any
        if (modifiers.length > 0) {
            const modifierComponent = new BulletModifierComponent(modifiers);
            this.addComponent(modifierComponent);
            bulletComponent.modifiers = modifierComponent;
        }
        
        // Set velocity based on direction and speed
        this.vel = direction.normalize().scale(this.speed);
        
        // Calculate rotation angle to face the direction of travel
        this.rotation = Math.atan2(direction.y, direction.x);
        
        // Set z-index to be above most things
        this.z = 1000;
    }

    override onInitialize(): void {
        // Create bullet with modifier-specific appearance
        this.createBulletVisual();
        
        // Create shadow for the bullet
        const shadowCanvas = new ex.Canvas({
            width: 8,
            height: 3,
            draw: (ctx: CanvasRenderingContext2D) => {
                // Simple dark shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(0, 0, 8, 3);
            }
        });
        
        // Create shadow actor positioned below the bullet in world space
        this.shadow = new ex.Actor({
            name: 'BulletShadow',
            pos: ex.vec(this.pos.x, this.pos.y + 8), // Position in world space
            anchor: ex.vec(0.5, 0.5),
            z: this.z - 1
        });
        
        this.shadow.graphics.use(shadowCanvas);
        this.scene?.add(this.shadow); // Add to scene instead of as child
        
        // Update shadow position and rotation to match the bullet
        this.on('preupdate', () => {
            // Always place shadow 8 pixels down in world space (positive Y direction)
            // regardless of bullet rotation
            this.shadow.pos = ex.vec(this.pos.x, this.pos.y + 8);
            // Make shadow rotate with the bullet
            this.shadow.rotation = this.rotation;
        });
        
        // Create modifier-aware trail particle emitter
        this.createTrailEmitter();
        
        this.addChild(this.trailEmitter);
        
        // Add collision event handlers
        this.on('precollision', this.onPreCollision.bind(this));
    }

    onPreCollision(event: ex.PreCollisionEvent): void {
        const otherActor = event.other.owner as ex.Actor;
        const bulletComponent = this.get(BulletComponent)!;
        
        // Early exit if bullet is already being destroyed
        if (this.isKilled()) return;
        
        // Check if collision is with a tile or tilemap
        if (event.other.owner instanceof ex.Tile || event.other.owner instanceof ex.TileMap) {
            this.kill();
            return;
        }
        
        // Handle collision with enemies
        if (otherActor?.name === 'Enemy') {
            // Calculate critical hit (10% chance)
            const isCritical = Math.random() < 0.05;
            const finalDamage = isCritical ? bulletComponent.damage * 2 : bulletComponent.damage;
            
            // Deal damage to enemy
            if (typeof (otherActor as any).takeDamage === 'function') {
                (otherActor as any).takeDamage(finalDamage, isCritical);
            }
            
            // Notify damage number system
            const damageNumberSystem = DamageNumberSystem.getInstance();
            if (damageNumberSystem) {
                damageNumberSystem.addDamage(otherActor, finalDamage, isCritical);
            }
            
            // Trigger modifier effects on hit
            this.triggerModifierEffectsOnHit(otherActor);
            
            this.kill();
            return;
        }
        
        // Handle collision with solid objects (walls, trees, etc.)
        if (otherActor?.body?.collisionType === ex.CollisionType.Fixed) {
            this.kill();
            return;
        }
    }

    getDamage(): number {
        return this.get(BulletComponent)?.damage ?? 0;
    }
    
    override onPostKill(): void {
        // Stop emitting particles when bullet is destroyed
        if (this.trailEmitter) {
            this.trailEmitter.isEmitting = false;
            this.trailEmitter.kill(); // Properly destroy the emitter to prevent memory leaks
        }
        
        // Clean up shadow
        if (this.shadow) {
            this.shadow.kill();
        }
    }

    private createBulletVisual(): void {
        const bulletComponent = this.get(BulletComponent);
        const hasModifiers = bulletComponent?.modifiers && bulletComponent.modifiers.modifiers.length > 0;
        
        if (hasModifiers) {
            // Create modifier-specific bullet appearance
            const modifierTypes = bulletComponent!.modifiers!.modifiers.map(m => m.type);
            this.createModifierBulletVisual(modifierTypes);
        } else {
            // Create standard bullet appearance
            this.createStandardBulletVisual();
        }
    }

    private createStandardBulletVisual(): void {
        const bulletCanvas = new ex.Canvas({
            width: 8,
            height: 2,
            draw: (ctx: CanvasRenderingContext2D) => {
                // Yellow tip (small rectangle at the back - where it was fired from)
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(0, 0, 2, 2);
                
                // Dark bullet body (main rectangle at the front)
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(2, 0, 6, 2);
            }
        });
        
        this.graphics.use(bulletCanvas);
    }

    private createModifierBulletVisual(modifierTypes: BulletModifierType[]): void {
        const bulletCanvas = new ex.Canvas({
            width: 10,
            height: 4,
            draw: (ctx: CanvasRenderingContext2D) => {
                // Determine colors based on modifiers
                let tipColor = '#FFD700';
                let bodyColor = '#2C2C2C';
                let glowColor = '';

                if (modifierTypes.includes(BulletModifierType.FIRE)) {
                    tipColor = '#FF4500';
                    bodyColor = '#8B0000';
                    glowColor = '#FF4500';
                } else if (modifierTypes.includes(BulletModifierType.LIGHTNING)) {
                    tipColor = '#00FFFF';
                    bodyColor = '#000080';
                    glowColor = '#00FFFF';
                } else if (modifierTypes.includes(BulletModifierType.ICE)) {
                    tipColor = '#87CEEB';
                    bodyColor = '#4682B4';
                    glowColor = '#87CEEB';
                } else if (modifierTypes.includes(BulletModifierType.POISON)) {
                    tipColor = '#32CD32';
                    bodyColor = '#228B22';
                    glowColor = '#32CD32';
                }

                // Add glow effect
                if (glowColor) {
                    ctx.shadowColor = glowColor;
                    ctx.shadowBlur = 4;
                }

                // Yellow tip (small rectangle at the back)
                ctx.fillStyle = tipColor;
                ctx.fillRect(0, 1, 2, 2);
                
                // Dark bullet body (main rectangle at the front)
                ctx.fillStyle = bodyColor;
                ctx.fillRect(2, 1, 6, 2);

                // Reset shadow
                ctx.shadowBlur = 0;
            }
        });
        
        this.graphics.use(bulletCanvas);
    }

    private createTrailEmitter(): void {
        const bulletComponent = this.get(BulletComponent);
        const hasModifiers = bulletComponent?.modifiers && bulletComponent.modifiers.modifiers.length > 0;
        
        let particleConfig: any = {
            life: 200,
            opacity: 0.8,
            fade: true,
            minSize: 1,
            maxSize: 2,
            startSize: 2,
            endSize: 0,
            minSpeed: 3,
            maxSpeed: 10,
            minAngle: Math.PI - 0.2,
            maxAngle: Math.PI + 0.2,
            beginColor: ex.Color.fromHex('#FFD700'),
            endColor: ex.Color.fromHex('#FF8800'),
        };

        if (hasModifiers) {
            const modifierTypes = bulletComponent!.modifiers!.modifiers.map(m => m.type);
            
            if (modifierTypes.includes(BulletModifierType.FIRE)) {
                particleConfig = {
                    ...particleConfig,
                    life: 300,
                    emitRate: 12,
                    beginColor: ex.Color.fromHex('#FF4500'),
                    endColor: ex.Color.fromHex('#FF0000'),
                };
            } else if (modifierTypes.includes(BulletModifierType.LIGHTNING)) {
                particleConfig = {
                    ...particleConfig,
                    life: 150,
                    emitRate: 15,
                    beginColor: ex.Color.fromHex('#00FFFF'),
                    endColor: ex.Color.fromHex('#0080FF'),
                };
            } else if (modifierTypes.includes(BulletModifierType.ICE)) {
                particleConfig = {
                    ...particleConfig,
                    life: 400,
                    emitRate: 6,
                    beginColor: ex.Color.fromHex('#87CEEB'),
                    endColor: ex.Color.fromHex('#B0E0E6'),
                };
            } else if (modifierTypes.includes(BulletModifierType.POISON)) {
                particleConfig = {
                    ...particleConfig,
                    life: 250,
                    emitRate: 10,
                    beginColor: ex.Color.fromHex('#32CD32'),
                    endColor: ex.Color.fromHex('#228B22'),
                };
            }
        }

        this.trailEmitter = new ex.ParticleEmitter({
            pos: ex.vec(0, 0),
            emitterType: ex.EmitterType.Rectangle,
            radius: 1,
            isEmitting: true,
            emitRate: 8,
            particle: particleConfig
        });
    }

    private triggerModifierEffectsOnHit(enemy: ex.Actor): void {
        const modifierComponent = this.get(BulletModifierComponent);
        if (!modifierComponent) return;

        // Get all active modifiers
        const activeModifiers = modifierComponent.modifiers.filter(m => m.duration > 0);
        
        for (const modifier of activeModifiers) {
            switch (modifier.type) {
                case BulletModifierType.LIGHTNING:
                    this.triggerLightningAOE(enemy, modifier);
                    break;
                case BulletModifierType.FIRE:
                    this.triggerFireEffect(enemy, modifier);
                    break;
                case BulletModifierType.ICE:
                    this.triggerIceEffect(enemy, modifier);
                    break;
                case BulletModifierType.POISON:
                    this.triggerPoisonEffect(enemy, modifier);
                    break;
            }
        }
    }

    private triggerLightningAOE(enemy: ex.Actor, modifier: any): void {
        // Check if there's already an active lightning effect at this position
        if (this.hasActiveLightningEffect(this.pos)) {
            return; // Don't create overlapping effects
        }

        // Find all enemies in AOE range
        const enemiesInRange = this.findEnemiesInRange(this.pos, 100);
        
        for (const targetEnemy of enemiesInRange) {
            // Apply lightning status effect
            this.applyStatusEffect(targetEnemy, 'lightning', 2000);
        }

        // Create lightning AOE effect
        this.createLightningAOEEffect(this.pos, modifier.config);
    }

    private triggerFireEffect(enemy: ex.Actor, modifier: any): void {
        // Apply fire status effect
        this.applyStatusEffect(enemy, 'fire', 5000);
        
        // Create fire visual effect
        this.createFireEffect(this.pos, modifier.config);
    }

    private triggerIceEffect(enemy: ex.Actor, modifier: any): void {
        // Apply ice status effect
        this.applyStatusEffect(enemy, 'ice', 5000);
        
        // Create ice visual effect
        this.createIceEffect(this.pos, modifier.config);
    }

    private triggerPoisonEffect(enemy: ex.Actor, modifier: any): void {
        // Apply poison status effect
        this.applyStatusEffect(enemy, 'poison', 5000);
        
        // Create poison visual effect
        this.createPoisonEffect(this.pos, modifier.config);
    }

    private findEnemiesInRange(position: ex.Vector, range: number): ex.Actor[] {
        const enemies: ex.Actor[] = [];
        
        // Get all enemies from the scene
        const allActors = this.scene?.actors || [];
        for (const actor of allActors) {
            if (actor.name === 'Enemy') {
                const distance = position.distance(actor.pos);
                if (distance <= range) {
                    enemies.push(actor);
                }
            }
        }
        
        return enemies;
    }

    private applyStatusEffect(enemy: ex.Actor, effectType: string, duration: number): void {
        // Get or create status effect component
        let statusComponent = enemy.get(StatusEffectComponent);
        if (!statusComponent) {
            statusComponent = new StatusEffectComponent();
            enemy.addComponent(statusComponent);
        }

        // Apply the status effect
        statusComponent.applyEffect(effectType as any, duration);
    }

    private createLightningAOEEffect(position: ex.Vector, config: any): void {
        // Create lightning AOE effect with better visuals
        const lightningAOE = new ex.Actor({
            name: 'LightningAOE',
            pos: position,
            width: 200, // 100 pixel radius * 2
            height: 200,
            anchor: ex.vec(0.5, 0.5),
            z: 1500
        });

        // Create animated lightning effect
        const lightningCanvas = new ex.Canvas({
            width: 200,
            height: 200,
            draw: (ctx: CanvasRenderingContext2D) => {
                const centerX = 100;
                const centerY = 100;
                const radius = 100;
                
                // Create gradient for better visual effect
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)'); // Bright cyan center
                gradient.addColorStop(0.3, 'rgba(0, 200, 255, 0.4)'); // Medium cyan
                gradient.addColorStop(0.7, 'rgba(0, 150, 255, 0.2)'); // Light blue
                gradient.addColorStop(1, 'rgba(0, 100, 255, 0.1)'); // Very light blue edge
                
                // Draw main circle
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Add lightning bolt pattern
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                // Create jagged lightning pattern
                const boltPoints = this.generateLightningBolt(centerX, centerY, radius);
                ctx.moveTo(boltPoints[0].x, boltPoints[0].y);
                for (let i = 1; i < boltPoints.length; i++) {
                    ctx.lineTo(boltPoints[i].x, boltPoints[i].y);
                }
                ctx.stroke();
                
                // Add outer glow
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        });

        lightningAOE.graphics.use(lightningCanvas);
        this.scene?.add(lightningAOE);

        // Add pulsing animation
        let pulseTime = 0;
        const pulseInterval = setInterval(() => {
            pulseTime += 50;
            const scale = 1 + Math.sin(pulseTime / 100) * 0.1; // Gentle pulsing
            lightningAOE.scale = ex.vec(scale, scale);
            
            if (pulseTime >= 300) {
                clearInterval(pulseInterval);
            }
        }, 50);

        // Remove after a short time
        setTimeout(() => {
            clearInterval(pulseInterval);
            lightningAOE.kill();
        }, 300);
    }

    private generateLightningBolt(centerX: number, centerY: number, radius: number): {x: number, y: number}[] {
        const points: {x: number, y: number}[] = [];
        const segments = 8;
        
        // Start from center
        points.push({x: centerX, y: centerY});
        
        for (let i = 1; i <= segments; i++) {
            const angle = (Math.PI * 2 * i) / segments + Math.random() * 0.5 - 0.25; // Add some randomness
            const distance = (radius * i) / segments + Math.random() * 20 - 10; // Vary distance
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            points.push({x, y});
        }
        
        return points;
    }

    private hasActiveLightningEffect(position: ex.Vector): boolean {
        if (!this.scene) return false;
        
        // Check for existing lightning effects within 50 pixels
        const existingEffects = this.scene.actors.filter(actor => 
            actor.name === 'LightningAOE' && 
            actor.pos.distance(position) < 50
        );
        
        return existingEffects.length > 0;
    }

    private createFireEffect(position: ex.Vector, config: any): void {
        // Create optimized fire particle effect
        const fireEmitter = new ex.ParticleEmitter({
            pos: position,
            emitterType: ex.EmitterType.Circle,
            radius: 2,
            isEmitting: true,
            emitRate: 8,
            particle: {
                life: 300,
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
                beginColor: ex.Color.fromHex(config.secondaryColor),
                endColor: ex.Color.fromHex(config.primaryColor),
            }
        });

        this.scene?.add(fireEmitter);
        
        setTimeout(() => {
            fireEmitter.kill();
        }, 500);
    }

    private createIceEffect(position: ex.Vector, config: any): void {
        // Create optimized ice particle effect
        const iceEmitter = new ex.ParticleEmitter({
            pos: position,
            emitterType: ex.EmitterType.Circle,
            radius: 2,
            isEmitting: true,
            emitRate: 6,
            particle: {
                life: 200,
                opacity: 0.5,
                fade: true,
                minSize: 1,
                maxSize: 2,
                startSize: 1.5,
                endSize: 0,
                minSpeed: 3,
                maxSpeed: 8,
                minAngle: 0,
                maxAngle: Math.PI * 2,
                beginColor: ex.Color.fromHex(config.secondaryColor),
                endColor: ex.Color.fromHex(config.primaryColor),
            }
        });

        this.scene?.add(iceEmitter);
        
        setTimeout(() => {
            iceEmitter.kill();
        }, 400);
    }

    private createPoisonEffect(position: ex.Vector, config: any): void {
        // Create optimized poison particle effect
        const poisonEmitter = new ex.ParticleEmitter({
            pos: position,
            emitterType: ex.EmitterType.Circle,
            radius: 2,
            isEmitting: true,
            emitRate: 5,
            particle: {
                life: 250,
                opacity: 0.4,
                fade: true,
                minSize: 1,
                maxSize: 2,
                startSize: 1.5,
                endSize: 0,
                minSpeed: 2,
                maxSpeed: 6,
                minAngle: 0,
                maxAngle: Math.PI * 2,
                beginColor: ex.Color.fromHex(config.secondaryColor),
                endColor: ex.Color.fromHex(config.primaryColor),
            }
        });

        this.scene?.add(poisonEmitter);
        
        setTimeout(() => {
            poisonEmitter.kill();
        }, 300);
    }
}
