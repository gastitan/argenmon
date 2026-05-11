import Phaser from 'phaser';
import { PALETA_HEX, FONT } from '@/config';
import { ITEM_MENU_LAYOUT } from '@/config/layout';
import type { TrampaId } from '@/data/items';
import { TRAMPAS } from '@/data/items';
import type { Inventario } from '@/state/GameState';

const ORDEN: TrampaId[] = ['trampaComun', 'trampaMonte', 'trampaFina'];

export class TrampaMenu {
  private items: Phaser.GameObjects.Text[] = [];
  private cursor!: Phaser.GameObjects.Text;
  private seleccion = 0;
  private inventario: Inventario = { trampaComun: 0, trampaMonte: 0, trampaFina: 0 };
  private onConfirmar: ((id: TrampaId) => void) | null = null;
  private onCancelar: (() => void) | null = null;
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    confirm: Phaser.Input.Keyboard.Key;
    cancel: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene) {
    const { ITEM_X, ITEM_Y0, ITEM_STEP, CURSOR_X } = ITEM_MENU_LAYOUT;
    for (let i = 0; i < ORDEN.length; i++) {
      const t = scene.add
        .text(ITEM_X, ITEM_Y0 + i * ITEM_STEP, '', {
          fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
        })
        .setScrollFactor(0).setDepth(202);
      this.items.push(t);
    }

    this.cursor = scene.add
      .text(CURSOR_X, ITEM_Y0, '▶', {
        fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
      })
      .setScrollFactor(0).setDepth(202);

    scene.time.addEvent({
      delay: 256,
      loop: true,
      callback: () => { if (this.items[0].visible) this.cursor.setVisible(!this.cursor.visible); },
    });

    const kb = scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      confirm: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      cancel: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
    };

    this.setVisible(false);
  }

  mostrar(inventario: Inventario, onConfirmar: (id: TrampaId) => void, onCancelar: () => void): void {
    this.inventario = inventario;
    this.onConfirmar = onConfirmar;
    this.onCancelar = onCancelar;

    ORDEN.forEach((id, i) => {
      const cant = inventario[id];
      const nombre = TRAMPAS[id].nombre;
      this.items[i].setText(`${nombre} ×${cant}`);
      this.items[i].setAlpha(cant > 0 ? 1 : 0.4);
    });

    this.seleccion = ORDEN.findIndex((id) => inventario[id] > 0);
    if (this.seleccion < 0) this.seleccion = 0;
    this.actualizarCursor();
    this.setVisible(true);
  }

  update(): void {
    if (!this.items[0].visible) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      this.moverCursor(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      this.moverCursor(1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm)) {
      const id = ORDEN[this.seleccion];
      if (this.inventario[id] > 0) {
        this.setVisible(false);
        this.onConfirmar?.(id);
      }
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

  private moverCursor(dir: 1 | -1): void {
    let next = (this.seleccion + dir + ORDEN.length) % ORDEN.length;
    let intentos = 0;
    while (this.inventario[ORDEN[next]] === 0 && intentos < ORDEN.length) {
      next = (next + dir + ORDEN.length) % ORDEN.length;
      intentos++;
    }
    this.seleccion = next;
    this.actualizarCursor();
  }

  private actualizarCursor(): void {
    this.cursor.setY(ITEM_MENU_LAYOUT.ITEM_Y0 + this.seleccion * ITEM_MENU_LAYOUT.ITEM_STEP);
  }
}
