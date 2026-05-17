import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  inicializarProgreso,
  exportarProgreso,
  obtenerFlag,
  setearFlag,
  obtenerContador,
  setearContador,
  incrementarContador,
  obtenerVariable,
  setearVariable,
} from '@/systems/Progress';

// Reiniciar el estado de progreso antes de cada test
beforeEach(() => {
  inicializarProgreso();
});

// ── Flags ────────────────────────────────────────────────────────────────────

describe('Progress — flags', () => {
  it('obtenerFlag lanza error con mensaje útil para flag desconocida', () => {
    expect(() => obtenerFlag('trainer.inexistente')).toThrow(/Flag desconocida.*trainer\.inexistente/);
  });

  it('setearFlag lanza error para flag desconocida', () => {
    expect(() => setearFlag('trainer.inexistente', true)).toThrow(/Flag desconocida.*trainer\.inexistente/);
  });

  it('obtenerFlag retorna el default (false) antes de setear', () => {
    expect(obtenerFlag('trainer.peon_defeated')).toBe(false);
    expect(obtenerFlag('biome.pampa_completed')).toBe(false);
  });

  it('setearFlag(trainer.capataz_defeated, true) también setea biome.pampa_completed a true', () => {
    setearFlag('trainer.capataz_defeated', true);
    expect(obtenerFlag('trainer.capataz_defeated')).toBe(true);
    expect(obtenerFlag('biome.pampa_completed')).toBe(true);
  });

  it('setearFlag(trainer.capataz_defeated, false) no setea biome.pampa_completed', () => {
    setearFlag('trainer.capataz_defeated', false);
    expect(obtenerFlag('biome.pampa_completed')).toBe(false);
  });

  it('flags independientes no se afectan entre sí', () => {
    setearFlag('trainer.peon_defeated', true);
    expect(obtenerFlag('trainer.maestra_rural_defeated')).toBe(false);
    expect(obtenerFlag('trainer.capataz_defeated')).toBe(false);
  });
});

// ── Counters ─────────────────────────────────────────────────────────────────

describe('Progress — counters', () => {
  it('obtenerContador retorna el default (0) antes de cualquier operación', () => {
    expect(obtenerContador('stats.battles_won')).toBe(0);
    expect(obtenerContador('stats.captures_total')).toBe(0);
    expect(obtenerContador('stats.steps_walked')).toBe(0);
  });

  it('incrementarContador sin argumento suma 1', () => {
    incrementarContador('stats.battles_won');
    expect(obtenerContador('stats.battles_won')).toBe(1);
  });

  it('incrementarContador con argumento suma ese valor', () => {
    incrementarContador('stats.steps_walked', 10);
    expect(obtenerContador('stats.steps_walked')).toBe(10);
  });

  it('incrementarContador acumula llamadas sucesivas', () => {
    incrementarContador('stats.captures_total');
    incrementarContador('stats.captures_total');
    incrementarContador('stats.captures_total', 3);
    expect(obtenerContador('stats.captures_total')).toBe(5);
  });

  it('setearContador establece el valor exacto', () => {
    setearContador('stats.battles_won', 42);
    expect(obtenerContador('stats.battles_won')).toBe(42);
  });

  it('obtenerContador lanza error para counter desconocido', () => {
    expect(() => obtenerContador('stats.inexistente')).toThrow(/Contador desconocido.*stats\.inexistente/);
  });

  it('incrementarContador lanza error para counter desconocido', () => {
    expect(() => incrementarContador('stats.inexistente')).toThrow(/Contador desconocido/);
  });
});

// ── Variables ─────────────────────────────────────────────────────────────────

describe('Progress — variables', () => {
  it('setearVariable lanza error para variable desconocida (sección vacía en este sprint)', () => {
    expect(() => setearVariable('story.current_chapter', 'intro')).toThrow(/Variable desconocida/);
  });

  it('obtenerVariable lanza error para variable desconocida', () => {
    expect(() => obtenerVariable('story.current_chapter')).toThrow(/Variable desconocida/);
  });
});

// ── Persistencia ──────────────────────────────────────────────────────────────

describe('Progress — persistencia', () => {
  it('exportarProgreso e inicializarProgreso preservan flags y counters', () => {
    setearFlag('trainer.peon_defeated', true);
    setearFlag('trainer.maestra_rural_defeated', true);
    incrementarContador('stats.battles_won', 3);
    incrementarContador('stats.steps_walked', 100);

    const snapshot = exportarProgreso();

    // Reiniciar a defaults
    inicializarProgreso();
    expect(obtenerFlag('trainer.peon_defeated')).toBe(false);
    expect(obtenerContador('stats.battles_won')).toBe(0);

    // Restaurar desde snapshot
    inicializarProgreso(snapshot);
    expect(obtenerFlag('trainer.peon_defeated')).toBe(true);
    expect(obtenerFlag('trainer.maestra_rural_defeated')).toBe(true);
    expect(obtenerContador('stats.battles_won')).toBe(3);
    expect(obtenerContador('stats.steps_walked')).toBe(100);
  });

  it('inicializarProgreso sin args restablece todo a defaults', () => {
    setearFlag('trainer.capataz_defeated', true);
    incrementarContador('stats.captures_total', 6);

    inicializarProgreso();

    expect(obtenerFlag('trainer.capataz_defeated')).toBe(false);
    expect(obtenerFlag('biome.pampa_completed')).toBe(false);
    expect(obtenerContador('stats.captures_total')).toBe(0);
  });

  it('inicializarProgreso con snapshot parcial usa defaults para keys ausentes', () => {
    inicializarProgreso({ flags: { 'trainer.peon_defeated': true }, counters: {} });
    expect(obtenerFlag('trainer.peon_defeated')).toBe(true);
    expect(obtenerFlag('trainer.maestra_rural_defeated')).toBe(false);
    expect(obtenerContador('stats.battles_won')).toBe(0);
  });
});

// ── Save versioning (GameState) ───────────────────────────────────────────────

describe('GameState — save versioning', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('descarta el save si version es menor a 2', async () => {
    const { GameState } = await import('@/state/GameState');
    store['pampamon_save_v2'] = JSON.stringify({ version: 1, nombreJugador: 'test' });
    expect(GameState.cargar()).toBe(false);
  });

  it('descarta el save si no tiene campo version', async () => {
    const { GameState } = await import('@/state/GameState');
    store['pampamon_save_v2'] = JSON.stringify({ nombreJugador: 'sin_version' });
    expect(GameState.cargar()).toBe(false);
  });

  it('retorna false si no hay save en localStorage', async () => {
    const { GameState } = await import('@/state/GameState');
    expect(GameState.cargar()).toBe(false);
  });
});
