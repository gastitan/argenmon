import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CriaturaGuardada } from '@/state/GameState';

const { mockEquipo, mockActualizarCriatura } = vi.hoisted(() => {
  const mockEquipo: CriaturaGuardada[] = [];
  const mockActualizarCriatura = vi.fn((uid: string, cambios: Partial<CriaturaGuardada>) => {
    const idx = mockEquipo.findIndex((c) => c.uid === uid);
    if (idx !== -1) Object.assign(mockEquipo[idx], cambios);
  });
  return { mockEquipo, mockActualizarCriatura };
});

vi.mock('@/state/GameState', () => ({
  GameState: {
    datos: {
      inventario: { trampaComun: 0, trampaMonte: 0, trampaFina: 0 },
      equipo: mockEquipo,
    },
    actualizarCriatura: mockActualizarCriatura,
  },
  calcularExpParaSiguienteNivel: (nivel: number) => nivel * nivel * 4,
}));

import { DebugCommands } from '@/debug/DebugCommands';
import { GameState } from '@/state/GameState';

const makeCriatura = (uid: string, especieId = 'hornero', nivel = 5): CriaturaGuardada => ({
  uid,
  especieId: especieId as CriaturaGuardada['especieId'],
  nivel,
  expActual: 0,
  expParaSiguienteNivel: nivel * nivel * 4,
  hpActual: 20,
  hpMaxCacheado: 20,
  ppActuales: [30, 35, 0, 0],
  movimientosActuales: ['picotazo', 'embestida'],
  movimientosAprendidos: ['picotazo', 'embestida'],
  estadoAlterado: 'ninguno',
  modificadores: { atk: 0, def: 0, atkEsp: 0, defEsp: 0, vel: 0, evasion: 0, precision: 0 },
});

beforeEach(() => {
  GameState.datos.inventario.trampaComun = 0;
  GameState.datos.inventario.trampaMonte = 0;
  GameState.datos.inventario.trampaFina = 0;
  mockEquipo.splice(0);
  mockActualizarCriatura.mockClear();
});

// ── fillTraps ─────────────────────────────────────────────────────────────────

describe('DebugCommands.fillTraps', () => {
  it('llena las 3 trampas a 10 unidades', () => {
    DebugCommands.fillTraps();
    expect(GameState.datos.inventario.trampaComun).toBe(10);
    expect(GameState.datos.inventario.trampaMonte).toBe(10);
    expect(GameState.datos.inventario.trampaFina).toBe(10);
  });

  it('reemplaza el valor previo sin sumar', () => {
    GameState.datos.inventario.trampaComun = 3;
    GameState.datos.inventario.trampaMonte = 5;
    GameState.datos.inventario.trampaFina = 1;
    DebugCommands.fillTraps();
    expect(GameState.datos.inventario.trampaComun).toBe(10);
    expect(GameState.datos.inventario.trampaMonte).toBe(10);
    expect(GameState.datos.inventario.trampaFina).toBe(10);
  });
});

// ── dumpState ─────────────────────────────────────────────────────────────────

describe('DebugCommands.dumpState', () => {
  it('existe como función', () => {
    expect(typeof DebugCommands.dumpState).toBe('function');
  });

  it('no muta el estado', () => {
    GameState.datos.inventario.trampaComun = 7;
    DebugCommands.dumpState();
    expect(GameState.datos.inventario.trampaComun).toBe(7);
  });
});

// ── levelUp ───────────────────────────────────────────────────────────────────

describe('DebugCommands.levelUp', () => {
  it('sube 1 nivel por defecto (índice 0)', () => {
    mockEquipo.push(makeCriatura('uid-1'));
    DebugCommands.levelUp();
    expect(mockActualizarCriatura).toHaveBeenCalledOnce();
    expect(mockActualizarCriatura.mock.calls[0][1].nivel).toBe(6);
  });

  it('sube la cantidad indicada de niveles', () => {
    mockEquipo.push(makeCriatura('uid-1'));
    DebugCommands.levelUp(0, 5);
    expect(mockActualizarCriatura.mock.calls[0][1].nivel).toBe(10);
  });

  it('no supera nivel 100', () => {
    mockEquipo.push(makeCriatura('uid-1', 'hornero', 99));
    DebugCommands.levelUp(0, 10);
    expect(mockActualizarCriatura.mock.calls[0][1].nivel).toBe(100);
  });

  it('restaura HP al nuevo máximo', () => {
    mockEquipo.push(makeCriatura('uid-1'));
    DebugCommands.levelUp();
    const cambios = mockActualizarCriatura.mock.calls[0][1];
    expect(cambios.hpActual).toBe(cambios.hpMaxCacheado);
    expect(cambios.hpMaxCacheado).toBeGreaterThan(20);
  });

  it('incluye movimientos del nuevo nivel', () => {
    mockEquipo.push(makeCriatura('uid-1'));
    DebugCommands.levelUp();
    const cambios = mockActualizarCriatura.mock.calls[0][1];
    expect(Array.isArray(cambios.movimientosActuales)).toBe(true);
    expect(cambios.movimientosActuales.length).toBeGreaterThan(0);
  });

  it('no hace nada si el equipo está vacío', () => {
    DebugCommands.levelUp();
    expect(mockActualizarCriatura).not.toHaveBeenCalled();
  });

  it('no hace nada si el índice está fuera de rango', () => {
    mockEquipo.push(makeCriatura('uid-1'));
    DebugCommands.levelUp(5);
    expect(mockActualizarCriatura).not.toHaveBeenCalled();
  });
});

// ── removeCreature ────────────────────────────────────────────────────────────

describe('DebugCommands.removeCreature', () => {
  it('elimina la criatura en el índice dado', () => {
    mockEquipo.push(makeCriatura('uid-1'), makeCriatura('uid-2', 'mara'));
    DebugCommands.removeCreature(0);
    expect(mockEquipo).toHaveLength(1);
    expect(mockEquipo[0].uid).toBe('uid-2');
  });

  it('elimina por índice distinto de 0', () => {
    mockEquipo.push(makeCriatura('uid-1'), makeCriatura('uid-2', 'mara'));
    DebugCommands.removeCreature(1);
    expect(mockEquipo).toHaveLength(1);
    expect(mockEquipo[0].uid).toBe('uid-1');
  });

  it('no elimina la última criatura del equipo', () => {
    mockEquipo.push(makeCriatura('uid-1'));
    DebugCommands.removeCreature(0);
    expect(mockEquipo).toHaveLength(1);
  });

  it('no elimina si el índice está fuera de rango', () => {
    mockEquipo.push(makeCriatura('uid-1'), makeCriatura('uid-2', 'mara'));
    DebugCommands.removeCreature(5);
    expect(mockEquipo).toHaveLength(2);
  });
});
