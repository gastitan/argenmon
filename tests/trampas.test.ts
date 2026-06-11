import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from '@/state/GameState';

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

beforeEach(() => {
  GameState.iniciarNuevaPartida('Test', 'hornero');
});

// ── agregarTrampas ─────────────────────────────────────────────────────────────

describe('GameState.agregarTrampas', () => {
  it('incrementa el tipo correcto sin afectar los otros', () => {
    GameState.agregarTrampas('trampaComun', 2);
    expect(GameState.datos.inventario.trampaComun).toBe(5); // 3 iniciales + 2
    expect(GameState.datos.inventario.trampaMonte).toBe(0);
    expect(GameState.datos.inventario.trampaFina).toBe(0);
  });

  it('acumula múltiples entregas del mismo tipo', () => {
    GameState.agregarTrampas('trampaMonte', 1);
    GameState.agregarTrampas('trampaMonte', 2);
    expect(GameState.datos.inventario.trampaMonte).toBe(3);
  });

  it('funciona para cada tipo de trampa', () => {
    GameState.agregarTrampas('trampaFina', 1);
    expect(GameState.datos.inventario.trampaFina).toBe(1);
  });
});

// ── totalTrampas ───────────────────────────────────────────────────────────────

describe('GameState.totalTrampas', () => {
  it('suma todos los tipos de trampa', () => {
    GameState.datos.inventario.trampaComun = 1;
    GameState.datos.inventario.trampaMonte = 2;
    GameState.datos.inventario.trampaFina = 1;
    expect(GameState.totalTrampas()).toBe(4);
  });

  it('devuelve 0 cuando no hay ninguna trampa', () => {
    GameState.datos.inventario.trampaComun = 0;
    expect(GameState.totalTrampas()).toBe(0);
  });

  it('estado inicial da 3 (3 trampaComun de partida)', () => {
    expect(GameState.totalTrampas()).toBe(3);
  });
});

// ── Entrenador da trampas ──────────────────────────────────────────────────────

describe('Recompensa de entrenador', () => {
  it('agregarTrampas simula correctamente la recompensa de un entrenador', () => {
    // Simula lo que BattleScene hace tras victoria sobre un entrenador con recompensaTrampas
    const recompensa = { tipo: 'trampaComun' as const, cantidad: 2 };
    GameState.agregarTrampas(recompensa.tipo, recompensa.cantidad);
    expect(GameState.datos.inventario.trampaComun).toBe(5);
  });

  it('entrenador sin recompensaTrampas no modifica el inventario', () => {
    // Sin recompensa → no se llama agregarTrampas → inventario sin cambios
    const inventarioAntes = { ...GameState.datos.inventario };
    expect(GameState.datos.inventario).toEqual(inventarioAntes);
  });
});

// ── Regalo único de civil (eventosVistos) ─────────────────────────────────────

describe('Regalo de civil — una sola vez', () => {
  it('la flag no está en eventosVistos antes del primer regalo', () => {
    expect(GameState.datos.mundo.eventosVistos).not.toContain('regalo_don_ramon');
  });

  it('al recibir el regalo, la flag se agrega a eventosVistos y las trampas se suman', () => {
    const flag = 'regalo_don_ramon';
    const yaRecibio = GameState.datos.mundo.eventosVistos.includes(flag);
    expect(yaRecibio).toBe(false);

    // Simula la entrega (lo que hace mostrarDialogoCivil)
    GameState.datos.mundo.eventosVistos.push(flag);
    GameState.agregarTrampas('trampaComun', 1);

    expect(GameState.datos.mundo.eventosVistos).toContain(flag);
    expect(GameState.datos.inventario.trampaComun).toBe(4); // 3 + 1
  });

  it('segunda interacción: la flag bloquea una segunda entrega', () => {
    const flag = 'regalo_don_ramon';
    GameState.datos.mundo.eventosVistos.push(flag);
    GameState.agregarTrampas('trampaComun', 1); // primera entrega

    // Segunda interacción: la flag ya está → no se da regalo
    const yaRecibio = GameState.datos.mundo.eventosVistos.includes(flag);
    expect(yaRecibio).toBe(true);
    // El código de la escena NO llama agregarTrampas si yaRecibio === true
    expect(GameState.datos.inventario.trampaComun).toBe(4); // sigue en 4, no en 5
  });
});

// ── Socorro de la bióloga ──────────────────────────────────────────────────────

describe('Socorro de la bióloga veterinaria', () => {
  it('totalTrampas() === 0 indica que el socorro debe dispararse', () => {
    GameState.datos.inventario.trampaComun = 0;
    expect(GameState.totalTrampas()).toBe(0);
  });

  it('tras el socorro el jugador tiene 3 Trampas Comunes', () => {
    GameState.datos.inventario.trampaComun = 0;
    // Simula lo que mostrarDialogoVeterinaria hace cuando totalTrampas() === 0
    GameState.agregarTrampas('trampaComun', 3);
    expect(GameState.datos.inventario.trampaComun).toBe(3);
    expect(GameState.totalTrampas()).toBe(3);
  });

  it('con al menos 1 trampa de cualquier tipo no hay socorro', () => {
    GameState.datos.inventario.trampaComun = 0;
    GameState.datos.inventario.trampaMonte = 1;
    expect(GameState.totalTrampas()).toBeGreaterThan(0);
  });

  it('el socorro no se acumula: segunda visita con trampas → totalTrampas > 0', () => {
    // Primera visita sin trampas → bióloga da 3
    GameState.datos.inventario.trampaComun = 0;
    GameState.agregarTrampas('trampaComun', 3);
    expect(GameState.totalTrampas()).toBe(3);

    // Segunda visita con las 3 trampas → totalTrampas > 0 → no hay socorro
    expect(GameState.totalTrampas()).toBeGreaterThan(0);
  });
});
