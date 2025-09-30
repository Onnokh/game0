import * as ex from 'excalibur';

export class DamageNumber extends ex.Actor {
    private duration = 750; // How long the damage number stays visible (in milliseconds)
    private fadeStartTime = 500; // When to start fading out (in milliseconds)
    private floatSpeed = 50; // How fast the number floats upward (pixels per second)
    private startTime: number;
    private damage: number;
    private damageColor: ex.Color;
    private textGraphic?: ex.Text;
    private isCritical: boolean = false;

    constructor(position: ex.Vector, damage: number, color: ex.Color = ex.Color.White, isCritical: boolean = false) {
        super({
            name: 'DamageNumber',
            pos: position,
            width: 64,
            height: 20,
            collisionType: ex.CollisionType.PreventCollision,
            anchor: ex.vec(0.5, 0.5)
        });

        this.damage = damage;
        this.damageColor = color;
        this.isCritical = isCritical;
        this.startTime = Date.now();
        
        // Set high z-index to appear above everything
        this.z = 2000;
        
        // Create the damage text graphic
        this.createDamageText();
    }

    private createDamageText(): void {
        // Create text graphic for the damage number with outline for better visibility
        const fontSize = this.isCritical ? 18 : 14; // Larger text for critical hits
        const shadowBlur = this.isCritical ? 4 : 2; // More pronounced shadow for critical hits
        
        const text = new ex.Text({
            text: Math.round(this.damage).toString(),
            font: new ex.Font({
                family: 'Arial Black, Arial, sans-serif',
                size: fontSize,
                color: this.damageColor,
                textAlign: ex.TextAlign.Center,
                baseAlign: ex.BaseAlign.Middle,
                shadow: {
                    offset: ex.vec(2, 2),
                    blur: shadowBlur,
                    color: ex.Color.Black
                }
            })
        });

        this.textGraphic = text;
        this.graphics.use(text);
    }

    override onInitialize(): void {
        // Add slight random offset to prevent overlapping damage numbers
        const randomOffset = ex.vec(
            (Math.random() - 0.5) * 20, // Random X offset between -10 and 10
            (Math.random() - 0.5) * 10  // Random Y offset between -5 and 5
        );
        this.pos = this.pos.add(randomOffset);
    }

    override onPreUpdate(engine: ex.Engine, delta: number): void {
        const elapsed = Date.now() - this.startTime;
        
        // Float upward
        this.pos = this.pos.add(ex.vec(0, -this.floatSpeed * (delta / 1000)));
        
        // Scale animation - start small, grow to normal size, then shrink slightly
        let scale = 1;
        const maxScale = this.isCritical ? 1.4 : 1.2; // Critical hits scale more
        const minScale = this.isCritical ? 0.3 : 0.5; // Critical hits start smaller
        
        if (elapsed < 200) {
            // Grow from min to max in first 200ms
            const growProgress = elapsed / 200;
            scale = minScale + (growProgress * (maxScale - minScale));
        } else if (elapsed < 400) {
            // Shrink from max to 1.0 in next 200ms
            const shrinkProgress = (elapsed - 200) / 200;
            scale = maxScale - (shrinkProgress * (maxScale - 1.0));
        }
        
        // Apply scaling
        this.scale = ex.vec(scale, scale);
        
        // Handle fading out
        if (elapsed >= this.fadeStartTime) {
            const fadeProgress = (elapsed - this.fadeStartTime) / (this.duration - this.fadeStartTime);
            const alpha = Math.max(0, 1 - fadeProgress);
            
            // Update text color with new alpha
            if (this.textGraphic && this.textGraphic.font instanceof ex.Font) {
                const newColor = this.damageColor.clone();
                newColor.a = alpha;
                this.textGraphic.font.color = newColor;
            }
        }
        
        // Remove when duration is complete
        if (elapsed >= this.duration) {
            this.kill();
        }
    }

    // Static factory method to create damage numbers with different colors based on damage type
    static createDamageNumber(position: ex.Vector, damage: number, isCritical: boolean = false): DamageNumber {
        let color: ex.Color;
        
        if (isCritical) {
            color = ex.Color.fromHex('#FFD700'); // Critical hits in gold
        } else if (damage >= 50) {
            color = ex.Color.Red; // High damage in red
        } else if (damage >= 25) {
            color = ex.Color.Orange; // Medium damage in orange
        } else {
            color = ex.Color.White; // Low damage in white
        }
        
        return new DamageNumber(position, damage, color, isCritical);
    }
}
