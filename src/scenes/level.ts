import * as ex from "excalibur";
import { Player } from "../entities/player";
import { OakTree } from "../entities/oak-tree";
import { Rock } from "../entities/rock";
import { GameUI } from "../ui/game-ui";
import { Resources } from "../lib/resources";
import { DebugManager } from "../lib/debug-manager";
import { Weapon } from "../entities/weapon";
import { WeaponType } from "../components/weapon-stats-component";
import { Ammo } from "../entities/ammo";
import { ModifierBox } from "../entities/modifier-box";
import { BulletModifierType } from "../components/bullet-modifier-component";
import { InteractionSystem } from "../systems/interaction-system";
import { BulletSystem } from "../systems/bullet-system";
import { DamageNumberSystem } from "../systems/damage-number-system";
import { HealthSystem } from "../systems/health-system";
import { ModifierSystem } from "../systems/modifier-system";
import { ModifierPickupSystem } from "../systems/modifier-pickup-system";
import { StatusEffectSystem } from "../systems/status-effect-system";
import { StatusEffectVisualSystem } from "../systems/status-effect-visual-system";
import { EnemyDeathCleanupSystem } from "../systems/enemy-death-cleanup-system";
import { PunchSystem } from "../systems/punch-system";
import { LevelRoundsConfig, RoundManager } from "../lib/rounds";

export class MyLevel extends ex.Scene {
    private player!: Player;
    private gameUI!: GameUI;
    private debugManager!: DebugManager;
    private roundManager!: RoundManager;

    override onInitialize(engine: ex.Engine): void {
        // Add ECS systems
        this.world.add(new InteractionSystem(this.world));
        this.world.add(new BulletSystem(this.world));
        this.world.add(new ModifierSystem(this.world));
        this.world.add(new ModifierPickupSystem(this.world));
        this.world.add(new StatusEffectSystem(this.world));
        this.world.add(new StatusEffectVisualSystem(this.world));
        this.world.add(new EnemyDeathCleanupSystem(this.world));
        this.world.add(new DamageNumberSystem(this.world));
        this.world.add(new HealthSystem(this.world));
        const punchSystem = new PunchSystem(this.world);
        this.world.add(punchSystem);
        
        // Create player instance
        this.player = new Player();
        this.add(this.player);
        
        // Create and add UI
        this.gameUI = new GameUI();
        this.gameUI.addToScene(this);
        
        // Connect player to UI
        this.player.setGameUI(this.gameUI);
        
        // Connect player to punch system
        this.player.setPunchSystem(punchSystem);
        
        
        // Create and add debug manager
        this.debugManager = new DebugManager();
        this.debugManager.setPlayer(this.player);
        this.add(this.debugManager);
        
        // Set up camera to follow the player
        this.camera.strategy.lockToActor(this.player);
        
        // Create grass tile background
        const tileSize = 16;
        const tilesX = Math.ceil(engine.drawWidth / tileSize);
        const tilesY = Math.ceil((engine.drawHeight * 2) / tileSize); // Double the height
        
        // Create a tilemap for the grass background
        const grassTilemap = new ex.TileMap({
            pos: ex.vec(0, 0),
            tileWidth: tileSize,
            tileHeight: tileSize,
            rows: tilesY,
            columns: tilesX
        });
        
        // Create sprites
        const grassSprite = Resources.GrassTile.toSprite();
        
        // Create cliff sprite sheet (48x96 image = 3x6 grid of 16x16 tiles)
        const cliffSpriteSheet = ex.SpriteSheet.fromImageSource({
            image: Resources.CliffTile,
            grid: {
                rows: 6,
                columns: 3,
                spriteWidth: 16,
                spriteHeight: 16
            }
        });
        
        // Fill the tilemap with grass and cliff tiles
        for (let x = 0; x < tilesX; x++) {
            for (let y = 0; y < tilesY; y++) {
                const tile = grassTilemap.getTile(x, y);
                if (!tile) continue;
                
                // Check if this is an edge tile
                const isTopEdge = y === 0;
                const isBottomEdge = y === tilesY - 1;
                const isLeftEdge = x === 0;
                const isRightEdge = x === tilesX - 1;
                
                // Determine if this tile should have collision (all edge tiles)
                const isCollidable = isTopEdge || isBottomEdge || isLeftEdge || isRightEdge;
                
                // Determine which sprite to use
                if (isTopEdge && isLeftEdge) {
                    // Top-left corner
                    tile.addGraphic(cliffSpriteSheet.getSprite(0, 0));
                } else if (isTopEdge && isRightEdge) {
                    // Top-right corner
                    tile.addGraphic(cliffSpriteSheet.getSprite(2, 0));
                } else if (isBottomEdge && isLeftEdge) {
                    // Bottom-left corner
                    tile.addGraphic(cliffSpriteSheet.getSprite(0, 2));
                } else if (isBottomEdge && isRightEdge) {
                    // Bottom-right corner
                    tile.addGraphic(cliffSpriteSheet.getSprite(2, 2));
                } else if (isTopEdge) {
                    // Top edge
                    tile.addGraphic(cliffSpriteSheet.getSprite(1, 0));
                } else if (isBottomEdge) {
                    // Bottom edge
                    tile.addGraphic(cliffSpriteSheet.getSprite(1, 2));
                } else if (isLeftEdge) {
                    // Left edge
                    tile.addGraphic(cliffSpriteSheet.getSprite(0, 1));
                } else if (isRightEdge) {
                    // Right edge
                    tile.addGraphic(cliffSpriteSheet.getSprite(2, 1));
                } else {
                    // Interior - use grass
                    tile.addGraphic(grassSprite);
                }
                
                // Set collision type for edge tiles
                if (isCollidable) {
                    tile.solid = true;
                }
            }
        }
        
        // Add tilemap to scene at the lowest z-index so it appears behind everything
        grassTilemap.z = -1;
        this.add(grassTilemap);
        
        // Set camera bounds to match the tilemap size (twice as high)
        const mapWidth = tilesX * tileSize;
        const mapHeight = tilesY * tileSize;
        const boundingBox = new ex.BoundingBox(0, 0, mapWidth, mapHeight);
        this.camera.strategy.limitCameraBounds(boundingBox);
        
        // Add oak trees as decorations (keeping bottom area clear for player)
        // All positions aligned to 16px grid, shifted down by half a tile (8px)
        const oakTrees = [
            // Upper area trees
            new OakTree(96, 200),    // Far left, upper (192->200)
            new OakTree(256, 152),   // Left side, upper (144->152)
            new OakTree(400, 184),   // Center, upper (176->184)
            new OakTree(544, 216),   // Right side, upper (208->216)
            new OakTree(704, 168),   // Far right, upper (160->168)
            
            // Middle area trees
            new OakTree(144, 408),   // Left side, middle (400->408)
            new OakTree(304, 360),   // Left-center, middle (352->360)
            new OakTree(496, 392),   // Right-center, middle (384->392)
            new OakTree(656, 424),   // Right side, middle (416->424)
            
            // Lower middle area (but not too close to bottom)
            new OakTree(192, 600),   // Left side, lower middle (592->600)
            new OakTree(448, 584),   // Center, lower middle (576->584)
            new OakTree(592, 632),   // Right side, lower middle (624->632)
            
            // Scattered trees in middle-lower area
            new OakTree(352, 504),   // Left-center (496->504)
            new OakTree(544, 488),   // Right-center (480->488)
            new OakTree(96, 520),    // Far left (512->520)
            new OakTree(752, 552),   // Far right (544->552)

            new OakTree(360, 904),   // Far right (544->552)

        ];
        
        // Add all trees to the scene
        oakTrees.forEach(tree => this.add(tree));
        
        // Add rocks scattered across the map at specific coordinates
        const rocks = [
            // Upper area rocks
            new Rock(80, 160, 0),
            new Rock(240, 192, 1),
            new Rock(432, 176, 0),
            new Rock(608, 208, 1),
            new Rock(720, 144, 0),
            
            // Middle area rocks
            new Rock(112, 352, 1),
            new Rock(288, 384, 0),
            new Rock(464, 368, 1),
            new Rock(640, 400, 0),
            new Rock(752, 352, 1),
            
            // Lower middle area rocks
            new Rock(144, 560, 0),
            new Rock(336, 592, 1),
            new Rock(512, 576, 0),
            new Rock(688, 608, 1),
            
            // Bottom area rocks
            new Rock(96, 752, 1),
            new Rock(304, 784, 0),
            new Rock(496, 768, 1),
            new Rock(656, 800, 0),
            new Rock(736, 752, 1),
            
            // Very bottom area rocks
            new Rock(192, 928, 0),
        ];
        
        // Add all rocks to the scene
        rocks.forEach(rock => this.add(rock));
        
        // Add other weapons with types - showcase all weapon types with different sprites
        const ak47 = new Weapon(200, 1104, WeaponType.AssaultRifle);
        const shotgun = new Weapon(350, 1104, WeaponType.Shotgun);
        const smg = new Weapon(650, 1104, WeaponType.SMG);
        this.add(ak47);
        this.add(shotgun);
        this.add(smg);
        
        // Add ammo pickups near weapons
        const ammoPickups = [
            new Ammo(180, 1072, WeaponType.AssaultRifle, 60),  // Near AK-47
            new Ammo(330, 1072, WeaponType.Shotgun, 24),       // Near Shotgun
            new Ammo(630, 1072, WeaponType.SMG, 75),           // Near SMG
            new Ammo(450, 1072, WeaponType.Pistol, 36),        // Pistol ammo in center
            new Ammo(100, 1072, WeaponType.AssaultRifle, 90),  // Extra assault rifle ammo
        ];
        ammoPickups.forEach(ammo => this.add(ammo));
        
        // Add modifier boxes scattered around the map - one of each type
        const modifierBoxes = [
            new ModifierBox(ex.vec(180, 1000), BulletModifierType.FIRE),  
            new ModifierBox(ex.vec(400, 1000), BulletModifierType.LIGHTNING),   
            new ModifierBox(ex.vec(600, 1000), BulletModifierType.ICE),   
            new ModifierBox(ex.vec(300, 1000), BulletModifierType.POISON),  
        ];
        modifierBoxes.forEach(box => this.add(box));
        
        // Rounds configuration placeholder
        const roundsConfig: LevelRoundsConfig = {
            autoAdvance: true,
            interRoundDelayMs: 1000,
            rounds: [
                {
                    spawns: [
                        { type: "default", count: 3, cadenceMs: 0, area: { x: 120, y: 640, width: 600, height: 300 } }
                    ]
                },
                {
                    spawns: [
                        { type: "default", count: 5, cadenceMs: 400, area: { x: 120, y: 640, width: 600, height: 300 } }
                    ]
                }
            ]
        };

        // Initialize round manager with punch system
        this.roundManager = new RoundManager(this, this.player, roundsConfig, punchSystem);

        // Example of listening to round events
        this.on("roundStart", (e: any) => {
            console.log(`Round ${e.round} started`);
            this.updateRoundUI();
        });
        this.on("roundClear", (e: any) => {
            console.log(`Round ${e.round} cleared`);
            this.updateRoundUI();
        });
        this.on("allRoundsComplete", () => {
            console.log("All rounds complete!");
            this.updateRoundUI();
        });

        // Update UI on enemy death
        this.on("enemyDied", () => {
            this.updateRoundUI();
        });

        // Start first round after a small delay to ensure UI is fully initialized
        const startTimer = new ex.Timer({
            interval: 100,
            repeats: false,
            fcn: () => {
                this.roundManager.startFirstRound();
            }
        });
        this.add(startTimer);
        startTimer.start();
        
    }

    override onPreLoad(loader: ex.DefaultLoader): void {
        // Add any scene specific resources to load
    }

    override onActivate(context: ex.SceneActivationContext<unknown>): void {
        // Called when Excalibur transitions to this scene
        // Only 1 scene is active at a time
        
        // Give player a starting pistol (after scene is fully activated and UI is ready)
        const startingPistol = new Weapon(0, 0, WeaponType.Pistol);
        this.player.equipWeapon(startingPistol);
    }

    override onPreUpdate(engine: ex.Engine, delta: number): void {
        // Handle manual round advance (N key)
        if (engine.input.keyboard.wasPressed(ex.Keys.KeyN)) {
            this.roundManager.startNextRound();
        }
    }

    private updateRoundUI(): void {
        if (this.gameUI && this.roundManager) {
            this.gameUI.updateRoundInfo(this.roundManager.getCurrentRoundNumber(), this.roundManager.getRemainingEnemies());
        }
    }

    override onDeactivate(context: ex.SceneActivationContext): void {
        // Called when Excalibur transitions away from this scene
        // Only 1 scene is active at a time
    }


    override onPostUpdate(engine: ex.Engine, elapsedMs: number): void {
        // Called after everything updates in the scene
    }

    override onPostDraw(ctx: ex.ExcaliburGraphicsContext, elapsedMs: number): void {
        // Called after Excalibur draws to the screen
        // Let the debug manager draw its overlay
        this.debugManager.drawDebugOverlay(ctx);
    }
}