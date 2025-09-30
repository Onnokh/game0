import * as ex from "excalibur";
import { Player } from "../entities/player";
import { OakTree } from "../entities/oak-tree";
import { Enemy } from "../entities/enemy";
import { GameUI } from "../ui/game-ui";
import { Resources } from "../lib/resources";
import { debugMode } from "../main";

export class MyLevel extends ex.Scene {
    private player!: Player;
    private gameUI!: GameUI;

    override onInitialize(engine: ex.Engine): void {
        // Create player instance
        this.player = new Player();
        this.add(this.player);
        
        // Create and add UI
        this.gameUI = new GameUI();
        this.gameUI.setPlayer(this.player);
        this.gameUI.addToScene(this);
        
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
        ];
        
        // Add all trees to the scene
        oakTrees.forEach(tree => this.add(tree));
        
        // Create enemy next to the player (to the right) - aligned to 16px grid
        const enemy = new Enemy(448, 1104); // 48 pixels to the right of player (448 vs 400)
        enemy.setPlayer(this.player);
        this.add(enemy);
    }

    override onPreLoad(loader: ex.DefaultLoader): void {
        // Add any scene specific resources to load
    }

    override onActivate(context: ex.SceneActivationContext<unknown>): void {
        // Called when Excalibur transitions to this scene
        // Only 1 scene is active at a time
    }

    override onDeactivate(context: ex.SceneActivationContext): void {
        // Called when Excalibur transitions away from this scene
        // Only 1 scene is active at a time
    }

    override onPreUpdate(engine: ex.Engine, elapsedMs: number): void {
        // Called before anything updates in the scene
    }

    override onPostUpdate(engine: ex.Engine, elapsedMs: number): void {
        // Called after everything updates in the scene
        // Update the UI with current velocity
        this.gameUI.updateVelocityDisplay();
    }

    override onPostDraw(ctx: ex.ExcaliburGraphicsContext, elapsedMs: number): void {
        // Called after Excalibur draws to the screen
        
        // Only draw debug grid when debug mode is enabled
        if (!debugMode) return;
        
        // Draw debug grid
        const tileSize = 16;
        const mapWidth = Math.ceil(ctx.width / tileSize) * tileSize;
        const mapHeight = Math.ceil(ctx.height / tileSize) * tileSize;
        
        // Draw vertical lines
        for (let x = 0; x <= mapWidth; x += tileSize) {
            ex.Debug.drawLine(
                ex.vec(x, 0),
                ex.vec(x, mapHeight),
                { color: ex.Color.fromHex("#333333") }
            );
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= mapHeight; y += tileSize) {
            ex.Debug.drawLine(
                ex.vec(0, y),
                ex.vec(mapWidth, y),
                { color: ex.Color.fromHex("#333333") }
            );
        }
    }
}