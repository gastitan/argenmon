import Phaser from 'phaser';
import { PALETA_HEX, FONT } from '@/config';
import type { Criatura } from '@/entities/Criatura';

const ITEM_X = 14;
const CURSOR_X = 4;
const ITEM_Y0 = 107;
const ITEM_STEP = 11;

export class EquipoMenu {
  private items: Phaser.GameObjects.Text[] = [];
  private cursor!: Phaser.GameObjects.Text;
  private seleccion = 0;
  private equipo: Criatura[] = [];
  private activoIdx = 0;
  private onConfirmar: ((idx: number) => void) | null = null;
  private onCancelar: (() => void) | null = null;
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    confirm: Phaser.Input.Keyboard.Key;
    cancel: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < 3; i++) {
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
      delay: 256, loop: true,
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

  mostrar(equipo: Criatura[], activoIdx: number, onConfirmar: (idx: number) => void, onCancelar: () => void): void {
    this.equipo = equipo;
    this.activoIdx = activoIdx;
    this.onConfirmar = onConfirmar;
    this.onCancelar = onCancelar;

    equipo.forEach((c, i) => {
      if (this.items[i]) {
        const etiqueta = i === activoIdx ? ' (activa)' : '';
        this.items[i].setText(`${c.especie.nombre} Lv${c.nivel}  ${c.hpActual}/${c.hpMax}${etiqueta}`);
        this.items[i].setAlpha(c.estaVivo && i !== activoIdx ? 1 : 0.4);
      }
    });
    for (let i = equipo.length; i < 3; i++) {
      this.items[i]?.setText('');
    }

    this.seleccion = equipo.findIndex((c, i) => c.estaVivo && i !== activoIdx);
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
      const c = this.equipo[this.seleccion];
      if (c && c.estaVivo && this.seleccion !== this.activoIdx) {
        this.setVisible(false);
        this.onConfirmar?.(this.seleccion);
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
    let next = (this.seleccion + dir + this.equipo.length) % this.equipo.length;
    let intentos = 0;
    while ((!this.equipo[next]?.estaVivo || next === this.activoIdx) && intentos < this.equipo.length) {
      next = (next + dir + this.equipo.length) % this.equipo.length;
      intentos++;
    }
    this.seleccion = next;
    this.actualizarCursor();
  }

  private actualizarCursor(): void {
    this.cursor.setY(ITEM_Y0 + this.seleccion * ITEM_STEP);
  }
}
