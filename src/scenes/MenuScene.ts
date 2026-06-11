import Phaser from 'phaser';
import { GAME_WIDTH, PALETA_HEX, SCENE_KEYS, FONT } from '@/config';
import { MENU_LAYOUT } from '@/config/layout';
import { MenuController } from '@/scenes/MenuController';
import type { EstadoMenu } from '@/scenes/MenuController';

// Posiciones de las opciones del menú principal.
// Con el cursor (≈8px) + gap (4px) + "Nueva partida" (≈108px) el bloque visual
// queda centrado en los 320px del canvas.
const OPTION_X = 100;
const CURSOR_X = 88;
const OPTION_Y0 = 158;
const OPTION_STEP = 16;

// Posiciones de las pantallas de confirmación
const CONFIRM_Q_Y = 130;
const CONFIRM_Q2_Y = 143;
const CONFIRM_OPT_SI_Y = 165;
const CONFIRM_OPT_NO_Y = 181;

// Tiempo de auto-avance tras mostrar "Partida borrada."
const MSG_DELAY_MS = 1500;

export class MenuScene extends Phaser.Scene {
  private controller!: MenuController;
  private cursor!: Phaser.GameObjects.Text;
  private blinkTimer!: Phaser.Time.TimerEvent;

  // Menú principal
  private optContinuar!: Phaser.GameObjects.Text;
  private optNueva!: Phaser.GameObjects.Text;

  // Confirmaciones
  private pregunta!: Phaser.GameObjects.Text;
  private pregunta2!: Phaser.GameObjects.Text;
  private optSi!: Phaser.GameObjects.Text;
  private optNo!: Phaser.GameObjects.Text;

  // Mensaje final
  private txtMensaje!: Phaser.GameObjects.Text;

  // Estado de navegación
  private cursorYs: number[] = [];
  private seleccion = 0;

  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    confirm: Phaser.Input.Keyboard.Key;
    cancel: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super(SCENE_KEYS.Menu);
  }

  create(): void {
    this.controller = new MenuController();

    this.cameras.main.setBackgroundColor(PALETA_HEX.clarisimo);

    this.add
      .text(GAME_WIDTH / 2, MENU_LAYOUT.TITLE_Y, 'CRIOLLOS', {
        fontFamily: FONT,
        fontSize: '16px',
        color: PALETA_HEX.oscurisimo,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, MENU_LAYOUT.SUBTITLE_Y, 'fauna pampeana', {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscuro,
      })
      .setOrigin(0.5);

    // Menú principal
    this.optContinuar = this.add
      .text(OPTION_X, OPTION_Y0, 'Continuar', {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscurisimo,
      })
      .setOrigin(0, 0.5);

    this.optNueva = this.add
      .text(OPTION_X, OPTION_Y0 + OPTION_STEP, 'Nueva partida', {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscurisimo,
      })
      .setOrigin(0, 0.5);

    if (!this.controller.continuarHabilitada) {
      this.optContinuar.setAlpha(0.4);
    }

    // Confirmación: texto de pregunta (primera y segunda línea)
    this.pregunta = this.add
      .text(GAME_WIDTH / 2, CONFIRM_Q_Y, '', {
        fontFamily: FONT,
        fontSize: '7px',
        color: PALETA_HEX.oscurisimo,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.pregunta2 = this.add
      .text(GAME_WIDTH / 2, CONFIRM_Q2_Y, '', {
        fontFamily: FONT,
        fontSize: '7px',
        color: PALETA_HEX.oscurisimo,
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Confirmación: opciones SÍ / NO
    this.optSi = this.add
      .text(OPTION_X, CONFIRM_OPT_SI_Y, 'SÍ', {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscurisimo,
      })
      .setOrigin(0, 0.5)
      .setVisible(false);

    this.optNo = this.add
      .text(OPTION_X, CONFIRM_OPT_NO_Y, 'NO', {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscurisimo,
      })
      .setOrigin(0, 0.5)
      .setVisible(false);

    // Mensaje post-confirmación
    this.txtMensaje = this.add
      .text(GAME_WIDTH / 2, OPTION_Y0, 'Partida borrada.', {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscurisimo,
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Cursor compartido para todas las fases
    this.cursor = this.add
      .text(CURSOR_X, 0, '▶', {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscurisimo,
      })
      .setOrigin(0, 0.5);

    this.blinkTimer = this.time.addEvent({
      delay: 256,
      loop: true,
      callback: () => {
        if (this.controller.estadoActual !== 'mensaje') {
          this.cursor.setVisible(!this.cursor.visible);
        }
      },
    });

    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      confirm: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      cancel: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
    };

    this.mostrarFase('main');
  }

  update(): void {
    const estado = this.controller.estadoActual;
    if (estado === 'mensaje') return;

    const total = this.cursorYs.length;
    if (total === 0) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      this.moverCursor(-1, estado, total);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      this.moverCursor(1, estado, total);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm)) {
      this.procesarConfirm(estado);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.cancel)) {
      if (estado === 'confirmar1' || estado === 'confirmar2') {
        this.controller.cancelar();
        this.mostrarFase('main');
      }
    }
  }

  private moverCursor(dir: 1 | -1, estado: EstadoMenu, total: number): void {
    let next = (this.seleccion + dir + total) % total;
    // En el menú principal, saltar Continuar si está deshabilitada
    if (estado === 'main' && !this.controller.continuarHabilitada && next === 0) {
      next = dir === 1 ? 1 : total - 1;
    }
    this.seleccion = next;
    this.actualizarCursor();
  }

  private procesarConfirm(estado: EstadoMenu): void {
    switch (estado) {
      case 'main': {
        if (this.seleccion === 0) {
          this.controller.confirmarContinuar();
          this.irAlOverworld();
        } else {
          const resultado = this.controller.confirmarNueva();
          if (resultado === 'directo') {
            this.irABiomeIntro();
          } else {
            this.mostrarFase('confirmar1');
          }
        }
        break;
      }
      case 'confirmar1': {
        const si = this.seleccion === 0;
        this.controller.responderConfirmar1(si);
        this.mostrarFase(si ? 'confirmar2' : 'main');
        break;
      }
      case 'confirmar2': {
        const si = this.seleccion === 0;
        const realizado = this.controller.responderConfirmar2(si);
        if (realizado) {
          this.mostrarFase('mensaje');
          this.time.delayedCall(MSG_DELAY_MS, () => this.irABiomeIntro());
        } else {
          this.mostrarFase('main');
        }
        break;
      }
    }
  }

  private mostrarFase(estado: EstadoMenu): void {
    const enMain = estado === 'main';
    const enConfirm = estado === 'confirmar1' || estado === 'confirmar2';

    this.optContinuar.setVisible(enMain);
    this.optNueva.setVisible(enMain);

    this.pregunta.setVisible(enConfirm);
    this.pregunta2.setVisible(estado === 'confirmar2');
    this.optSi.setVisible(enConfirm);
    this.optNo.setVisible(enConfirm);

    this.txtMensaje.setVisible(estado === 'mensaje');
    this.cursor.setVisible(estado !== 'mensaje');

    switch (estado) {
      case 'main':
        this.cursorYs = [OPTION_Y0, OPTION_Y0 + OPTION_STEP];
        this.seleccion = this.controller.seleccionInicial;
        break;
      case 'confirmar1':
        this.pregunta.setText('¿Borrar tu partida?');
        this.cursorYs = [CONFIRM_OPT_SI_Y, CONFIRM_OPT_NO_Y];
        this.seleccion = 1; // cursor en NO por defecto
        break;
      case 'confirmar2':
        this.pregunta.setText('¿Seguro?');
        this.pregunta2.setText('Esto no se puede deshacer.');
        this.cursorYs = [CONFIRM_OPT_SI_Y, CONFIRM_OPT_NO_Y];
        this.seleccion = 1; // cursor en NO por defecto
        break;
      case 'mensaje':
        this.cursorYs = [];
        return;
    }

    this.actualizarCursor();
  }

  private actualizarCursor(): void {
    if (this.cursorYs.length === 0) return;
    this.cursor.setY(this.cursorYs[this.seleccion]);
  }

  private irAlOverworld(): void {
    this.blinkTimer.remove();
    this.scene.start(SCENE_KEYS.Overworld);
  }

  private irABiomeIntro(): void {
    this.blinkTimer.remove();
    this.scene.start(SCENE_KEYS.BiomeIntro);
  }
}
