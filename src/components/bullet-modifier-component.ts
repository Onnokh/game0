import * as ex from 'excalibur';

/**
 * Bullet modifier type definitions
 */
export enum BulletModifierType {
    FIRE = 'fire',
    LIGHTNING = 'lightning',
    ICE = 'ice',
    POISON = 'poison'
}

/**
 * Configuration for different modifier types
 */
interface ModifierConfig {
    name: string;
    duration: number; // How long the effect lasts (in milliseconds)
    damage: number; // Damage per tick
    tickInterval: number; // How often damage is applied (in milliseconds)
    visualIntensity: number; // For visual effects (0-1)
    chainRange?: number; // For lightning - how far it can chain
    chainCount?: number; // For lightning - how many times it can chain
    primaryColor: string; // Primary color for visual effects
    secondaryColor: string; // Secondary color for visual effects
    glowColor: string; // Glow color for visual effects
    symbol: string; // Emoji symbol for modifier boxes
}

/**
 * Interface for modifier effect instances
 */
export interface ModifierEffect {
    type: BulletModifierType;
    config: ModifierConfig;
    duration: number; // Current remaining duration
    lastTickTime: number; // When the last damage tick occurred
    chainTargets?: ex.Actor[]; // For lightning - targets already hit by this chain
}

/**
 * Predefined modifier configurations
 */
export const MODIFIER_CONFIGS: Record<BulletModifierType, ModifierConfig> = {
    [BulletModifierType.FIRE]: {
        name: 'Fire Modifier',
        duration: 5000,
        damage: 4, // Start with 4 damage
        tickInterval: 300,
        visualIntensity: 1.0,
        primaryColor: '#8B0000',
        secondaryColor: '#FF4500',
        glowColor: '#FF4500',
        symbol: '🔥'
    },
    [BulletModifierType.LIGHTNING]: {
        name: 'Lightning Modifier',
        duration: 5000,
        damage: 8,
        tickInterval: 300,
        visualIntensity: 1.0,
        chainRange: 150,
        chainCount: 3,
        primaryColor: '#000080',
        secondaryColor: '#00FFFF',
        glowColor: '#00FFFF',
        symbol: '⚡'
    },
    [BulletModifierType.ICE]: {
        name: 'Ice Modifier',
        duration: 5000,
        damage: 2, 
        tickInterval: 300,
        visualIntensity: 1.0,
        primaryColor: '#4682B4',
        secondaryColor: '#87CEEB',
        glowColor: '#87CEEB',
        symbol: '❄️'
    },
    [BulletModifierType.POISON]: {
        name: 'Poison Modifier',
        duration: 5000,
        damage: 8,
        tickInterval: 300,
        visualIntensity: 1.0,
        primaryColor: '#228B22',
        secondaryColor: '#32CD32',
        glowColor: '#32CD32',
        symbol: '☠️'
    }
};

/**
 * Component that stores bullet modifier effects
 */
export class BulletModifierComponent extends ex.Component {
    public modifiers: ModifierEffect[] = [];
    public isActive: boolean = true;

    constructor(modifierTypes: BulletModifierType[] = []) {
        super();
        
        // Add initial modifiers
        modifierTypes.forEach(type => {
            this.addModifier(type);
        });
    }

    addModifier(type: BulletModifierType): void {
        const config = MODIFIER_CONFIGS[type];
        const modifier: ModifierEffect = {
            type,
            config,
            duration: config.duration,
            lastTickTime: Date.now(),
            chainTargets: type === BulletModifierType.LIGHTNING ? [] : undefined
        };

        // Check if this modifier type already exists
        const existingIndex = this.modifiers.findIndex(m => m.type === type);
        if (existingIndex >= 0) {
            // Replace existing modifier with new one
            this.modifiers[existingIndex] = modifier;
        } else {
            // Add new modifier
            this.modifiers.push(modifier);
        }
    }

    removeModifier(type: BulletModifierType): void {
        this.modifiers = this.modifiers.filter(m => m.type !== type);
    }

    hasModifier(type: BulletModifierType): boolean {
        return this.modifiers.some(m => m.type === type);
    }

    getModifier(type: BulletModifierType): ModifierEffect | undefined {
        return this.modifiers.find(m => m.type === type);
    }

    updateModifiers(elapsed: number): void {
        this.modifiers.forEach(modifier => {
            modifier.duration -= elapsed;
        });

        // Remove expired modifiers
        this.modifiers = this.modifiers.filter(modifier => modifier.duration > 0);
    }

    isExpired(): boolean {
        return this.modifiers.length === 0;
    }
}
