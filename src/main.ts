import './debug';
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PALETA_HEX } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { OverworldScene } from './scenes/OverworldScene';
import { BattleScene } from './scenes/BattleScene';
import { CatalogScene } from './scenes/CatalogScene';
import { LibretaScene } from './scenes/LibretaScene';
import { BiomeIntroScene } from './scenes/BiomeIntroScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  backgroundColor: PALETA_HEX.clarisimo,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, OverworldScene, BattleScene, CatalogScene, LibretaScene, BiomeIntroScene],
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
};

document.fonts.load('16px "Press Start 2P"').then(() => new Phaser.Game(config));
