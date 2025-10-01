import { ImageSource, DefaultLoader, FontSource } from "excalibur";

export const Resources = {
  // Character sprites - new unified animation sheet
  CharacterAnimationSheet: new ImageSource('./images/character/new/AnimationSheet.png'),
  
  // Enemy sprites
  SkeletonSprite: new ImageSource('./images/enemies/skeleton/Skeleton.png'),
  
  // Tileset
  GrassTile: new ImageSource('./images/tileset/Grass_Middle.png'),
  CliffTile: new ImageSource('./images/tileset/Cliff_Tile.png'),
  
  // Decorations
  OakTree: new ImageSource('./images/deco/Oak_Tree.png'),
  OutdoorDecorFree: new ImageSource('./images/deco/Outdoor_Decor_Free.png'),

  // Weapons
  AssaultRifle: new ImageSource('./images/guns/Assaut-rifle-2.png'),
  Shotgun: new ImageSource('./images/guns/Shotgun-2.png'),
  Pistol: new ImageSource('./images/guns/Pistol-3.png'),
  SMG: new ImageSource('./images/guns/SMG-4.png'),

  // Ammo sprites
  Ammo1: new ImageSource('./images/guns/Amo1.png'),
  Ammo2: new ImageSource('./images/guns/Amo2.png'),
  Ammo3: new ImageSource('./images/guns/Amo3.png'),
  Ammo4: new ImageSource('./images/guns/Amo4.png'),

  // Punch sprites
  PunchSprite1: new ImageSource('./images/punch/FX046_01.png'),
  PunchSprite2: new ImageSource('./images/punch/FX046_02.png'),
  PunchSprite3: new ImageSource('./images/punch/FX046_03.png'),

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
