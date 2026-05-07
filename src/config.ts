export const GAME_WIDTH = 160;
export const GAME_HEIGHT = 144;
export const SCALE = 4;
export const TILE_SIZE = 16;

export const PALETA = {
  oscurisimo: 0x0f380f,
  oscuro: 0x306230,
  claro: 0x8bac0f,
  clarisimo: 0x9bbc0f,
} as const;

export const PALETA_HEX = {
  oscurisimo: '#0f380f',
  oscuro: '#306230',
  claro: '#8bac0f',
  clarisimo: '#9bbc0f',
} as const;

export const FONT = '"Press Start 2P"';

export const MOVE_DURATION_MS = 180;

export const SCENE_KEYS = {
  Boot: 'BootScene',
  Menu: 'MenuScene',
  Overworld: 'OverworldScene',
  Battle: 'BattleScene',
  Catalog: 'CatalogScene',
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
