import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/state/GameState', () => ({
  GameState: {
    datos: {
      inventario: { trampaComun: 0, trampaMonte: 0, trampaFina: 0 },
    },
  },
}));

import { DebugCommands } from '@/debug/DebugCommands';
import { GameState } from '@/state/GameState';

beforeEach(() => {
  GameState.datos.inventario.trampaComun = 0;
  GameState.datos.inventario.trampaMonte = 0;
  GameState.datos.inventario.trampaFina = 0;
});

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
