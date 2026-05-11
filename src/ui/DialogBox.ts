import Phaser from 'phaser';
import { PALETA_HEX, FONT } from '@/config';
import { DIALOG_LAYOUT } from '@/config/layout';

export class DialogBox {
  private scene: Phaser.Scene;
  private text!: Phaser.GameObjects.Text;
  private fullText = '';
  private displayedChars = 0;
  private timer: Phaser.Time.TimerEvent | null = null;
  private onDone: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.text = scene.add
      .text(
        DIALOG_LAYOUT.TEXT_OFFSET_X,
        DIALOG_LAYOUT.BOX_Y + DIALOG_LAYOUT.TEXT_OFFSET_Y,
        '',
        {
          fontFamily: FONT,
          fontSize: '8px',
          color: PALETA_HEX.oscurisimo,
          wordWrap: { width: DIALOG_LAYOUT.WORD_WRAP_WIDTH },
          lineSpacing: 2,
        },
      )
      .setScrollFactor(0)
      .setDepth(201);

    this.setVisible(false);
  }

  mostrar(mensaje: string, onDone?: () => void): void {
    this.fullText = mensaje;
    this.displayedChars = 0;
    this.onDone = onDone ?? null;
    this.text.setText('');
    this.setVisible(true);

    if (this.timer) this.timer.remove();
    this.timer = this.scene.time.addEvent({
      delay: DIALOG_LAYOUT.CHAR_DELAY_MS,
      repeat: mensaje.length - 1,
      callback: this.avanzarChar,
      callbackScope: this,
    });
  }

  /** Salta el typewriter (al apretar A). Si ya terminó, llama onDone. */
  skip(): void {
    if (this.displayedChars < this.fullText.length) {
      if (this.timer) this.timer.remove();
      this.text.setText(this.fullText);
      this.displayedChars = this.fullText.length;
    } else {
      this.setVisible(false);
      this.onDone?.();
    }
  }

  get terminado(): boolean {
    return this.displayedChars >= this.fullText.length;
  }

  setVisible(v: boolean): void {
    this.text.setVisible(v);
  }

  private avanzarChar(): void {
    this.displayedChars++;
    this.text.setText(this.fullText.slice(0, this.displayedChars));
    if (this.displayedChars >= this.fullText.length && this.onDone) {
      // Auto-avanzar no: el jugador debe presionar A
    }
  }
}
