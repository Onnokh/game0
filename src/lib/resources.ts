import { ImageSource, DefaultLoader, FontSource } from "excalibur";

export const Resources = {
  // Character sprites - separate idle, walk, run, and jump animations
  IdleSprite: new ImageSource('./images/character/idle.png'),
  WalkSprite: new ImageSource('./images/character/walk.png'),
  RunSprite: new ImageSource('./images/character/run.png'),
  JumpSprite: new ImageSource('./images/character/jump.png'),
  
  // Enemy sprites
  SkeletonSprite: new ImageSource('./images/enemies/skeleton/Skeleton.png'),
  
  // Tileset
  GrassTile: new ImageSource('./images/tileset/Grass_Middle.png'),
  CliffTile: new ImageSource('./images/tileset/Cliff_Tile.png'),
  
  // Decorations
  OakTree: new ImageSource('./images/deco/Oak_Tree.png'),

  // Weapons
  AssaultRifle: new ImageSource('./images/guns/Assaut-rifle-2.png'),
  Shotgun: new ImageSource('./images/guns/Shotgun-2.png'),
  Pistol: new ImageSource('./images/guns/Pistol-3.png'),
  SMG: new ImageSource('./images/guns/SMG-4.png'),

  // Fonts
  DeterminationFont: new FontSource('./web/determination.ttf', 'Determination'),

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
