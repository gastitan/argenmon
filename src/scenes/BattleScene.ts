import Phaser from 'phaser';
import { PALETA_HEX, SCENE_KEYS, FONT } from '@/config';
import { BATTLE_LAYOUT } from '@/config/layout';
import { Criatura } from '@/entities/Criatura';
import { ESPECIES } from '@/data/creatures';
import type { EspecieId } from '@/data/creatures';
import { TRAMPAS } from '@/data/items';
import { GameState, crearCriaturaGuardada } from '@/state/GameState';
import { BattleSystem } from '@/systems/BattleSystem';
import type { AccionJugador, EventoBatalla } from '@/systems/BattleSystem';
import { hayAlgunaViva, primeraVivaIdx } from '@/state/equipoUtils';
import { DialogBox } from '@/ui/DialogBox';
import { BattleMenu } from '@/ui/BattleMenu';
import { MoveMenu } from '@/ui/MoveMenu';
import { TrampaMenu } from '@/ui/TrampaMenu';
import { EquipoMenu } from '@/ui/EquipoMenu';
import { HpBar } from '@/ui/HpBar';
import type { BattleConfig } from '@/data/trainers';
import { encontrarEntrenador } from '@/data/trainers';

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

  // Tracked hpMax for the currently-displayed creature on each side
  private hpMaxRivalDisplay = 1;
  private hpMaxJugadorDisplay = 1;

  private dialogo!: DialogBox;
  private menu!: BattleMenu;
  private moveMenu!: MoveMenu;
  private trampaMenu!: TrampaMenu;
  private equipoMenu!: EquipoMenu;

  private faseUI: FaseUI = 'idle';
  private keyZ!: Phaser.Input.Keyboard.Key;
  private spriteJugador: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | null = null;
  private spriteRival: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super(SCENE_KEYS.Battle);
  }

  init(data: BattleConfig): void {
    this.config = data ?? { tipo: 'debug' };
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETA_HEX.clarisimo);
    this.keyZ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    const guardados = GameState.datos.equipo;
    let equipo = guardados.map((g) => {
      const c = new Criatura(ESPECIES[g.especieId], g.nivel);
      c.hpActual = g.hpActual;
      g.ppActuales.forEach((pp, i) => { if (c.movimientos[i]) c.movimientos[i].ppActual = pp; });
      return c;
    });
    if (equipo.length === 0) equipo = [new Criatura(ESPECIES.hornero, 5)];
    this.equipoJugador = equipo;

    if (!hayAlgunaViva(this.equipoJugador)) {
      this.dialogo = new DialogBox(this);
      this.faseUI = 'animando';
      this.dialogo.mostrar('¡No tenés criaturas en condiciones de pelear!', () => {
        this.dialogo.mostrar('Visitá al Almacenero.', () => {
          this.scene.start(SCENE_KEYS.Overworld);
        });
      });
      return;
    }

    const iniciarDesde = primeraVivaIdx(this.equipoJugador);
    const equipoRival = this.construirEquipoRival();
    const esWild = this.config.tipo !== 'entrenador';
    const entrenadorNombre = this.config.tipo === 'entrenador'
      ? (encontrarEntrenador(this.config.entrenadorId)?.nombre ?? 'El rival')
      : undefined;

    this.sistema = new BattleSystem(this.equipoJugador, equipoRival, { esWild, entrenadorNombre, iniciarDesde });

    this.crearLayout();

    this.dialogo = new DialogBox(this);
    this.menu = new BattleMenu(this);
    this.moveMenu = new MoveMenu(this);
    this.trampaMenu = new TrampaMenu(this);
    this.equipoMenu = new EquipoMenu(this);

    if (this.config.tipo === 'wild') {
      GameState.marcarVisto(this.config.especieId);
    }

    const eventos = this.sistema.iniciar();
    this.procesarEventos(eventos, () => this.mostrarMenu());
  }

  update(): void {
    if (this.faseUI === 'animando' && this.dialogo && Phaser.Input.Keyboard.JustDown(this.keyZ)) {
      this.dialogo.skip();
    }
    if (!this.menu) return;
    this.menu.update();
    this.moveMenu.update();
    this.trampaMenu.update();
    this.equipoMenu.update();
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
    const { COMBAT_ZONE, GROUND_STRIP, UI_PANEL, RIVAL, ALLY } = BATTLE_LAYOUT;
    const jugador = this.sistema.estado.jugador;
    const rival = this.sistema.estado.rival;

    this.add.rectangle(COMBAT_ZONE.x, COMBAT_ZONE.y, COMBAT_ZONE.w, COMBAT_ZONE.h, 0x8bac0f).setOrigin(0, 0);
    this.add.rectangle(GROUND_STRIP.x, GROUND_STRIP.y, GROUND_STRIP.w, GROUND_STRIP.h, 0x306230).setOrigin(0, 0);
    this.add.rectangle(UI_PANEL.x, UI_PANEL.y, UI_PANEL.w, UI_PANEL.h, 0x9bbc0f).setOrigin(0, 0);

    this.actualizarSpriteRival(rival);
    this.actualizarSpriteJugador(jugador);

    this.nomRival = this.add.text(RIVAL.INFO_POS.x, RIVAL.INFO_POS.y, `${rival.especie.nombre} Lv${rival.nivel}`, {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(150);
    this.hpMaxRivalDisplay = rival.hpMax;
    this.hpBarRival = new HpBar(this, RIVAL.INFO_POS.x, RIVAL.INFO_POS.y + RIVAL.HP_BAR_OFFSET_Y, rival.hpMax);
    this.hpBarRival.reiniciar(rival.hpMax, rival.hpActual);
    this.hpTextRival = this.add.text(RIVAL.INFO_POS.x, RIVAL.INFO_POS.y + RIVAL.HP_TEXT_OFFSET_Y, `${rival.hpActual}/${rival.hpMax}`, {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(150);

    this.nomAliado = this.add.text(ALLY.INFO_POS.x, ALLY.INFO_POS.y, `${jugador.especie.nombre} Lv${jugador.nivel}`, {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(150);
    this.hpMaxJugadorDisplay = jugador.hpMax;
    this.hpBarAliado = new HpBar(this, ALLY.INFO_POS.x, ALLY.INFO_POS.y + ALLY.HP_BAR_OFFSET_Y, jugador.hpMax);
    this.hpBarAliado.reiniciar(jugador.hpMax, jugador.hpActual);
    this.hpTextAliado = this.add.text(ALLY.INFO_POS.x, ALLY.INFO_POS.y + ALLY.HP_TEXT_OFFSET_Y, `${jugador.hpActual}/${jugador.hpMax}`, {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(150);
  }

  // ── Actualizar HUD ──────────────────────────────────────────────────────────

  private actualizarUIJugador(): void {
    const jugador = this.sistema.estado.jugador;
    this.nomAliado.setText(`${jugador.especie.nombre} Lv${jugador.nivel}`);
    this.hpMaxJugadorDisplay = jugador.hpMax;
    this.hpBarAliado.reiniciar(jugador.hpMax, jugador.hpActual);
    this.hpTextAliado.setText(`${jugador.hpActual}/${jugador.hpMax}`);
    this.actualizarSpriteJugador(jugador);
  }

  private actualizarUIRival(): void {
    const rival = this.sistema.estado.rival;
    this.nomRival.setText(`${rival.especie.nombre} Lv${rival.nivel}`);
    this.hpMaxRivalDisplay = rival.hpMax;
    this.hpBarRival.reiniciar(rival.hpMax, rival.hpActual);
    this.hpTextRival.setText(`${rival.hpActual}/${rival.hpMax}`);
    this.actualizarSpriteRival(rival);
  }

  private actualizarSpriteJugador(criatura: Criatura): void {
    const { ALLY } = BATTLE_LAYOUT;
    if (this.spriteJugador) this.spriteJugador.destroy();
    const key = criatura.especie.spriteKey;
    if (this.textures.exists(key)) {
      this.spriteJugador = this.add.image(ALLY.SPRITE_POS.x, ALLY.SPRITE_POS.y, key)
        .setOrigin(0, 0)
        .setDepth(50);
    } else {
      this.spriteJugador = this.add.rectangle(ALLY.SPRITE_POS.x, ALLY.SPRITE_POS.y, ALLY.SPRITE_SIZE, ALLY.SPRITE_SIZE, 0x0f380f)
        .setOrigin(0, 0)
        .setDepth(50);
    }
  }

  private actualizarSpriteRival(criatura: Criatura): void {
    const { RIVAL } = BATTLE_LAYOUT;
    if (this.spriteRival) this.spriteRival.destroy();
    const key = criatura.especie.spriteKey;
    if (this.textures.exists(key)) {
      this.spriteRival = this.add.image(RIVAL.SPRITE_POS.x, RIVAL.SPRITE_POS.y, key)
        .setOrigin(0, 0)
        .setFlipX(true)
        .setDepth(50);
    } else {
      this.spriteRival = this.add.rectangle(RIVAL.SPRITE_POS.x, RIVAL.SPRITE_POS.y, RIVAL.SPRITE_SIZE, RIVAL.SPRITE_SIZE, 0x306230)
        .setOrigin(0, 0)
        .setDepth(50);
    }
  }

  // ── Procesamiento secuencial de eventos ─────────────────────────────────────

  private procesarEventos(eventos: EventoBatalla[], onFin: () => void): void {
    if (eventos.length === 0) {
      onFin();
      return;
    }
    const [ev, ...resto] = eventos;
    const continuar = () => this.procesarEventos(resto, onFin);

    switch (ev.tipo) {
      case 'mensaje':
      case 'evasion_sube':
      case 'envenenado':
      case 'captura_sacudida':
      case 'captura_exito':
      case 'captura_fallo':
        this.faseUI = 'animando';
        if (ev.mensaje) {
          this.dialogo.mostrar(ev.mensaje, continuar);
        } else {
          continuar();
        }
        break;

      case 'danio_rival':
      case 'danio_veneno_rival': {
        const nuevoHp = ev.nuevoHp ?? 0;
        const hpMax = this.hpMaxRivalDisplay;
        const procesarMensaje = () => {
          this.hpTextRival.setText(`${nuevoHp}/${hpMax}`);
          if (ev.mensaje) {
            this.faseUI = 'animando';
            this.dialogo.mostrar(ev.mensaje, continuar);
          } else {
            continuar();
          }
        };
        this.hpBarRival.actualizar(this, nuevoHp, 500, procesarMensaje);
        break;
      }

      case 'danio_jugador':
      case 'danio_veneno_jugador': {
        const nuevoHp = ev.nuevoHp ?? 0;
        const hpMax = this.hpMaxJugadorDisplay;
        const procesarMensaje = () => {
          this.hpTextAliado.setText(`${nuevoHp}/${hpMax}`);
          if (ev.mensaje) {
            this.faseUI = 'animando';
            this.dialogo.mostrar(ev.mensaje, continuar);
          } else {
            continuar();
          }
        };
        this.hpBarAliado.actualizar(this, nuevoHp, 500, procesarMensaje);
        break;
      }

      case 'desmayo_rival':
        this.faseUI = 'animando';
        if (ev.mensaje) {
          this.dialogo.mostrar(ev.mensaje, () => this.animarDesmayo(this.spriteRival, continuar));
        } else {
          this.animarDesmayo(this.spriteRival, continuar);
        }
        break;

      case 'desmayo_jugador':
        this.faseUI = 'animando';
        if (ev.mensaje) {
          this.dialogo.mostrar(ev.mensaje, () => this.animarDesmayo(this.spriteJugador, continuar));
        } else {
          this.animarDesmayo(this.spriteJugador, continuar);
        }
        break;

      case 'cambio_jugador':
        this.faseUI = 'animando';
        if (ev.mensaje) {
          this.dialogo.mostrar(ev.mensaje, () => { this.actualizarUIJugador(); continuar(); });
        } else {
          this.actualizarUIJugador();
          continuar();
        }
        break;

      case 'cambio_rival':
        this.faseUI = 'animando';
        if (ev.mensaje) {
          this.dialogo.mostrar(ev.mensaje, () => { this.actualizarUIRival(); continuar(); });
        } else {
          this.actualizarUIRival();
          continuar();
        }
        break;

      case 'batalla_fin':
        continuar();
        break;

      default:
        continuar();
    }
  }

  private animarDesmayo(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | null,
    onFin: () => void,
  ): void {
    if (!sprite) { onFin(); return; }
    this.tweens.add({
      targets: sprite,
      alpha: 0,
      y: sprite.y + 8,
      duration: 600,
      ease: 'Linear',
      onComplete: onFin,
    });
  }

  // ── Flujo de mensajes simples ───────────────────────────────────────────────

  private mostrarMensajesSecuenciales(mensajes: string[], onFin: () => void): void {
    if (mensajes.length === 0) { onFin(); return; }
    this.faseUI = 'animando';
    const [primero, ...resto] = mensajes;
    this.dialogo.mostrar(primero, () => this.mostrarMensajesSecuenciales(resto, onFin));
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
    const inv = GameState.datos.inventario;
    const hayTrampas = (Object.values(inv) as number[]).some((n) => n > 0);
    if (!hayTrampas) {
      this.mostrarMensajesSecuenciales(['¡No tenés trampas!'], () => this.mostrarMenu());
      return;
    }
    this.faseUI = 'trampa';
    this.trampaMenu.mostrar(
      inv,
      (trampaId) => {
        GameState.usarTrampa(trampaId);
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
      (idx) => {
        const criatura = this.equipoJugador[idx];
        if (!criatura || !criatura.estaVivo) {
          this.mostrarMensajesSecuenciales(['¡Esta criatura no puede pelear!'], () => this.mostrarMenu());
          return;
        }
        this.ejecutarTurno({ tipo: 'cambiar', idx });
      },
      () => this.mostrarMenu(),
    );
  }

  // ── Resolución de turno ─────────────────────────────────────────────────────

  private ejecutarTurno(accion: AccionJugador): void {
    const eventos = this.sistema.ejecutarTurno(accion);
    const esFin = this.sistema.estado.fase === 'fin';
    this.procesarEventos(eventos, () => {
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
      GameState.marcarCapturado(id);
      const agregada = GameState.agregarAlEquipo(crearCriaturaGuardada(id, rival.nivel));
      if (!agregada) {
        // equipo lleno — futura pantalla de reemplazo
      }
    } else if (resultado === 'victoria' && this.config.tipo === 'entrenador') {
      GameState.derrotarEntrenador(this.config.entrenadorId);
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
      const guardados = GameState.datos.equipo;
      this.equipoJugador.forEach((criatura, i) => {
        if (!guardados[i]) return;
        GameState.actualizarCriatura(guardados[i].uid, {
          hpActual: criatura.hpActual,
          ppActuales: criatura.movimientos.map((m) => m.ppActual) as [number, number, number, number],
          estadoAlterado: criatura.estadoAlterado === 'envenenado' ? 'envenenado' : 'ninguno',
        });
      });
      GameState.resetearModificadoresCombate();
      GameState.guardar();
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
