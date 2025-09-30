import { ImageSource, Loader } from "excalibur";

// It is convenient to put your resources in one place
export const Resources = {
  // Character sprites - separate idle, walk, and run animations
  IdleSprite: new ImageSource('./images/character/idle.png'),
  WalkSprite: new ImageSource('./images/character/walk.png'),
  RunSprite: new ImageSource('./images/character/run.png'),
  
  // Tileset
  GrassTile: new ImageSource('./images/tileset/Grass_Middle.png'),
  CliffTile: new ImageSource('./images/tileset/Cliff_Tile.png'),
  
  // Decorations
  OakTree: new ImageSource('./images/deco/Oak_Tree.png'),
  
  // Old resources
  Sword: new ImageSource("./images/sword.png")
} as const; // the 'as const' is a neat typescript trick to get strong typing on your resources. 
// So when you type Resources.Sword -> ImageSource

// We build a loader and add all of our resources to the boot loader
// You can build your own loader by extending DefaultLoader
export const loader = new Loader();
for (const res of Object.values(Resources)) {
  loader.addResource(res);
}
