export const CANVAS = {
  WIDTH: 160,
  HEIGHT: 144,
  SCALE: 4,
} as const;

export const BATTLE_LAYOUT = {
  COMBAT_ZONE: { x: 0, y: 0, w: 160, h: 96 },
  GROUND_STRIP: { x: 0, y: 96, w: 160, h: 8 },
  UI_PANEL: { x: 0, y: 104, w: 160, h: 40 },
  RIVAL: {
    SPRITE_POS: { x: 128, y: 36 },
    SPRITE_SIZE: 64,
    INFO_POS: { x: 4, y: 4 },
    HP_BAR_OFFSET_Y: 10,
    HP_TEXT_OFFSET_Y: 18,
  },
  ALLY: {
    SPRITE_POS: { x: 36, y: 76 },
    SPRITE_SIZE: 56,
    INFO_POS: { x: 88, y: 70 },
    HP_BAR_OFFSET_Y: 10,
    HP_TEXT_OFFSET_Y: 18,
  },
} as const;

export const DIALOG_LAYOUT = {
  BOX_Y: 104,
  TEXT_OFFSET_X: 8,
  TEXT_OFFSET_Y: 6,
  WORD_WRAP_WIDTH: 144,
  CHAR_DELAY_MS: 30,
} as const;

export const BATTLE_MENU_LAYOUT = {
  ITEM_X: 70,
  CURSOR_X: 62,
  ITEM_Y0: 107,
  ITEM_STEP: 9,
} as const;

export const MOVE_MENU_LAYOUT = {
  ROW0_Y: 107,
  ROW_STEP: 16,
  COL0_X: 10,
  COL_STEP: 80,
  CURSOR_OFFSET_X: -6,
} as const;

export const ITEM_MENU_LAYOUT = {
  ITEM_X: 14,
  CURSOR_X: 4,
  ITEM_Y0: 107,
  ITEM_STEP: 11,
} as const;

export const OVERWORLD_LAYOUT = {
  DEBUG_TEXT_POS: { x: 2, y: 2 },
  DIALOG_BOX: { x: 0, y: 104, w: 160, h: 40 },
  DIALOG_TEXT_POS: { x: 4, y: 108 },
  SHOP_OPTION_SI: { x: 96, y: 130 },
  SHOP_OPTION_NO: { x: 120, y: 130 },
} as const;

export const MENU_LAYOUT = {
  TITLE_Y: 40,
  SUBTITLE_Y: 70,
  PRESS_START_OFFSET_FROM_BOTTOM: 40,
} as const;

export const CATALOG_LAYOUT = {
  COLS: 2,
  CELL_W: 72,
  CELL_H: 40,
  START_X: 8,
  START_Y: 32,
  TITLE_Y: 8,
  SUBTITLE_Y: 18,
  FOOTER_OFFSET_FROM_BOTTOM: 20,
  FOOTER2_OFFSET_FROM_BOTTOM: 10,
} as const;
