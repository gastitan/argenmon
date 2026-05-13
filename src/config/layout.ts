export const CANVAS = {
  WIDTH: 320,
  HEIGHT: 240,
  SCALE: 2,
} as const;

export const BATTLE_LAYOUT = {
  COMBAT_ZONE: { x: 0, y: 0, w: 320, h: 160 },
  GROUND_STRIP: { x: 0, y: 160, w: 320, h: 16 },
  UI_PANEL: { x: 0, y: 176, w: 320, h: 64 },
  RIVAL: {
    SPRITE_POS: { x: 208, y: 32 },   // top-left; sprite ocupa (208,32)→(304,128)
    SPRITE_SIZE: 96,
    INFO_POS: { x: 8, y: 8 },
    HP_BAR_OFFSET_Y: 14,
    HP_TEXT_OFFSET_Y: 26,
  },
  ALLY: {
    SPRITE_POS: { x: 16, y: 64 },    // top-left; sprite ocupa (16,64)→(112,160), borde inferior sobre la franja de suelo
    SPRITE_SIZE: 96,
    INFO_POS: { x: 176, y: 120 },
    HP_BAR_OFFSET_Y: 14,
    HP_TEXT_OFFSET_Y: 26,
  },
} as const;

export const DIALOG_LAYOUT = {
  BOX_Y: 176,
  TEXT_OFFSET_X: 8,
  TEXT_OFFSET_Y: 8,
  WORD_WRAP_WIDTH: 300,
  CHAR_DELAY_MS: 30,
} as const;

export const BATTLE_MENU_LAYOUT = {
  ITEM_X: 220,
  CURSOR_X: 210,
  ITEM_Y0: 184,
  ITEM_STEP: 14,
} as const;

export const MOVE_MENU_LAYOUT = {
  ROW0_Y: 184,
  ROW_STEP: 26,
  COL0_X: 8,
  COL_STEP: 156,
  CURSOR_OFFSET_X: -8,
} as const;

export const ITEM_MENU_LAYOUT = {
  ITEM_X: 16,
  CURSOR_X: 8,
  ITEM_Y0: 184,
  ITEM_STEP: 16,
} as const;

export const OVERWORLD_LAYOUT = {
  DEBUG_TEXT_POS: { x: 2, y: 2 },
  DIALOG_BOX: { x: 0, y: 176, w: 320, h: 64 },
  DIALOG_TEXT_POS: { x: 8, y: 184 },
  SHOP_OPTION_SI: { x: 196, y: 222 },
  SHOP_OPTION_NO: { x: 256, y: 222 },
} as const;

export const MENU_LAYOUT = {
  TITLE_Y: 90,
  SUBTITLE_Y: 120,
  PRESS_START_OFFSET_FROM_BOTTOM: 40,
} as const;

export const CATALOG_LAYOUT = {
  COLS: 2,
  CELL_W: 154,        // paso entre columnas; celda real = 150px de ancho
  CELL_H: 60,         // paso entre filas; celda real = 56px de alto
  START_X: 6,
  START_Y: 36,
  TITLE_Y: 8,
  SUBTITLE_Y: 22,
  FOOTER_OFFSET_FROM_BOTTOM: 20,
  FOOTER2_OFFSET_FROM_BOTTOM: 10,
} as const;
