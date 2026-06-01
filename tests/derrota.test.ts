import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState, crearCriaturaGuardada } from '@/state/GameState';
import { RESPAWN_POR_BIOMA } from '@/config';

// localStorage no existe en Node — stub mínimo para que guardar()/cargar() no rompan
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

beforeEach(() => {
  GameState.iniciarNuevaPartida('Test', 'hornero');
});

// ── respawnTrasDerrota ─────────────────────────────────────────────────────────

describe('GameState.respawnTrasDerrota', () => {
  it('cura a HP máximo todas las criaturas del equipo', () => {
    GameState.datos.equipo[0].hpActual = 0;

    GameState.respawnTrasDerrota();

    expect(GameState.datos.equipo[0].hpActual).toBe(GameState.datos.equipo[0].hpMaxCacheado);
    expect(GameState.datos.equipo[0].hpActual).toBeGreaterThan(0);
  });

  it('limpia el estado alterado de todas las criaturas', () => {
    GameState.datos.equipo[0].estadoAlterado = 'envenenado';
    GameState.datos.equipo[0].hpActual = 0;

    GameState.respawnTrasDerrota();

    expect(GameState.datos.equipo[0].estadoAlterado).toBe('ninguno');
  });

  it('restaura los PP de movimientos', () => {
    GameState.datos.equipo[0].hpActual = 0;
    GameState.datos.equipo[0].ppActuales = [0, 0, 0, 0];

    GameState.respawnTrasDerrota();

    const tieneAlgunPP = GameState.datos.equipo[0].ppActuales.some((pp) => pp > 0);
    expect(tieneAlgunPP).toBe(true);
  });

  it('reposiciona al jugador en el respawn del bioma pampa', () => {
    GameState.datos.posicion = { x: 50, y: 10 };

    GameState.respawnTrasDerrota();

    const respawn = RESPAWN_POR_BIOMA['pampa'];
    expect(GameState.datos.posicion.x).toBe(respawn.x);
    expect(GameState.datos.posicion.y).toBe(respawn.y);
  });

  it('invariante: al menos una criatura viva tras el respawn', () => {
    for (const c of GameState.datos.equipo) c.hpActual = 0;

    GameState.respawnTrasDerrota();

    const hayViva = GameState.datos.equipo.some((c) => c.hpActual > 0);
    expect(hayViva).toBe(true);
  });

  it('cura equipo de 3 criaturas con todas muertas', () => {
    GameState.agregarAlEquipo(crearCriaturaGuardada('mara', 5));
    GameState.agregarAlEquipo(crearCriaturaGuardada('vizcacha', 5));

    for (const c of GameState.datos.equipo) c.hpActual = 0;

    GameState.respawnTrasDerrota();

    for (const c of GameState.datos.equipo) {
      expect(c.hpActual).toBe(c.hpMaxCacheado);
      expect(c.estadoAlterado).toBe('ninguno');
    }
  });

  it('el save posterior al respawn persiste el equipo curado', () => {
    GameState.datos.equipo[0].hpActual = 0;
    GameState.respawnTrasDerrota();
    GameState.guardar();

    // guardar() llama localStorage.setItem; verificar que se llamó con HP curado
    const setItem = vi.mocked(localStorage.setItem);
    const lastCall = setItem.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const saved = JSON.parse(lastCall![1]);
    expect(saved.equipo[0].hpActual).toBeGreaterThan(0);
    expect(saved.posicion).toEqual(RESPAWN_POR_BIOMA['pampa']);
  });
});

// ── RESPAWN_POR_BIOMA ──────────────────────────────────────────────────────────

describe('RESPAWN_POR_BIOMA', () => {
  it('define el punto de respawn para pampa en (2, 15)', () => {
    expect(RESPAWN_POR_BIOMA['pampa']).toEqual({ x: 2, y: 15 });
  });
});
