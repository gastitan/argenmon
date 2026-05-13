import type { EspecieId } from '@/data/creatures';
import { ESPECIES, calcularHP } from '@/data/creatures';
import { MOVIMIENTOS } from '@/data/moves';
import type { TrampaId } from '@/data/items';

export const VERSION_SAVE = 1;
const SAVE_KEY = 'pampamon_save_v1';

export interface CriaturaGuardada {
  uid: string;
  especieId: EspecieId;
  nivel: number;
  expActual: number;
  expParaSiguienteNivel: number;
  hpActual: number;
  hpMaxCacheado: number;
  ppActuales: [number, number, number, number];
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
    entrenadoresDerrotados: string[];
    eventosVistos: string[];
    objetosRecogidos: string[];
    tilesModificados: Record<string, number>;
    jefeDerrotado: boolean;
  };
  ultimoGuardado: number;
}

function generarUid(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function calcularExpParaSiguienteNivel(nivel: number): number {
  return nivel * nivel * 4;
}

function crearCriaturaGuardada(especieId: EspecieId, nivel: number): CriaturaGuardada {
  const especie = ESPECIES[especieId];
  const hpMax = calcularHP(especie.hpBase, nivel);
  const moves = especie.movimientosIniciales;
  const ppActuales: [number, number, number, number] = [
    MOVIMIENTOS[moves[0]]?.pp ?? 0,
    MOVIMIENTOS[moves[1]]?.pp ?? 0,
    MOVIMIENTOS[moves[2]]?.pp ?? 0,
    MOVIMIENTOS[moves[3]]?.pp ?? 0,
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
    estadoAlterado: 'ninguno',
    modificadores: { atk: 0, def: 0, atkEsp: 0, defEsp: 0, vel: 0, evasion: 0, precision: 0 },
  };
}

function crearEstadoInicial(): PlayerState {
  return {
    version: VERSION_SAVE,
    nombreJugador: '',
    biomaActual: 'pampa',
    posicion: { x: 5, y: 5 },
    equipo: [],
    inventario: { trampaComun: 3, trampaMonte: 0, trampaFina: 0 },
    catalogo: {},
    mundo: {
      entrenadoresDerrotados: [],
      eventosVistos: [],
      objetosRecogidos: [],
      tilesModificados: {},
      jefeDerrotado: false,
    },
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
  }

  cargar(): boolean {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as PlayerState;
      if (parsed.version !== VERSION_SAVE) return false;
      this.state = parsed;
      return true;
    } catch {
      return false;
    }
  }

  guardar(): void {
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
      const especie = ESPECIES[criatura.especieId];
      const moves = especie.movimientosIniciales;
      criatura.hpActual = criatura.hpMaxCacheado;
      criatura.ppActuales = [
        MOVIMIENTOS[moves[0]]?.pp ?? 0,
        MOVIMIENTOS[moves[1]]?.pp ?? 0,
        MOVIMIENTOS[moves[2]]?.pp ?? 0,
        MOVIMIENTOS[moves[3]]?.pp ?? 0,
      ];
      criatura.estadoAlterado = 'ninguno';
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

  derrotarEntrenador(id: string): void {
    if (!this.state.mundo.entrenadoresDerrotados.includes(id)) {
      this.state.mundo.entrenadoresDerrotados.push(id);
    }
    this.guardar();
  }

  entrenadorDerrotado(id: string): boolean {
    return this.state.mundo.entrenadoresDerrotados.includes(id);
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

  exponer(): void {
    (window as unknown as Record<string, unknown>).GameState = this;
  }
}

export const GameState = new GameStateManager();
export { crearCriaturaGuardada };
export type Inventario = PlayerState['inventario'];
