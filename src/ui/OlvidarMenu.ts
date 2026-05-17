import Phaser from 'phaser';
import { PALETA_HEX, FONT } from '@/config';
import type { EstadoMovimiento } from '@/entities/Criatura';
import type { Movimiento } from '@/data/moves';

// Posiciones dentro del panel UI (y: 176–240, h: 64)
const PANEL_Y = 176;
const HEADER1_Y = 179;
const HEADER2_Y = 188;
const ITEM_Y0 = 199;
const ITEM_STEP = 8;
const CURSOR_X = 4;
const TEXT_X = 14;

export class OlvidarMenu {
  private bg!: Phaser.GameObjects.Rectangle;
  private header1!: Phaser.GameObjects.Text;
  private header2!: Phaser.GameObjects.Text;
  private items: Phaser.GameObjects.Text[] = [];
  private cursor!: Phaser.GameObjects.Text;

  private seleccion = 0;
  private onConfirmar: ((slot: number | null) => void) | null = null;

  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    confirm: Phaser.Input.Keyboard.Key;
    cancel: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene) {
    const DEPTH = 300;

    this.bg = scene.add
      .rectangle(0, PANEL_Y, 320, 64, 0x1a1410)
      .setOrigin(0, 0)
      .setDepth(DEPTH)
      .setScrollFactor(0);

    this.header1 = scene.add
      .text(TEXT_X, HEADER1_Y, '', { fontFamily: FONT, fontSize: '7px', color: PALETA_HEX.clarisimo })
      .setDepth(DEPTH + 1)
      .setScrollFactor(0);

    this.header2 = scene.add
      .text(TEXT_X, HEADER2_Y, '¿Cuál olvidás?', { fontFamily: FONT, fontSize: '7px', color: PALETA_HEX.clarisimo })
      .setDepth(DEPTH + 1)
      .setScrollFactor(0);

    for (let i = 0; i < 5; i++) {
      const t = scene.add
        .text(TEXT_X, ITEM_Y0 + i * ITEM_STEP, '', { fontFamily: FONT, fontSize: '7px', color: PALETA_HEX.clarisimo })
        .setDepth(DEPTH + 1)
        .setScrollFactor(0);
      this.items.push(t);
    }

    this.cursor = scene.add
      .text(CURSOR_X, ITEM_Y0, '▶', { fontFamily: FONT, fontSize: '7px', color: PALETA_HEX.clarisimo })
      .setDepth(DEPTH + 1)
      .setScrollFactor(0);

    const kb = scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      confirm: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      cancel: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
    };

    this.setVisible(false);
  }

  mostrar(
    movActuales: EstadoMovimiento[],
    movNuevo: Movimiento,
    onConfirmar: (slot: number | null) => void,
  ): void {
    this.onConfirmar = onConfirmar;
    this.seleccion = 0;

    const nuevoPoderStr = movNuevo.poder > 0 ? `P${movNuevo.poder}` : '-';
    this.header1.setText(`Nuevo: ${movNuevo.nombre} (${movNuevo.tipo}) ${nuevoPoderStr}`);

    movActuales.forEach((m, i) => {
      const poderStr = m.movimiento.poder > 0 ? `P${m.movimiento.poder}` : '-';
      this.items[i]?.setText(`${m.movimiento.nombre} (${m.movimiento.tipo}) ${poderStr}`);
    });
    this.items[4]?.setText('NO APRENDER');

    this.actualizarCursor();
    this.setVisible(true);
  }

  update(): void {
    if (!this.bg.visible) return;

    const total = 5;
    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      this.seleccion = (this.seleccion - 1 + total) % total;
      this.actualizarCursor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      this.seleccion = (this.seleccion + 1) % total;
      this.actualizarCursor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm)) {
      this.setVisible(false);
      this.onConfirmar?.(this.seleccion === 4 ? null : this.seleccion);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.cancel)) {
      this.setVisible(false);
      this.onConfirmar?.(null);
    }
  }

  setVisible(v: boolean): void {
    this.bg.setVisible(v);
    this.header1.setVisible(v);
    this.header2.setVisible(v);
    this.items.forEach((t) => t.setVisible(v));
    this.cursor.setVisible(v);
  }

  private actualizarCursor(): void {
    this.cursor.setY(ITEM_Y0 + this.seleccion * ITEM_STEP);
  }
}
