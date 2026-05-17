import { Criatura } from '@/entities/Criatura';
import type { Movimiento } from '@/data/moves';
import type { Trampa } from '@/data/items';
import { damageFormula } from '@/utils/formulas';
import { efectividadCombinada } from '@/data/types';
import { intentarCaptura } from './CaptureSystem';
import type { RNG } from '@/utils/rng';
import { crearRNG } from '@/utils/rng';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type FaseBatalla =
  | 'inicio'
  | 'esperando_input'
  | 'seleccionando_mov'
  | 'resolviendo_turno'
  | 'fin';

export type ResultadoBatalla = 'victoria' | 'derrota' | 'huida' | 'captura';

export type AccionJugador =
  | { tipo: 'atacar'; movimientoIdx: number }
  | { tipo: 'trampa'; trampa: Trampa }
  | { tipo: 'cambiar'; idx: number }
  | { tipo: 'huir' };

export interface EventoBatalla {
  tipo:
    | 'mensaje'
    | 'danio_jugador'
    | 'danio_rival'
    | 'desmayo_jugador'
    | 'desmayo_rival'
    | 'cambio_jugador'
    | 'cambio_rival'
    | 'envenenado'
    | 'danio_veneno_jugador'
    | 'danio_veneno_rival'
    | 'evasion_sube'
    | 'captura_sacudida'
    | 'captura_exito'
    | 'captura_fallo'
    | 'batalla_fin'
    | 'sube_nivel'
    | 'aprende_movimiento'
    | 'intenta_aprender_movimiento'
    | 'cancela_aprendizaje';
  mensaje?: string;
  cantidad?: number;
  nuevoHp?: number;
  resultado?: ResultadoBatalla;
  critico?: boolean;
  efectividad?: number;
  movimientoId?: string;
  slot?: number;
  automatico?: boolean;
  nivelNuevo?: number;
}

export interface EstadoBatalla {
  fase: FaseBatalla;
  jugador: Criatura;
  rival: Criatura;
  equipoJugador: Criatura[];
  equipoRival: Criatura[];
  turno: number;
  resultado?: ResultadoBatalla;
}

export interface OpcionesBattle {
  seed?: number;
  esWild?: boolean;
  entrenadorNombre?: string;
  iniciarDesde?: number;
}

const MULT_EVASION = [1.0, 0.75, 0.60] as const;

// ── BattleSystem ─────────────────────────────────────────────────────────────

export class BattleSystem {
  private _estado: EstadoBatalla;
  private rng: RNG;
  private cola: EventoBatalla[] = [];
  private esWild: boolean;
  private entrenadorNombre: string;
  private activoJugadorIdx = 0;
  private activoRivalIdx = 0;

  constructor(equipoJugador: Criatura[], equipoRival: Criatura[], opciones: OpcionesBattle = {}) {
    const seed = opciones.seed ?? Math.floor(Math.random() * 0xffffffff);
    this.rng = crearRNG(seed);
    this.esWild = opciones.esWild ?? true;
    this.entrenadorNombre = opciones.entrenadorNombre ?? 'El rival';

    const iniciarDesde = opciones.iniciarDesde ?? 0;
    this.activoJugadorIdx = iniciarDesde;
    this._estado = {
      fase: 'inicio',
      jugador: equipoJugador[iniciarDesde] ?? equipoJugador[0],
      rival: equipoRival[0],
      equipoJugador,
      equipoRival,
      turno: 0,
    };
  }

  get estado(): Readonly<EstadoBatalla> {
    return this._estado;
  }

  iniciar(): EventoBatalla[] {
    this.cola = [];
    if (this.esWild) {
      this.emitir({ tipo: 'mensaje', mensaje: `¡Apareció ${this._estado.rival.especie.nombre} salvaje!` });
    } else {
      this.emitir({ tipo: 'mensaje', mensaje: `¡${this.entrenadorNombre} quiere combatir!` });
    }
    this.emitir({ tipo: 'mensaje', mensaje: `¡${this._estado.jugador.especie.nombre}, adelante!` });
    this._estado.fase = 'esperando_input';
    return this.vaciarCola();
  }

  ejecutarTurno(accionJugador: AccionJugador): EventoBatalla[] {
    if (this._estado.fase !== 'esperando_input' && this._estado.fase !== 'seleccionando_mov') {
      return [];
    }
    this.cola = [];
    this._estado.fase = 'resolviendo_turno';

    if (accionJugador.tipo === 'huir') {
      if (!this.esWild) {
        this.emitir({ tipo: 'mensaje', mensaje: '¡No podés huir de un combate de entrenador!' });
        this._estado.fase = 'esperando_input';
        return this.vaciarCola();
      }
      this.emitir({ tipo: 'mensaje', mensaje: '¡Huiste de la batalla!' });
      this._estado.resultado = 'huida';
      this._estado.fase = 'fin';
      this.emitir({ tipo: 'batalla_fin', resultado: 'huida' });
      return this.vaciarCola();
    }

    if (accionJugador.tipo === 'cambiar') {
      return this.resolverCambio(accionJugador.idx);
    }

    if (accionJugador.tipo === 'trampa') {
      return this.resolverTrampa(accionJugador.trampa);
    }

    return this.resolverAtaque(accionJugador.movimientoIdx);
  }

  // ── Cambio manual ───────────────────────────────────────────────────────────

  private resolverCambio(idx: number): EventoBatalla[] {
    const nueva = this._estado.equipoJugador[idx];
    if (!nueva || !nueva.estaVivo || idx === this.activoJugadorIdx) {
      this.emitir({ tipo: 'mensaje', mensaje: 'No se puede cambiar a esa criatura.' });
      this._estado.fase = 'esperando_input';
      return this.vaciarCola();
    }
    this.activoJugadorIdx = idx;
    this._estado.jugador = nueva;
    this.emitir({ tipo: 'cambio_jugador', mensaje: `¡${nueva.especie.nombre}, adelante!` });

    // El rival ataca después del cambio
    const movRival = this.elegirMovimientoRival();
    this.aplicarAtaque(this._estado.rival, movRival, this._estado.jugador, true);
    this._estado.turno++;
    this.verificarFinTurno();
    return this.vaciarCola();
  }

  // ── Trampa ──────────────────────────────────────────────────────────────────

  private resolverTrampa(trampa: Trampa): EventoBatalla[] {
    if (!this.esWild) {
      this.emitir({ tipo: 'mensaje', mensaje: '¡No podés usar trampas en combate de entrenador!' });
      this._estado.fase = 'esperando_input';
      return this.vaciarCola();
    }

    const resultado = intentarCaptura(this._estado.rival, trampa, this.rng);
    for (let i = 0; i < resultado.sacudidas; i++) {
      this.emitir({ tipo: 'captura_sacudida', mensaje: `¡Sacudida ${i + 1}!` });
    }

    if (resultado.exito) {
      this.emitir({ tipo: 'captura_exito', mensaje: `¡${this._estado.rival.especie.nombre} fue atrapado!` });
      this._estado.resultado = 'captura';
      this._estado.fase = 'fin';
      this.emitir({ tipo: 'batalla_fin', resultado: 'captura' });
    } else {
      this.emitir({ tipo: 'captura_fallo', mensaje: `¡${this._estado.rival.especie.nombre} escapó de la trampa!` });
      const movRival = this.elegirMovimientoRival();
      this.aplicarAtaque(this._estado.rival, movRival, this._estado.jugador, true);
      this._estado.turno++;
      this.verificarFinTurno();
    }

    return this.vaciarCola();
  }

  // ── Ataque ──────────────────────────────────────────────────────────────────

  private resolverAtaque(movimientoIdx: number): EventoBatalla[] {
    const movJugador = this._estado.jugador.movimientos[movimientoIdx];
    if (!movJugador) return this.vaciarCola();

    const movRival = this.elegirMovimientoRival();
    const jugadorPrimero = this.determinarOrden(
      this._estado.jugador, movJugador.movimiento,
      this._estado.rival, movRival,
    );

    if (jugadorPrimero) {
      this.aplicarAtaque(this._estado.jugador, movJugador.movimiento, this._estado.rival, false);
      if (this._estado.rival.estaVivo) {
        this.aplicarAtaque(this._estado.rival, movRival, this._estado.jugador, true);
      }
    } else {
      this.aplicarAtaque(this._estado.rival, movRival, this._estado.jugador, true);
      if (this._estado.jugador.estaVivo) {
        this.aplicarAtaque(this._estado.jugador, movJugador.movimiento, this._estado.rival, false);
      }
    }

    this._estado.turno++;

    if (this._estado.rival.estaVivo) this.aplicarVeneno(this._estado.rival, false);
    if (this._estado.jugador.estaVivo) this.aplicarVeneno(this._estado.jugador, true);

    this.verificarFinTurno();
    return this.vaciarCola();
  }

  // ── Fin de turno + switches automáticos ────────────────────────────────────

  private verificarFinTurno(): void {
    // Auto-switch rival si se desmayó y quedan criaturas
    if (!this._estado.rival.estaVivo) {
      const siguiente = this._estado.equipoRival.find((c, i) => i > this.activoRivalIdx && c.estaVivo)
        ?? this._estado.equipoRival.find((c) => c.estaVivo);
      if (siguiente) {
        this.activoRivalIdx = this._estado.equipoRival.indexOf(siguiente);
        this._estado.rival = siguiente;
        const quienManda = this.esWild ? '' : `¡${this.entrenadorNombre} envió a `;
        this.emitir({ tipo: 'cambio_rival', mensaje: `${quienManda}${siguiente.especie.nombre}!` });
      } else {
        this._estado.resultado = 'victoria';
        this._estado.fase = 'fin';
        this.emitir({ tipo: 'batalla_fin', resultado: 'victoria' });
        return;
      }
    }

    // Auto-switch jugador si se desmayó y quedan criaturas
    if (!this._estado.jugador.estaVivo) {
      const siguiente = this._estado.equipoJugador.find((c) => c.estaVivo);
      if (siguiente) {
        this.activoJugadorIdx = this._estado.equipoJugador.indexOf(siguiente);
        this._estado.jugador = siguiente;
        this.emitir({ tipo: 'cambio_jugador', mensaje: `¡${siguiente.especie.nombre}, adelante!` });
      } else {
        this._estado.resultado = 'derrota';
        this._estado.fase = 'fin';
        this.emitir({ tipo: 'batalla_fin', resultado: 'derrota' });
        return;
      }
    }

    this._estado.fase = 'esperando_input';
  }

  // ── Veneno ──────────────────────────────────────────────────────────────────

  private aplicarVeneno(criatura: Criatura, esJugador: boolean): void {
    if (criatura.estadoAlterado !== 'envenenado') return;
    const danio = Math.max(1, Math.floor(criatura.hpMax / 8));
    criatura.recibirDanio(danio);
    this.emitir({
      tipo: esJugador ? 'danio_veneno_jugador' : 'danio_veneno_rival',
      mensaje: `${criatura.especie.nombre} sufre daño por veneno.`,
      cantidad: danio,
      nuevoHp: criatura.hpActual,
    });
    if (!criatura.estaVivo) {
      this.emitir({
        tipo: esJugador ? 'desmayo_jugador' : 'desmayo_rival',
        mensaje: `¡${criatura.especie.nombre} se desmayó por el veneno!`,
      });
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private elegirMovimientoRival(): Movimiento {
    const movs = this._estado.rival.movimientos.filter((m) => m.ppActual > 0);

    // AI de entrenador: elige el movimiento de mayor daño esperado
    if (!this.esWild) {
      const movsDanio = movs.filter((m) => m.movimiento.categoria !== 'estado');
      if (movsDanio.length > 0) {
        const mejor = movsDanio.reduce((best, m) => {
          const efect = efectividadCombinada(m.movimiento.tipo, this._estado.jugador.tipos);
          const stab = this._estado.rival.tipos.includes(m.movimiento.tipo) ? 1.5 : 1;
          const score = m.movimiento.poder * efect * stab;
          const bestEfect = efectividadCombinada(best.movimiento.tipo, this._estado.jugador.tipos);
          const bestStab = this._estado.rival.tipos.includes(best.movimiento.tipo) ? 1.5 : 1;
          const bestScore = best.movimiento.poder * bestEfect * bestStab;
          return score > bestScore ? m : best;
        });
        return mejor.movimiento;
      }
    }

    // Wild o solo movimientos de estado: random
    const idx = this.rng.rangoEntero(0, movs.length - 1);
    return (movs[idx] ?? this._estado.rival.movimientos[0]).movimiento;
  }

  private determinarOrden(a: Criatura, movA: Movimiento, b: Criatura, movB: Movimiento): boolean {
    if (movA.prioridad !== movB.prioridad) return movA.prioridad > movB.prioridad;
    if (a.vel !== b.vel) return a.vel > b.vel;
    return this.rng.chance(0.5);
  }

  private aplicarAtaque(atacante: Criatura, movimiento: Movimiento, defensor: Criatura, esJugador: boolean): void {
    const ppEntry = atacante.movimientos.find((m) => m.movimiento.id === movimiento.id);
    if (ppEntry) ppEntry.ppActual = Math.max(0, ppEntry.ppActual - 1);

    if (movimiento.categoria === 'estado') {
      const efecto = movimiento.efecto;
      if (efecto?.tipo === 'evasion') {
        atacante.modificadorEvasion = Math.min(2, atacante.modificadorEvasion + efecto.etapas);
        this.emitir({ tipo: 'evasion_sube', mensaje: `¡${atacante.especie.nombre} se escondió!` });
      }
      return;
    }

    const evasionMult = MULT_EVASION[Math.min(defensor.modificadorEvasion, 2) as 0 | 1 | 2];
    const precisionEfectiva = (movimiento.precision / 100) * evasionMult;
    if (!this.rng.chance(precisionEfectiva)) {
      this.emitir({ tipo: 'mensaje', mensaje: `${atacante.especie.nombre} usó ${movimiento.nombre}... ¡Pero falló!` });
      return;
    }

    const resultado = damageFormula(
      {
        nivel: atacante.nivel,
        atk: movimiento.categoria === 'fisico' ? atacante.atk : atacante.atkEsp,
        tipos: atacante.tipos,
      },
      {
        def: movimiento.categoria === 'fisico' ? defensor.def : defensor.defEsp,
        tipos: defensor.tipos,
      },
      { poder: movimiento.poder, tipo: movimiento.tipo },
      this.rng,
    );

    defensor.recibirDanio(resultado.danio);

    const sufijo =
      resultado.esCritico ? ' — ¡Golpe crítico!' :
      resultado.efectividad > 1 ? ' — ¡Es muy efectivo!' :
      resultado.efectividad < 1 ? ' — No es muy efectivo...' : '';

    this.emitir({ tipo: 'mensaje', mensaje: `${atacante.especie.nombre} usó ${movimiento.nombre}${sufijo}` });
    this.emitir({
      tipo: esJugador ? 'danio_jugador' : 'danio_rival',
      cantidad: resultado.danio,
      nuevoHp: defensor.hpActual,
      critico: resultado.esCritico,
      efectividad: resultado.efectividad,
    });

    const efecto = movimiento.efecto;
    if (efecto?.tipo === 'envenenar' && defensor.estadoAlterado === null && defensor.estaVivo) {
      defensor.estadoAlterado = 'envenenado';
      this.emitir({ tipo: 'envenenado', mensaje: `¡${defensor.especie.nombre} fue envenenado!` });
    }

    if (!defensor.estaVivo) {
      this.emitir({
        tipo: esJugador ? 'desmayo_jugador' : 'desmayo_rival',
        mensaje: `¡${defensor.especie.nombre} se desmayó!`,
      });
    }
  }

  private emitir(evento: EventoBatalla): void { this.cola.push(evento); }
  private vaciarCola(): EventoBatalla[] { const e = [...this.cola]; this.cola = []; return e; }
}
