import { CANVAS } from './config/layout';

export { CANVAS } from './config/layout';

export const GAME_WIDTH = CANVAS.WIDTH;
export const GAME_HEIGHT = CANVAS.HEIGHT;
export const SCALE = CANVAS.SCALE;
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

// Punto de reaparición por bioma. En el futuro apuntará a la veterinaria más cercana.
export const RESPAWN_POR_BIOMA: Record<string, { x: number; y: number }> = {
  pampa: { x: 2, y: 15 },
};
