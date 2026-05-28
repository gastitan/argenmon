import type { EspecieId } from '@/data/creatures';
import { ESPECIES, calcularHP } from '@/data/creatures';
import { MOVIMIENTOS } from '@/data/moves';
import type { TrampaId } from '@/data/items';
import { movimientosAlNivel } from '@/systems/Movepool';
import * as Progress from '@/systems/Progress';
import type { ProgressoGuardado } from '@/systems/Progress';

export const VERSION_SAVE = 4;
const SAVE_KEY = 'pampamon_save_v4';

export interface CriaturaGuardada {
  uid: string;
  especieId: EspecieId;
  nivel: number;
  expActual: number;
  expParaSiguienteNivel: number;
  hpActual: number;
  hpMaxCacheado: number;
  ppActuales: [number, number, number, number];
  movimientosActuales: string[];
  movimientosAprendidos: string[];
  estadoAlterado: 'envenenado' | 'ninguno';
  modificadores: {
    atk: number;
    def: number;
    atkEsp: number;
    defEsp: number;
    vel: number;
    evasion: number;
    precision: number;
  };
}

export interface PlayerState {
  version: number;
  nombreJugador: string;
  biomaActual: string;
  posicion: { x: number; y: number };
  equipo: CriaturaGuardada[];
  inventario: { trampaComun: number; trampaMonte: number; trampaFina: number };
  catalogo: Partial<Record<EspecieId, 'visto' | 'capturado'>>;
  mundo: {
    eventosVistos: string[];
    objetosRecogidos: string[];
    tilesModificados: Record<string, number>;
  };
  progreso: ProgressoGuardado;
  ultimoGuardado: number;
}

function generarUid(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function calcularExpParaSiguienteNivel(nivel: number): number {
  return nivel * nivel * 4;
}

export function crearCriaturaGuardada(especieId: EspecieId, nivel: number): CriaturaGuardada {
  const especie = ESPECIES[especieId];
  const hpMax = calcularHP(especie.hpBase, nivel);
  const movIds = movimientosAlNivel(especieId, nivel);
  const ppActuales: [number, number, number, number] = [
    MOVIMIENTOS[movIds[0]]?.pp ?? 0,
    MOVIMIENTOS[movIds[1]]?.pp ?? 0,
    MOVIMIENTOS[movIds[2]]?.pp ?? 0,
    MOVIMIENTOS[movIds[3]]?.pp ?? 0,
  ];

  return {
    uid: generarUid(),
    especieId,
    nivel,
    expActual: 0,
    expParaSiguienteNivel: calcularExpParaSiguienteNivel(nivel),
    hpActual: hpMax,
    hpMaxCacheado: hpMax,
    ppActuales,
    movimientosActuales: [...movIds],
    movimientosAprendidos: [...movIds],
    estadoAlterado: 'ninguno',
    modificadores: { atk: 0, def: 0, atkEsp: 0, defEsp: 0, vel: 0, evasion: 0, precision: 0 },
  };
}

function crearEstadoInicial(): PlayerState {
  return {
    version: VERSION_SAVE,
    nombreJugador: '',
    biomaActual: 'pampa',
    posicion: { x: 2, y: 15 },
    equipo: [],
    inventario: { trampaComun: 3, trampaMonte: 0, trampaFina: 0 },
    catalogo: {},
    mundo: {
      eventosVistos: [],
      objetosRecogidos: [],
      tilesModificados: {},
    },
    progreso: { flags: {}, counters: {}, variables: {} },
    ultimoGuardado: 0,
  };
}

class GameStateManager {
  private state: PlayerState = crearEstadoInicial();

  get datos(): PlayerState {
    return this.state;
  }

  haySave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  iniciarNuevaPartida(nombre: string, criaturaInicial: EspecieId): void {
    this.state = crearEstadoInicial();
    this.state.nombreJugador = nombre;
    this.state.equipo = [crearCriaturaGuardada(criaturaInicial, 5)];
    Progress.inicializarProgreso();
  }

  cargar(): boolean {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as PlayerState;
      if (!parsed.version || parsed.version < VERSION_SAVE) {
        console.log('[GameState] Save descartado: versión incompatible (se requiere v4). El mapa cambió — iniciando partida nueva.');
        return false;
      }
      this.state = parsed;
      Progress.inicializarProgreso(parsed.progreso);
      return true;
    } catch {
      return false;
    }
  }

  guardar(): void {
    this.state.progreso = Progress.exportarProgreso();
    this.state.ultimoGuardado = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
  }

  borrarSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  usarTrampa(trampaId: TrampaId): boolean {
    if (this.state.inventario[trampaId] <= 0) return false;
    this.state.inventario[trampaId]--;
    return true;
  }

  curarEquipoCompleto(): void {
    for (const criatura of this.state.equipo) {
      criatura.hpActual = criatura.hpMaxCacheado;
      criatura.estadoAlterado = 'ninguno';
      const pps = criatura.movimientosActuales.map((id) => MOVIMIENTOS[id]?.pp ?? 0);
      criatura.ppActuales = [pps[0] ?? 0, pps[1] ?? 0, pps[2] ?? 0, pps[3] ?? 0];
    }
  }

  agregarAlEquipo(criatura: CriaturaGuardada): boolean {
    if (this.state.equipo.length >= 3) return false;
    this.state.equipo.push(criatura);
    return true;
  }

  reemplazarEnEquipo(indice: number, criatura: CriaturaGuardada): void {
    this.state.equipo[indice] = criatura;
  }

  actualizarCriatura(uid: string, cambios: Partial<CriaturaGuardada>): void {
    const idx = this.state.equipo.findIndex((c) => c.uid === uid);
    if (idx === -1) return;
    this.state.equipo[idx] = { ...this.state.equipo[idx], ...cambios };
  }

  resetearModificadoresCombate(): void {
    for (const criatura of this.state.equipo) {
      criatura.modificadores = { atk: 0, def: 0, atkEsp: 0, defEsp: 0, vel: 0, evasion: 0, precision: 0 };
    }
  }

  marcarVisto(especieId: EspecieId): void {
    if (this.state.catalogo[especieId] !== 'capturado') {
      this.state.catalogo[especieId] = 'visto';
    }
  }

  marcarCapturado(especieId: EspecieId): void {
    this.state.catalogo[especieId] = 'capturado';
    this.guardar();
  }

  modificarTile(x: number, y: number, nuevoTipo: number): void {
    const clave = `${this.state.biomaActual}:${x},${y}`;
    this.state.mundo.tilesModificados[clave] = nuevoTipo;
  }

  obtenerTipoTile(x: number, y: number, tipoOriginal: number): number {
    const clave = `${this.state.biomaActual}:${x},${y}`;
    return this.state.mundo.tilesModificados[clave] ?? tipoOriginal;
  }

  actualizarPosicion(x: number, y: number): void {
    this.state.posicion = { x, y };
  }

  // ── API de progresión ────────────────────────────────────────────────────────

  obtenerFlag(id: string): boolean { return Progress.obtenerFlag(id); }
  setearFlag(id: string, valor: boolean): void { Progress.setearFlag(id, valor); }

  obtenerContador(id: string): number { return Progress.obtenerContador(id); }
  setearContador(id: string, valor: number): void { Progress.setearContador(id, valor); }
  incrementarContador(id: string, cantidad?: number): void { Progress.incrementarContador(id, cantidad); }

  obtenerVariable(id: string): string { return Progress.obtenerVariable(id); }
  setearVariable(id: string, valor: string): void { Progress.setearVariable(id, valor); }

  exponer(): void {
    (window as unknown as Record<string, unknown>).GameState = this;
  }
}

export const GameState = new GameStateManager();
export type Inventario = PlayerState['inventario'];
