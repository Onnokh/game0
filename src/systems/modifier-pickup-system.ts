import * as ex from 'excalibur';
import { BulletModifierType } from '../components/bullet-modifier-component';

/**
 * System that handles modifier box pickups and applies them to the player
 */
export class ModifierPickupSystem extends ex.System {
    public readonly systemType = ex.SystemType.Update;
    public priority = 300; // Run after other systems

    private modifierBoxQuery: ex.Query<typeof ex.TransformComponent>;
    private playerQuery: ex.Query<typeof ex.TransformComponent>;

    constructor(public world: ex.World) {
        super();
        this.modifierBoxQuery = world.query([ex.TransformComponent]);
        this.playerQuery = world.query([ex.TransformComponent]);
    }

    update(elapsed: number): void {
        // Find all modifier boxes
        const modifierBoxes = this.modifierBoxQuery.entities.filter(
            entity => entity instanceof ex.Actor && entity.name === 'ModifierBox'
        ) as ex.Actor[];

        // Find the player
        const players = this.playerQuery.entities.filter(
            entity => entity instanceof ex.Actor && entity.name === 'Player'
        ) as ex.Actor[];

        if (players.length === 0) return;

        const player = players[0];

        // Check for collisions between player and modifier boxes
        for (const box of modifierBoxes) {
            if (this.isColliding(player, box)) {
                this.handleModifierPickup(player, box);
            }
        }
    }

    private isColliding(actor1: ex.Actor, actor2: ex.Actor): boolean {
        const distance = actor1.pos.distance(actor2.pos);
        const collisionDistance = 20; // Collision radius
        return distance <= collisionDistance;
    }

    private handleModifierPickup(player: ex.Actor, modifierBox: ex.Actor): void {
        // Get the modifier type from the box
        const modifierType = (modifierBox as any).getModifierType?.() as BulletModifierType;
        const modifierName = (modifierBox as any).getModifierName?.() as string;

        if (!modifierType) return;

        // Apply the modifier to the player
        this.applyModifierToPlayer(player, modifierType);

        // Show pickup notification
        this.showPickupNotification(player, modifierName);

        // Remove the modifier box
        modifierBox.kill();
    }

    private applyModifierToPlayer(player: ex.Actor, modifierType: BulletModifierType): void {
        // Store the modifier in the player's data
        // We'll use a custom property to track the player's current modifier
        (player as any).currentBulletModifier = modifierType;
        
        // You could also emit an event here if you prefer event-driven architecture
        player.emit('modifier-picked-up', { modifierType });
    }

    private showPickupNotification(player: ex.Actor, modifierName: string): void {
        // Create a temporary text actor to show the pickup notification
        const notification = new ex.Actor({
            pos: ex.vec(player.pos.x, player.pos.y - 40),
            width: 200,
            height: 20,
            z: 2000
        });

        const text = new ex.Text({
            text: `Picked up: ${modifierName}`,
            font: new ex.Font({
                family: 'Arial',
                size: 16,
                color: ex.Color.White,
                textAlign: ex.TextAlign.Center,
                baseAlign: ex.BaseAlign.Middle
            })
        });

        // Add shadow effect
        const shadowText = new ex.Text({
            text: `Picked up: ${modifierName}`,
            font: new ex.Font({
                family: 'Arial',
                size: 16,
                color: ex.Color.Black,
                textAlign: ex.TextAlign.Center,
                baseAlign: ex.BaseAlign.Middle
            })
        });

        const textGroup = new ex.GraphicsGroup({
            members: [
                { graphic: shadowText, offset: ex.vec(2, 2) },
                { graphic: text, offset: ex.vec(0, 0) }
            ]
        });

        notification.graphics.use(textGroup);
        this.world.add(notification);

        // Animate the notification
        const startY = notification.pos.y;
        const endY = startY - 30;
        const duration = 2000; // 2 seconds
        const startTime = Date.now();

        const animateNotification = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out animation
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            notification.pos.y = startY + (endY - startY) * easeProgress;
            notification.graphics.opacity = 1 - progress;
            
            if (progress < 1) {
                requestAnimationFrame(animateNotification);
            } else {
                notification.kill();
            }
        };

        animateNotification();
    }
}
