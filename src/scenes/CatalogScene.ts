import Phaser from 'phaser';
import { PALETA_HEX, SCENE_KEYS, FONT, GAME_HEIGHT } from '@/config';
import { ESPECIES } from '@/data/creatures';
import type { EspecieId } from '@/data/creatures';
import { GameState } from '@/state/GameState';

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

    const catalogo = GameState.datos.catalogo;
    let capturadas = 0;

    ORDEN_CATALOGO.forEach((id, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = START_X + col * CELL_W;
      const y = START_Y + row * CELL_H;

      const estado = catalogo[id];
      const especie = ESPECIES[id];

      const bgColor = estado === 'capturado' ? 0x8bac0f : estado === 'visto' ? 0x306230 : 0x0f380f;
      this.add.rectangle(x, y, CELL_W - 4, CELL_H - 4, bgColor).setOrigin(0, 0);

      if (estado) {
        // Fondo claro (capturado) → texto oscuro; fondo oscuro (visto) → texto claro
        const colorTexto = estado === 'capturado' ? PALETA_HEX.oscurisimo : PALETA_HEX.clarisimo;
        this.add.text(x + 4, y + 4, especie.nombre, {
          fontFamily: FONT, fontSize: '6px', color: colorTexto,
        });
        const tipoStr = especie.tipos.join('/');
        this.add.text(x + 4, y + 14, tipoStr, {
          fontFamily: FONT, fontSize: '6px', color: colorTexto,
        });
        const etiqueta = estado === 'capturado' ? '★ Capturado' : '? Visto';
        this.add.text(x + 4, y + 24, etiqueta, {
          fontFamily: FONT, fontSize: '6px', color: colorTexto,
        });
        if (estado === 'capturado') capturadas++;
      } else {
        this.add.text(x + 4, y + 14, '???', {
          fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.claro,
        });
      }
    });

    this.add.text(80, GAME_HEIGHT - 20, `Capturadas: ${capturadas}/${ORDEN_CATALOGO.length}`, {
      fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
    }).setOrigin(0.5, 0);

    this.add.text(80, GAME_HEIGHT - 10, 'Z para continuar', {
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
