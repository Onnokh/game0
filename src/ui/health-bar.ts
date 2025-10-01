import * as ex from 'excalibur';
import { Resources } from '../lib/resources';

export class HealthBar extends ex.ScreenElement {
    private healthBarCanvas!: ex.Canvas;
    private healthLabel!: ex.Label;
    private currentHealth: number = 100;
    private maxHealth: number = 100;
    private displayHealth: number = 100; // Animated health value
    private barWidth: number = 200;
    private barHeight: number = 20;
    private animationSpeed: number = 80; // Health points per second
    private isAnimating: boolean = false;

    constructor() {
        super();
    }

    override onInitialize(engine: ex.Engine): void {
        // Create health bar canvas
        this.healthBarCanvas = new ex.Canvas({
            width: this.barWidth + 4, // +4 for border
            height: this.barHeight + 4, // +4 for border
            cache: true,
            draw: (ctx) => this.drawHealthBarToCanvas(ctx)
        });

        // Create health text label
        this.healthLabel = new ex.Label({
            text: '100/100',
            pos: ex.vec(this.barWidth + 10, this.barHeight / 2),
            z: 999999,
            font: Resources.DeterminationFont.toFont({
                size: 16,
                color: ex.Color.White,
                textAlign: ex.TextAlign.Left,
                lineHeight: this.barHeight
            }),
            anchor: ex.vec(0, 0.5)
        });

        // Position in bottom left
        this.pos = ex.vec(20, engine.drawHeight - 40);
        this.z = 999999; // Ensure health bar renders above everything
        this.healthLabel.pos = ex.vec(this.barWidth + 10, this.barHeight / 2);

        // Add canvas as a graphic to this element
        this.graphics.use(this.healthBarCanvas);
        this.addChild(this.healthLabel);
    }

    updateHealth(current: number, max: number): void {
        this.currentHealth = current;
        this.maxHealth = max;
        
        // Update label with actual health values
        this.healthLabel.text = `${current}/${max}`;
        
        // Flag canvas for redraw
        this.healthBarCanvas.flagDirty();
    }

    override onPreUpdate(engine: ex.Engine, delta: number): void {
        // Animate display health towards current health
        const healthDifference = this.currentHealth - this.displayHealth;
        
        if (Math.abs(healthDifference) > 0.1) {
            this.isAnimating = true;
            
            // Calculate animation step based on delta time
            const animationStep = this.animationSpeed * (delta / 1000);
            
            if (healthDifference > 0) {
                // Healing - animate up
                this.displayHealth = Math.min(this.currentHealth, this.displayHealth + animationStep);
            } else {
                // Taking damage - animate down
                this.displayHealth = Math.max(this.currentHealth, this.displayHealth - animationStep);
            }
            
            // Flag canvas for redraw when animating
            this.healthBarCanvas.flagDirty();
        } else {
            this.isAnimating = false;
        }
    }

    private drawHealthBarToCanvas(ctx: CanvasRenderingContext2D): void {
        const healthPercentage = this.displayHealth / this.maxHealth;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.barWidth + 4, this.barHeight + 4);
        
        // Draw background (dark red)
        ctx.fillStyle = '#4A0000';
        ctx.fillRect(2, 2, this.barWidth, this.barHeight);
        
        // Use consistent red color for health bar
        const healthColor = '#FF0000'; // Red
        
        // Draw health bar
        ctx.fillStyle = healthColor;
        const filledWidth = this.barWidth * healthPercentage;
        if (filledWidth > 0) {
            ctx.fillRect(2, 2, filledWidth, this.barHeight);
        }
        
        // Add a subtle glow effect when animating
        if (this.isAnimating) {
            ctx.shadowColor = healthColor;
            ctx.shadowBlur = 4;
            ctx.fillRect(2, 2, filledWidth, this.barHeight);
            ctx.shadowBlur = 0;
        }
        
        // Draw border (white, thicker when animating)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = this.isAnimating ? 3 : 2;
        ctx.strokeRect(2, 2, this.barWidth, this.barHeight);
    }
}
