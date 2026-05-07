import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCALE, PALETA_HEX } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { OverworldScene } from './scenes/OverworldScene';
import { BattleScene } from './scenes/BattleScene';
import { CatalogScene } from './scenes/CatalogScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  zoom: SCALE,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: PALETA_HEX.clarisimo,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, OverworldScene, BattleScene, CatalogScene],
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
};

document.fonts.ready.then(() => new Phaser.Game(config));
