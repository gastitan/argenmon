import Phaser from 'phaser';
import { PALETA } from '@/config';

const BAR_W = 48;
const BAR_H = 4;

export class HpBar {
  private bg: Phaser.GameObjects.Rectangle;
  private bar: Phaser.GameObjects.Rectangle;
  private hpMax: number;
  private hpActual: number;

  constructor(scene: Phaser.Scene, x: number, y: number, hpMax: number, depth = 150) {
    this.hpMax = hpMax;
    this.hpActual = hpMax;

    this.bg = scene.add
      .rectangle(x, y, BAR_W, BAR_H, PALETA.clarisimo)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);

    this.bar = scene.add
      .rectangle(x, y, BAR_W, BAR_H, PALETA.oscuro)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 1);
  }

  /** Actualiza la barra con un tween hacia el nuevo HP. */
  actualizar(scene: Phaser.Scene, hpNuevo: number, duracion = 300): void {
    this.hpActual = Math.max(0, hpNuevo);
    const ratio = this.hpActual / this.hpMax;
    const targetW = Math.max(1, Math.floor(BAR_W * ratio));
    const color = ratio > 0.25 ? PALETA.oscuro : PALETA.oscurisimo;

    this.bar.setFillStyle(color);
    scene.tweens.add({
      targets: this.bar,
      width: targetW,
      duration: duracion,
      ease: 'Linear',
    });
  }

  /** Reinicia la barra con un nuevo hpMax (al enviar una criatura diferente). */
  reiniciar(hpMax: number, hpActual: number): void {
    this.hpMax = hpMax;
    this.hpActual = Math.max(0, hpActual);
    const ratio = this.hpActual / this.hpMax;
    const targetW = Math.max(1, Math.floor(BAR_W * ratio));
    const color = ratio > 0.25 ? PALETA.oscuro : PALETA.oscurisimo;
    this.bar.setFillStyle(color);
    this.bar.width = targetW;
  }

  setVisible(v: boolean): void {
    this.bg.setVisible(v);
    this.bar.setVisible(v);
  }
}
