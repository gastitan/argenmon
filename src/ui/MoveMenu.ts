import Phaser from 'phaser';
import { PALETA_HEX, FONT } from '@/config';
import { MOVE_MENU_LAYOUT } from '@/config/layout';
import type { EstadoMovimiento } from '@/entities/Criatura';

export class MoveMenu {
  private items: Phaser.GameObjects.Text[] = [];
  private cursor!: Phaser.GameObjects.Text;
  private seleccion = 0;
  private movimientos: EstadoMovimiento[] = [];
  private onConfirmar: ((idx: number) => void) | null = null;
  private onCancelar: (() => void) | null = null;
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    confirm: Phaser.Input.Keyboard.Key;
    cancel: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene) {
    const { COL0_X, COL_STEP, ROW0_Y, ROW_STEP, CURSOR_OFFSET_X } = MOVE_MENU_LAYOUT;
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const t = scene.add
        .text(COL0_X + col * COL_STEP, ROW0_Y + row * ROW_STEP, '', {
          fontFamily: FONT,
          fontSize: '5px',
          color: PALETA_HEX.oscurisimo,
        })
        .setScrollFactor(0)
        .setDepth(202);
      this.items.push(t);
    }

    this.cursor = scene.add
      .text(COL0_X + CURSOR_OFFSET_X, ROW0_Y, '▶', {
        fontFamily: FONT,
        fontSize: '5px',
        color: PALETA_HEX.oscurisimo,
      })
      .setScrollFactor(0)
      .setDepth(202);

    scene.time.addEvent({
      delay: 256,
      loop: true,
      callback: () => { if (this.items[0].visible) this.cursor.setVisible(!this.cursor.visible); },
    });

    const kb = scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      confirm: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      cancel: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
    };

    this.setVisible(false);
  }

  mostrar(
    movimientos: EstadoMovimiento[],
    onConfirmar: (idx: number) => void,
    onCancelar: () => void,
  ): void {
    this.movimientos = movimientos;
    this.seleccion = 0;
    this.onConfirmar = onConfirmar;
    this.onCancelar = onCancelar;

    movimientos.forEach((m, i) => {
      if (this.items[i]) {
        this.items[i].setText(`${m.movimiento.nombre}\nPP ${m.ppActual}/${m.movimiento.pp}`);
      }
    });

    this.actualizarCursor();
    this.setVisible(true);
  }

  update(): void {
    if (!this.items[0].visible) return;

    const total = this.movimientos.length;
    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      this.seleccion = (this.seleccion - 2 + total) % total;
      this.actualizarCursor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      this.seleccion = (this.seleccion + 2) % total;
      this.actualizarCursor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
      this.seleccion = (this.seleccion - 1 + total) % total;
      this.actualizarCursor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
      this.seleccion = (this.seleccion + 1) % total;
      this.actualizarCursor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm)) {
      this.setVisible(false);
      this.onConfirmar?.(this.seleccion);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.cancel)) {
      this.setVisible(false);
      this.onCancelar?.();
    }
  }

  setVisible(v: boolean): void {
    this.cursor.setVisible(v);
    this.items.forEach((t) => t.setVisible(v));
  }

  private actualizarCursor(): void {
    const { COL0_X, COL_STEP, ROW0_Y, ROW_STEP, CURSOR_OFFSET_X } = MOVE_MENU_LAYOUT;
    const col = this.seleccion % 2;
    const row = Math.floor(this.seleccion / 2);
    this.cursor.setPosition(COL0_X + CURSOR_OFFSET_X + col * COL_STEP, ROW0_Y + row * ROW_STEP);
  }
}
