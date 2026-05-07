import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PALETA_HEX, SCENE_KEYS, FONT } from '@/config';

export class MenuScene extends Phaser.Scene {
  private parpadeo?: Phaser.Time.TimerEvent;
  private textoStart?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.Menu);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETA_HEX.clarisimo);

    this.add
      .text(GAME_WIDTH / 2, 40, 'ARGENMON', {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscurisimo,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 70, 'fauna pampeana', {
        fontFamily: FONT,
        fontSize: '6px',
        color: PALETA_HEX.oscuro,
      })
      .setOrigin(0.5);

    this.textoStart = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'PRESS START', {
        fontFamily: FONT,
        fontSize: '6px',
        color: PALETA_HEX.oscurisimo,
      })
      .setOrigin(0.5);

    this.parpadeo = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.textoStart) {
          this.textoStart.visible = !this.textoStart.visible;
        }
      },
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.iniciar());
    this.input.keyboard?.once('keydown-SPACE', () => this.iniciar());
    this.input.once('pointerdown', () => this.iniciar());
  }

  private iniciar(): void {
    this.parpadeo?.remove();
    this.scene.start(SCENE_KEYS.Overworld);
  }
}
