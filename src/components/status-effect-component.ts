import * as ex from 'excalibur';
import { BulletModifierType, MODIFIER_CONFIGS } from './bullet-modifier-component';
import { DamageNumber } from '../entities/damage-number';

/**
 * Status effect types that can be applied to enemies
 */
export enum StatusEffectType {
    FIRE = 'fire',
    POISON = 'poison',
    ICE = 'ice',
    LIGHTNING = 'lightning'
}

/**
 * Individual status effect instance
 */
export interface StatusEffect {
    type: StatusEffectType;
    duration: number; // Remaining duration in milliseconds
    damage: number; // Damage per tick
    tickInterval: number; // How often damage is applied
    lastTickTime: number; // When the last damage tick occurred
    intensity: number; // Visual intensity (0-1)
    isActive: boolean; // Whether the effect is currently active
}

/**
 * Component that manages status effects on enemies
 */
export class StatusEffectComponent extends ex.Component {
    public effects: StatusEffect[] = [];
    public isFrozen: boolean = false;
    public freezeEndTime: number = 0;
    public originalSpeed: number = 0;

    constructor() {
        super();
    }

    /**
     * Apply a status effect to the enemy
     */
    applyEffect(type: StatusEffectType, duration: number = 3000): void {
        const config = MODIFIER_CONFIGS[type as unknown as BulletModifierType];
        if (!config) {
            return;
        }

        // Check if effect already exists
        const existingIndex = this.effects.findIndex(e => e.type === type);
        
        let damage = config.damage;
        
        // Fire buildup: increase damage over time
        if (type === StatusEffectType.FIRE && existingIndex >= 0) {
            const existingEffect = this.effects[existingIndex];
            damage = Math.min(existingEffect.damage + 1, 10); // Build up to max 10 damage
        }
        
        const effect: StatusEffect = {
            type,
            duration,
            damage,
            tickInterval: config.tickInterval,
            lastTickTime: Date.now(),
            intensity: 1.0,
            isActive: true
        };

        if (existingIndex >= 0) {
            // Replace existing effect
            this.effects[existingIndex] = effect;
        } else {
            // Add new effect
            this.effects.push(effect);
        }

        // Handle special effects
        if (type === StatusEffectType.ICE) {
            this.applySlow(); // Apply slow instead of freeze
        }
    }

    /**
     * Remove a specific status effect
     */
    removeEffect(type: StatusEffectType): void {
        this.effects = this.effects.filter(e => e.type !== type);
        
        if (type === StatusEffectType.ICE) {
            this.removeSlow();
        }
    }

    /**
     * Update all status effects
     */
    updateEffects(elapsed: number, enemy: ex.Actor): void {
        const currentTime = Date.now();

        // Update effect durations
        this.effects.forEach(effect => {
            effect.duration -= elapsed;
        });

        // Process active effects
        for (const effect of this.effects) {
            if (!effect.isActive || effect.duration <= 0) continue;

            // Check if it's time for a damage tick
            if (currentTime - effect.lastTickTime >= effect.tickInterval) {
                effect.lastTickTime = currentTime;
                
                // Apply damage
                if (typeof (enemy as any).takeDamage === 'function') {
                    (enemy as any).takeDamage(effect.damage, false);
                }

                // Show damage number
                this.showStatusDamage(enemy, effect);
            }
        }

        // Remove expired effects
        this.effects = this.effects.filter(effect => {
            if (effect.duration <= 0) {
                if (effect.type === StatusEffectType.ICE) {
                    this.removeSlow();
                }
                return false;
            }
            return true;
        });
    }

    /**
     * Apply slow effect
     */
    private applySlow(): void {
        // Store original speed if not already stored
        if (this.originalSpeed === 0) {
            this.originalSpeed = (this.owner as any).getMoveSpeed?.() || 100;
        }
        
        // Reduce speed to 30% of original (70% reduction)
        if (this.owner && typeof (this.owner as any).setMoveSpeed === 'function') {
            (this.owner as any).setMoveSpeed(this.originalSpeed * 0.3);
        }
    }

    /**
     * Remove slow effect
     */
    private removeSlow(): void {
        // Restore original speed
        if (this.owner && this.originalSpeed > 0 && typeof (this.owner as any).setMoveSpeed === 'function') {
            (this.owner as any).setMoveSpeed(this.originalSpeed);
        }
    }

    /**
     * Show damage number for status effect
     */
    private showStatusDamage(enemy: ex.Actor, effect: StatusEffect): void {
        try {
            // Get modifier config for icon
            const config = MODIFIER_CONFIGS[effect.type as unknown as BulletModifierType];
            const icon = config ? config.symbol : '?';
            
            // Create modifier damage number with icon
            const damageNumber = DamageNumber.createModifierDamageNumber(
                enemy.pos, 
                effect.damage, 
                effect.type, 
                icon
            );
            
            // Add to scene
            if (this.owner && this.owner.scene) {
                this.owner.scene.add(damageNumber);
            }
            
        } catch (error) {
            console.log('Could not show damage number for status effect:', error);
        }
    }

    /**
     * Get active effects
     */
    getActiveEffects(): StatusEffect[] {
        return this.effects.filter(e => e.isActive && e.duration > 0);
    }

    /**
     * Check if enemy has a specific effect
     */
    hasEffect(type: StatusEffectType): boolean {
        return this.effects.some(e => e.type === type && e.isActive && e.duration > 0);
    }

    /**
     * Clear all effects
     */
    clearAllEffects(): void {
        this.effects = [];
        this.removeSlow();
    }
}
