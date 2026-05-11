import Phaser from 'phaser';
import { PALETA_HEX, FONT } from '@/config';
import { BATTLE_MENU_LAYOUT } from '@/config/layout';

const OPCIONES = ['Atacar', 'Trampa', 'Cambiar', 'Huir'] as const;
export type OpcionBattle = (typeof OPCIONES)[number];

export class BattleMenu {
  private items: Phaser.GameObjects.Text[] = [];
  private cursor!: Phaser.GameObjects.Text;
  private seleccion = 0;
  private onConfirmar: ((op: OpcionBattle) => void) | null = null;
  private keys!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; confirm: Phaser.Input.Keyboard.Key };

  constructor(scene: Phaser.Scene) {
    const { ITEM_X, ITEM_Y0, ITEM_STEP, CURSOR_X } = BATTLE_MENU_LAYOUT;
    OPCIONES.forEach((op, i) => {
      const t = scene.add
        .text(ITEM_X, ITEM_Y0 + i * ITEM_STEP, op, {
          fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
        })
        .setScrollFactor(0).setDepth(202);
      this.items.push(t);
    });

    this.cursor = scene.add
      .text(CURSOR_X, ITEM_Y0, '▶', {
        fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
      })
      .setScrollFactor(0).setDepth(202);

    scene.time.addEvent({
      delay: 256, loop: true,
      callback: () => { if (this.items[0].visible) this.cursor.setVisible(!this.cursor.visible); },
    });

    const kb = scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      confirm: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
    };

    this.setVisible(false);
  }

  mostrar(onConfirmar: (op: OpcionBattle) => void): void {
    this.seleccion = 0;
    this.onConfirmar = onConfirmar;
    this.actualizarCursor();
    this.setVisible(true);
  }

  update(): void {
    if (!this.items[0].visible) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      this.seleccion = (this.seleccion - 1 + OPCIONES.length) % OPCIONES.length;
      this.actualizarCursor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      this.seleccion = (this.seleccion + 1) % OPCIONES.length;
      this.actualizarCursor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm)) {
      this.setVisible(false);
      this.onConfirmar?.(OPCIONES[this.seleccion]);
    }
  }

  setVisible(v: boolean): void {
    this.cursor.setVisible(v);
    this.items.forEach((t) => t.setVisible(v));
  }

  private actualizarCursor(): void {
    this.cursor.setY(BATTLE_MENU_LAYOUT.ITEM_Y0 + this.seleccion * BATTLE_MENU_LAYOUT.ITEM_STEP);
  }
}
