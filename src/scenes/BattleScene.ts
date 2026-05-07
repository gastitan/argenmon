import Phaser from 'phaser';
import { PALETA_HEX, SCENE_KEYS, FONT } from '@/config';
import { Criatura } from '@/entities/Criatura';
import { ESPECIES } from '@/data/creatures';
import type { EspecieId } from '@/data/creatures';
import { TRAMPAS } from '@/data/items';
import { playerState } from '@/data/playerState';
import { BattleSystem } from '@/systems/BattleSystem';
import type { AccionJugador } from '@/systems/BattleSystem';
import { DialogBox } from '@/ui/DialogBox';
import { BattleMenu } from '@/ui/BattleMenu';
import { MoveMenu } from '@/ui/MoveMenu';
import { TrampaMenu } from '@/ui/TrampaMenu';
import { EquipoMenu } from '@/ui/EquipoMenu';
import { HpBar } from '@/ui/HpBar';
import type { BattleConfig } from '@/data/trainers';
import { encontrarEntrenador } from '@/data/trainers';

const SPRITE_MAP: Partial<Record<string, string>> = {
  hornero: 'sprite_hornero',
  yarara: 'sprite_yarara',
  mara: 'sprite_mara',
  peludo: 'sprite_peludo',
  nandu: 'sprite_nandu',
  vizcacha: 'sprite_vizcacha',
};

function getSpriteKey(especieId: string): string {
  return SPRITE_MAP[especieId] ?? 'placeholder';
}

const RIVAL_INFO_X = 4;
const RIVAL_INFO_Y = 4;

const ALIADO_INFO_X = 88;
const ALIADO_INFO_Y = 70;

type FaseUI = 'animando' | 'menu' | 'movimientos' | 'trampa' | 'equipo' | 'idle';

export class BattleScene extends Phaser.Scene {
  private config!: BattleConfig;
  private sistema!: BattleSystem;
  private equipoJugador!: Criatura[];

  private hpBarRival!: HpBar;
  private hpBarAliado!: HpBar;
  private hpTextRival!: Phaser.GameObjects.Text;
  private hpTextAliado!: Phaser.GameObjects.Text;
  private nomRival!: Phaser.GameObjects.Text;
  private nomAliado!: Phaser.GameObjects.Text;

  private dialogo!: DialogBox;
  private menu!: BattleMenu;
  private moveMenu!: MoveMenu;
  private trampaMenu!: TrampaMenu;
  private equipoMenu!: EquipoMenu;

  private faseUI: FaseUI = 'idle';
  private keyZ!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENE_KEYS.Battle);
  }

  init(data: BattleConfig): void {
    this.config = data ?? { tipo: 'debug' };
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETA_HEX.clarisimo);

    let equipo = playerState.equipo.map((d) => new Criatura(ESPECIES[d.especieId], d.nivel));
    if (equipo.length === 0) equipo = [new Criatura(ESPECIES.hornero, 5)];
    this.equipoJugador = equipo;

    const equipoRival = this.construirEquipoRival();
    const esWild = this.config.tipo !== 'entrenador';
    const entrenadorNombre = this.config.tipo === 'entrenador'
      ? (encontrarEntrenador(this.config.entrenadorId)?.nombre ?? 'El rival')
      : undefined;

    this.sistema = new BattleSystem(this.equipoJugador, equipoRival, { esWild, entrenadorNombre });

    this.crearLayout();

    this.dialogo = new DialogBox(this);
    this.menu = new BattleMenu(this);
    this.moveMenu = new MoveMenu(this);
    this.trampaMenu = new TrampaMenu(this);
    this.equipoMenu = new EquipoMenu(this);

    this.keyZ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    if (this.config.tipo === 'wild') {
      const id = this.config.especieId;
      if (playerState.catalogo[id] !== 'capturado') {
        playerState.catalogo[id] = 'visto';
      }
    }

    const eventos = this.sistema.iniciar();
    const mensajes = eventos.filter((e) => e.tipo === 'mensaje').map((e) => e.mensaje ?? '');
    this.mostrarMensajesSecuenciales(mensajes, () => this.mostrarMenu());
  }

  update(): void {
    this.menu.update();
    this.moveMenu.update();
    this.trampaMenu.update();
    this.equipoMenu.update();

    if (this.faseUI === 'animando' && Phaser.Input.Keyboard.JustDown(this.keyZ)) {
      this.dialogo.skip();
    }
  }

  // ── Construcción de equipos ─────────────────────────────────────────────────

  private construirEquipoRival(): Criatura[] {
    if (this.config.tipo === 'wild') {
      return [new Criatura(ESPECIES[this.config.especieId], this.config.nivel)];
    }
    if (this.config.tipo === 'entrenador') {
      const datos = encontrarEntrenador(this.config.entrenadorId);
      if (datos) return datos.equipo.map((e) => new Criatura(ESPECIES[e.especieId], e.nivel));
    }
    return [new Criatura(ESPECIES.yarara, 5)];
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  private crearLayout(): void {
    const jugador = this.sistema.estado.jugador;
    const rival = this.sistema.estado.rival;

    this.add.rectangle(0, 0, 160, 96, 0x8bac0f).setOrigin(0, 0);
    this.add.rectangle(0, 96, 160, 8, 0x306230).setOrigin(0, 0);
    this.add.rectangle(0, 104, 160, 40, 0x306230).setOrigin(0, 0);

    const rivalKey = getSpriteKey(rival.especie.id);
    if (rivalKey === 'placeholder') {
      this.add.rectangle(96, 4, 64, 64, 0x306230).setOrigin(0, 0);
    } else {
      this.add.image(128, 36, rivalKey).setDisplaySize(64, 64);
    }

    const jugadorKey = getSpriteKey(jugador.especie.id);
    if (jugadorKey === 'placeholder') {
      this.add.rectangle(8, 48, 56, 56, 0x0f380f).setOrigin(0, 0);
    } else {
      this.add.image(36, 76, jugadorKey).setDisplaySize(56, 56).setFlipX(true);
    }

    this.nomRival = this.add.text(RIVAL_INFO_X, RIVAL_INFO_Y, `${rival.especie.nombre} Lv${rival.nivel}`, {
      fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(150);
    this.hpBarRival = new HpBar(this, RIVAL_INFO_X, RIVAL_INFO_Y + 10, rival.hpMax);
    this.hpTextRival = this.add.text(RIVAL_INFO_X, RIVAL_INFO_Y + 18, `${rival.hpActual}/${rival.hpMax}`, {
      fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(150);

    this.nomAliado = this.add.text(ALIADO_INFO_X, ALIADO_INFO_Y, `${jugador.especie.nombre} Lv${jugador.nivel}`, {
      fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(150);
    this.hpBarAliado = new HpBar(this, ALIADO_INFO_X, ALIADO_INFO_Y + 10, jugador.hpMax);
    this.hpTextAliado = this.add.text(ALIADO_INFO_X, ALIADO_INFO_Y + 18, `${jugador.hpActual}/${jugador.hpMax}`, {
      fontFamily: FONT, fontSize: '6px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(150);
  }

  // ── Actualizar HUD ──────────────────────────────────────────────────────────

  private actualizarUI(): void {
    const jugador = this.sistema.estado.jugador;
    const rival = this.sistema.estado.rival;

    this.nomRival.setText(`${rival.especie.nombre} Lv${rival.nivel}`);
    this.hpBarRival.reiniciar(rival.hpMax, rival.hpActual);
    this.hpTextRival.setText(`${rival.hpActual}/${rival.hpMax}`);

    this.nomAliado.setText(`${jugador.especie.nombre} Lv${jugador.nivel}`);
    this.hpBarAliado.reiniciar(jugador.hpMax, jugador.hpActual);
    this.hpTextAliado.setText(`${jugador.hpActual}/${jugador.hpMax}`);
  }

  // ── Flujo de mensajes ───────────────────────────────────────────────────────

  private mostrarMensajesSecuenciales(mensajes: string[], onFin: () => void): void {
    if (mensajes.length === 0) {
      onFin();
      return;
    }
    this.faseUI = 'animando';
    const [primero, ...resto] = mensajes;
    this.dialogo.mostrar(primero, () => {
      this.mostrarMensajesSecuenciales(resto, onFin);
    });
  }

  // ── Menú principal ──────────────────────────────────────────────────────────

  private mostrarMenu(): void {
    if (this.sistema.estado.fase === 'fin') return;
    this.faseUI = 'menu';
    this.dialogo.setVisible(false);
    this.menu.mostrar((opcion) => {
      if (opcion === 'Atacar') {
        this.mostrarMovimientos();
      } else if (opcion === 'Trampa') {
        this.mostrarTrampas();
      } else if (opcion === 'Cambiar') {
        this.mostrarEquipo();
      } else {
        this.ejecutarTurno({ tipo: 'huir' });
      }
    });
  }

  private mostrarMovimientos(): void {
    this.faseUI = 'movimientos';
    const jugador = this.sistema.estado.jugador;
    this.moveMenu.mostrar(
      jugador.movimientos,
      (idx) => this.ejecutarTurno({ tipo: 'atacar', movimientoIdx: idx }),
      () => this.mostrarMenu(),
    );
  }

  private mostrarTrampas(): void {
    const inv = playerState.inventario;
    const hayTrampas = (Object.values(inv) as number[]).some((n) => n > 0);
    if (!hayTrampas) {
      this.mostrarMensajesSecuenciales(['¡No tenés trampas!'], () => this.mostrarMenu());
      return;
    }
    this.faseUI = 'trampa';
    this.trampaMenu.mostrar(
      inv,
      (trampaId) => {
        playerState.inventario[trampaId]--;
        this.ejecutarTurno({ tipo: 'trampa', trampa: TRAMPAS[trampaId] });
      },
      () => this.mostrarMenu(),
    );
  }

  private mostrarEquipo(): void {
    this.faseUI = 'equipo';
    const estado = this.sistema.estado;
    const activoIdx = estado.equipoJugador.indexOf(estado.jugador);
    this.equipoMenu.mostrar(
      this.equipoJugador,
      activoIdx,
      (idx) => this.ejecutarTurno({ tipo: 'cambiar', idx }),
      () => this.mostrarMenu(),
    );
  }

  // ── Resolución de turno ─────────────────────────────────────────────────────

  private ejecutarTurno(accion: AccionJugador): void {
    const eventos = this.sistema.ejecutarTurno(accion);

    const mensajes: string[] = [];
    for (const ev of eventos) {
      if (ev.mensaje) mensajes.push(ev.mensaje);
    }

    this.actualizarUI();

    const esFin = this.sistema.estado.fase === 'fin';
    this.mostrarMensajesSecuenciales(mensajes, () => {
      if (esFin) this.mostrarFinBatalla();
      else this.mostrarMenu();
    });
  }

  // ── Fin de batalla ──────────────────────────────────────────────────────────

  private mostrarFinBatalla(): void {
    const resultado = this.sistema.estado.resultado;
    const rival = this.sistema.estado.rival;

    if (resultado === 'captura') {
      const id = rival.especie.id as EspecieId;
      playerState.catalogo[id] = 'capturado';
      if (playerState.equipo.length < 3) {
        playerState.equipo.push({ especieId: id, nivel: rival.nivel });
      }
    } else if (resultado === 'victoria' && this.config.tipo === 'entrenador') {
      const id = this.config.entrenadorId;
      if (!playerState.entrenadoresDerrotados.includes(id)) {
        playerState.entrenadoresDerrotados.push(id);
      }
    }

    const msgs: Record<string, string> = {
      victoria: '¡Ganaste la batalla!',
      derrota: '¡Te quedaste sin criaturas...',
      huida: 'Huiste de la batalla.',
      captura: `¡${rival.especie.nombre} fue capturado!`,
    };
    const msg = (resultado && msgs[resultado]) ?? 'Fin de la batalla.';

    this.faseUI = 'animando';
    this.dialogo.mostrar(msg, () => {
      if (resultado === 'victoria' && this.config.tipo === 'entrenador') {
        const datos = encontrarEntrenador(this.config.entrenadorId);
        if (datos?.esJefeFinal) {
          this.scene.start(SCENE_KEYS.Catalog);
          return;
        }
      }
      this.scene.start(SCENE_KEYS.Overworld);
    });
  }
}
