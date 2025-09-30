import { ImageSource, DefaultLoader } from "excalibur";

export const Resources = {
  // Character sprites - separate idle, walk, and run animations
  IdleSprite: new ImageSource('./images/character/idle.png'),
  WalkSprite: new ImageSource('./images/character/walk.png'),
  RunSprite: new ImageSource('./images/character/run.png'),
  
  // Enemy sprites
  SkeletonSprite: new ImageSource('./images/enemies/skeleton/Skeleton.png'),
  
  // Tileset
  GrassTile: new ImageSource('./images/tileset/Grass_Middle.png'),
  CliffTile: new ImageSource('./images/tileset/Cliff_Tile.png'),
  
  // Decorations
  OakTree: new ImageSource('./images/deco/Oak_Tree.png'),

  // Weapons
  Weapon: new ImageSource('./images/assets/gun.png'),

} as const;

// Custom loader that suppresses the play button
class NoPlayButtonLoader extends DefaultLoader {
  override async onUserAction(): Promise<void> {
    // Automatically resolve without waiting for user input
    // This suppresses the play button
    return Promise.resolve();
  }
}

// We build a loader and add all of our resources to the boot loader
export const loader = new NoPlayButtonLoader();
for (const res of Object.values(Resources)) {
  loader.addResource(res);
}
