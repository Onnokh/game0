import * as ex from "excalibur";
import { Player } from "../entities/player";
import { OakTree } from "../entities/oak-tree";
import { GameUI } from "../ui/game-ui";
import { Resources } from "../lib/resources";

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
        const oakTrees = [
            // Upper area trees
            new OakTree(100, 200),   // Far left, upper
            new OakTree(250, 150),   // Left side, upper
            new OakTree(400, 180),   // Center, upper
            new OakTree(550, 220),   // Right side, upper
            new OakTree(700, 160),   // Far right, upper
            
            // Middle area trees
            new OakTree(150, 400),   // Left side, middle
            new OakTree(300, 350),   // Left-center, middle
            new OakTree(500, 380),   // Right-center, middle
            new OakTree(650, 420),   // Right side, middle
            
            // Lower middle area (but not too close to bottom)
            new OakTree(200, 600),   // Left side, lower middle
            new OakTree(450, 580),   // Center, lower middle
            new OakTree(600, 620),   // Right side, lower middle
            
            // Scattered trees in middle-lower area
            new OakTree(350, 500),   // Left-center
            new OakTree(550, 480),   // Right-center
            new OakTree(100, 520),   // Far left
            new OakTree(750, 540),   // Far right
        ];
        
        // Add all trees to the scene
        oakTrees.forEach(tree => this.add(tree));
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

    override onPreDraw(ctx: ex.ExcaliburGraphicsContext, elapsedMs: number): void {
        // Called before Excalibur draws to the screen
    }

    override onPostDraw(ctx: ex.ExcaliburGraphicsContext, elapsedMs: number): void {
        // Called after Excalibur draws to the screen
    }
}