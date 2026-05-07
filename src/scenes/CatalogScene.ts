import Phaser from 'phaser';
import { PALETA_HEX, SCENE_KEYS, FONT } from '@/config';
import { ESPECIES } from '@/data/creatures';
import type { EspecieId } from '@/data/creatures';
import { playerState } from '@/data/playerState';

const ORDEN_CATALOGO: EspecieId[] = ['hornero', 'mara', 'vizcacha', 'nandu', 'peludo', 'yarara'];
const COLS = 2;
const CELL_W = 72;
const CELL_H = 40;
const START_X = 8;
const START_Y = 32;

export class CatalogScene extends Phaser.Scene {
  private keyZ!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENE_KEYS.Catalog);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETA_HEX.clarisimo);

    this.add.text(80, 8, '¡Catálogo pampeano!', {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    }).setOrigin(0.5, 0);

    this.add.text(80, 18, '¡Venciste al Capataz!', {
      fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscuro,
    }).setOrigin(0.5, 0);

    let capturadas = 0;
    ORDEN_CATALOGO.forEach((id, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = START_X + col * CELL_W;
      const y = START_Y + row * CELL_H;

      const estado = playerState.catalogo[id];
      const especie = ESPECIES[id];

      const bgColor = estado === 'capturado' ? 0x8bac0f : estado === 'visto' ? 0x306230 : 0x0f380f;
      this.add.rectangle(x, y, CELL_W - 4, CELL_H - 4, bgColor).setOrigin(0, 0);

      if (estado) {
        this.add.text(x + 4, y + 4, especie.nombre, {
          fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.clarisimo,
        });
        const tipoStr = especie.tipos.join('/');
        this.add.text(x + 4, y + 14, tipoStr, {
          fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.clarisimo,
        });
        const etiqueta = estado === 'capturado' ? '★ Capturado' : '? Visto';
        this.add.text(x + 4, y + 24, etiqueta, {
          fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.clarisimo,
        });
        if (estado === 'capturado') capturadas++;
      } else {
        this.add.text(x + 4, y + 14, '???', {
          fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscuro,
        });
      }
    });

    const total = ORDEN_CATALOGO.length;
    this.add.text(80, 160 - 20, `Capturadas: ${capturadas}/${total}`, {
      fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
    }).setOrigin(0.5, 0);

    this.add.text(80, 160 - 10, 'Z para continuar', {
      fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscuro,
    }).setOrigin(0.5, 0);

    this.keyZ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
      this.scene.start(SCENE_KEYS.Overworld);
    }
  }
}
