import Phaser from 'phaser';
import { SCENE_KEYS, FONT, GAME_WIDTH, GAME_HEIGHT } from '@/config';
import { GameState } from '@/state/GameState';
import { getBiomeIntro } from '@/data/loaders/loadBiomeIntros';

// Colores de la paleta master (no están en PALETA_HEX que es Game Boy verde)
const PAPEL = '#f5e6c8';
const TINTA = '#1a1410';
const TINTA_NUM = 0x1a1410;

const PAD_X = 16;
const CONTENT_W = GAME_WIDTH - PAD_X * 2;

export class BiomeIntroScene extends Phaser.Scene {
  private avanzando = false;

  constructor() {
    super(SCENE_KEYS.BiomeIntro);
  }

  create(): void {
    this.avanzando = false;

    const bioma = GameState.datos.biomaActual;
    const intro = getBiomeIntro(bioma);

    this.cameras.main.setBackgroundColor(PAPEL);

    // Encabezado: fecha (izquierda) y lugar (derecha)
    this.add
      .text(PAD_X, 14, intro.encabezadoFecha, {
        fontFamily: FONT,
        fontSize: '7px',
        color: TINTA,
      })
      .setOrigin(0, 0.5);

    this.add
      .text(GAME_WIDTH - PAD_X, 14, intro.lugar, {
        fontFamily: FONT,
        fontSize: '7px',
        color: TINTA,
      })
      .setOrigin(1, 0.5);

    // Línea separadora bajo el encabezado
    const gfx = this.add.graphics();
    gfx.lineStyle(1, TINTA_NUM, 0.5);
    gfx.strokeLineShape(new Phaser.Geom.Line(PAD_X, 23, GAME_WIDTH - PAD_X, 23));

    // Cuerpo: un Text por párrafo, posicionados dinámicamente
    let bodyY = 36;
    for (const parrafo of intro.cuerpo) {
      const t = this.add
        .text(PAD_X, bodyY, parrafo, {
          fontFamily: FONT,
          fontSize: '7px',
          color: TINTA,
          wordWrap: { width: CONTENT_W, useAdvancedWrap: true },
        })
        .setOrigin(0, 0);
      bodyY += t.height + 10;
    }

    // Leyenda de propiedad (opcional): fija cerca del pie de página
    if (intro.leyendaPropiedad) {
      gfx.strokeLineShape(
        new Phaser.Geom.Line(PAD_X, GAME_HEIGHT - 52, GAME_WIDTH - PAD_X, GAME_HEIGHT - 52)
      );
      this.add
        .text(PAD_X, GAME_HEIGHT - 44, intro.leyendaPropiedad, {
          fontFamily: FONT,
          fontSize: '6px',
          color: TINTA,
          wordWrap: { width: CONTENT_W, useAdvancedWrap: true },
        })
        .setOrigin(0, 0);
    }

    // Hint de tecla en el extremo inferior
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 4, '[ Z ] continuar', {
        fontFamily: FONT,
        fontSize: '5px',
        color: TINTA,
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.5);

    // Fade in desde negro; habilita el input al completarse (evita skip accidental y da tiempo de leer)
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
      this.input.keyboard!.once('keydown-Z', () => this.avanzar());
    });
  }

  private avanzar(): void {
    if (this.avanzando) return;
    this.avanzando = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.Overworld);
    });
  }
}
