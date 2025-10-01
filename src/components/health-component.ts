import * as ex from 'excalibur';

export class HealthComponent extends ex.Component {
    public maxHealth: number;
    public currentHealth: number;
    public isDead: boolean = false;

    constructor(maxHealth: number = 100) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }

    /**
     * Take damage and return true if the entity dies
     */
    takeDamage(amount: number): boolean {
        if (this.isDead) return false;
        
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        if (this.currentHealth <= 0) {
            this.isDead = true;
            return true;
        }
        
        return false;
    }

    /**
     * Heal the entity
     */
    heal(amount: number): void {
        if (this.isDead) return;
        
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    /**
     * Get health percentage (0-1)
     */
    getHealthPercentage(): number {
        return this.currentHealth / this.maxHealth;
    }

    /**
     * Check if entity is alive
     */
    isAlive(): boolean {
        return !this.isDead && this.currentHealth > 0;
    }

    /**
     * Reset health to full
     */
    reset(): void {
        this.currentHealth = this.maxHealth;
        this.isDead = false;
    }
}
