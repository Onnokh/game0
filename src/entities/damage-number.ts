import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class DamageNumber extends ex.Actor {
    private duration = 750; // How long the damage number stays visible (in milliseconds)
    private floatSpeed = 50; // How fast the number floats upward (pixels per second)
    private startTime: number;
    private damage: number;
    private damageColor: ex.Color;
    private isCritical: boolean = false;
    private isAnimating: boolean = false;
    private growDuration = 150; // How long the grow animation takes
    private fadeStartTime: number;
    private hasGrown: boolean = false; // Track if grow animation has completed

    constructor(position: ex.Vector, damage: number, color: ex.Color = ex.Color.White, isCritical: boolean = false) {
        super({
            name: 'DamageNumber',
            pos: position,
            width: 32, // Smaller width
            height: 16, // Smaller height
            collisionType: ex.CollisionType.PreventCollision,
            anchor: ex.vec(0.5, 0.5)
        });

        this.damage = damage;
        this.damageColor = color;
        this.isCritical = isCritical;
        this.startTime = Date.now();
        this.isAnimating = false;
        this.fadeStartTime = this.startTime + this.duration - 300; // Start fading 300ms before end
        this.hasGrown = false; // Reset grow state for new damage number
        
        // Set high z-index to appear above everything
        this.z = 2000;
        
        // Start small for grow animation
        this.scale = ex.vec(0.5, 0.5);
        
        // Create the damage text graphic
        this.createDamageText();
    }

    private createDamageText(): void {
        const fontSize = this.isCritical ? 18 : 14; // Larger text for critical hits
        const damageText = Math.round(this.damage).toString();
        
        // Create shadow text (dark, slightly offset)
        const shadowText = new ex.Text({
            text: damageText,
            font: Resources.DeterminationFont.toFont({
                size: fontSize,
                color: ex.Color.Black,
                textAlign: ex.TextAlign.Center,
                baseAlign: ex.BaseAlign.Middle
            })
        });
        
        // Create main text
        const mainText = new ex.Text({
            text: damageText,
            font: Resources.DeterminationFont.toFont({
                size: fontSize,
                color: this.damageColor,
                textAlign: ex.TextAlign.Center,
                baseAlign: ex.BaseAlign.Middle
            })
        });
        
        // Create a graphics group with shadow offset
        const textGroup = new ex.GraphicsGroup({
            members: [
                { graphic: shadowText, offset: ex.vec(2, 2) }, // Shadow offset
                { graphic: mainText, offset: ex.vec(0, 0) }    // Main text
            ]
        });

        this.graphics.use(textGroup);
    }

    override onInitialize(): void {
        // Removed random offset for better performance
        // Damage numbers will appear at consistent positions
    }

    override onPreUpdate(engine: ex.Engine, delta: number): void {
        const elapsed = Date.now() - this.startTime;
        
        // Grow animation (first 150ms) - only if not already grown
        if (!this.hasGrown && elapsed < this.growDuration) {
            const growProgress = elapsed / this.growDuration;
            const scale = 0.5 + (growProgress * 0.5); // Grow from 0.5 to 1.0
            this.scale = ex.vec(scale, scale);
        } else if (!this.hasGrown) {
            // Mark as grown and ensure full scale
            this.hasGrown = true;
            this.scale = ex.vec(1, 1);
        }
        
        // Only start floating after the grace period (300ms)
        if (elapsed >= 300) {
            if (!this.isAnimating) {
                this.isAnimating = true;
                console.log('Started floating damage number:', this.damage); // Debug log
            }
            
            // Float upward
            this.pos = this.pos.add(ex.vec(0, -this.floatSpeed * (delta / 1000)));
        }
        
        // Fade out animation (last 300ms)
        if (elapsed >= this.fadeStartTime) {
            const fadeProgress = (elapsed - this.fadeStartTime) / 300;
            const opacity = Math.max(0, 1 - fadeProgress);
            this.graphics.opacity = opacity;
        }
        
        // Remove when duration is complete
        if (elapsed >= this.duration) {
            this.kill();
        }
    }

    // Method to update the damage number with new values
    updateDamage(newDamage: number, isCritical: boolean = false): void {
        this.damage = newDamage;
        this.isCritical = isCritical;
        
        // Update the text graphic
        this.createDamageText();
        
        // Only reset the fade timing, not the grow animation timing
        // This prevents the grow animation from restarting
        this.fadeStartTime = Date.now() + this.duration - 300; // Reset fade start time
        
        // Don't reset isAnimating - preserve current animation state
        // Don't reset hasGrown - keep the grown state
        // Don't reset scale and opacity - keep current state for smooth updates
        // Only reset opacity if it was fading out
        if (this.graphics.opacity < 1) {
            this.graphics.opacity = 1; // Reset opacity only if fading
        }
        
        console.log('Updated damage number to:', newDamage); // Debug log
    }

    // Static factory method to create damage numbers with different colors based on damage type
    static createDamageNumber(position: ex.Vector, damage: number, isCritical: boolean = false): DamageNumber {
        let color: ex.Color;
        
        if (isCritical) {
            color = ex.Color.fromHex('#FFD700'); // Critical hits in gold
        } else {
            color = ex.Color.White; // Low damage in white
        }
        
        return new DamageNumber(position, damage, color, isCritical);
    }

    // Create damage number with modifier icon
    static createModifierDamageNumber(position: ex.Vector, damage: number, modifierType: string, modifierIcon: string): DamageNumber {
        let color: ex.Color;
        
        // Color based on modifier type
        switch (modifierType) {
            case 'fire':
                color = ex.Color.fromHex('#FF4500');
                break;
            case 'lightning':
                color = ex.Color.fromHex('#00FFFF');
                break;
            case 'ice':
                color = ex.Color.fromHex('#87CEEB');
                break;
            case 'poison':
                color = ex.Color.fromHex('#32CD32'); 
                break;
            default:
                color = ex.Color.White;
        }
        
        const damageNumber = new DamageNumber(position, damage, color, false);
        damageNumber.addModifierIcon(modifierIcon);
        return damageNumber;
    }

    // Add modifier icon to existing damage number
    addModifierIcon(icon: string): void {
        const fontSize = this.isCritical ? 18 : 14;
        const iconSize = fontSize + 4;
        
        // Create icon text
        const iconText = new ex.Text({
            text: icon,
            font: Resources.DeterminationFont.toFont({
                size: iconSize,
                color: this.damageColor,
                textAlign: ex.TextAlign.Center,
                baseAlign: ex.BaseAlign.Middle
            })
        });
        
        // Create shadow for icon
        const iconShadow = new ex.Text({
            text: icon,
            font: Resources.DeterminationFont.toFont({
                size: iconSize,
                color: ex.Color.Black,
                textAlign: ex.TextAlign.Center,
                baseAlign: ex.BaseAlign.Middle
            })
        });
        
        // Update the graphics group to include the icon
        const damageText = Math.round(this.damage).toString();
        const shadowText = new ex.Text({
            text: damageText,
            font: Resources.DeterminationFont.toFont({
                size: fontSize,
                color: ex.Color.Black,
                textAlign: ex.TextAlign.Center,
                baseAlign: ex.BaseAlign.Middle
            })
        });
        
        const mainText = new ex.Text({
            text: damageText,
            font: Resources.DeterminationFont.toFont({
                size: fontSize,
                color: this.damageColor,
                textAlign: ex.TextAlign.Center,
                baseAlign: ex.BaseAlign.Middle
            })
        });
        
        // Create a graphics group with icon and damage text
        const textGroup = new ex.GraphicsGroup({
            members: [
                { graphic: iconShadow, offset: ex.vec(2, -8) },
                { graphic: iconText, offset: ex.vec(0, -10) }, 
                { graphic: shadowText, offset: ex.vec(2, 2) },
                { graphic: mainText, offset: ex.vec(0, 0) }
            ]
        });

        this.graphics.use(textGroup);
    }
}
