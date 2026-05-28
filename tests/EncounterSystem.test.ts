import { describe, it, expect } from 'vitest';
import { intentarEncuentro } from '@/systems/EncounterSystem';
import { crearRNG } from '@/utils/rng';

// RNG con chance(p) = true siempre para p > 0: usamos seed que produzca next() = 0
// Más simple: llamamos muchas veces y verificamos el comportamiento estadístico.

describe('intentarEncuentro — zoneId sin tabla', () => {
  it('zona sin tabla devuelve null sin error', () => {
    const rng = crearRNG(1);
    expect(intentarEncuentro('pampa_pueblo', 'pasto_alto', rng)).toBeNull();
    expect(intentarEncuentro('zona_inexistente', 'pasto_alto', rng)).toBeNull();
  });
});

describe('intentarEncuentro — tipoTile no coincide', () => {
  it('pasto_alto en pampa_cazadores (tabla exige monte) → null', () => {
    // Aunque tiremos 1000 veces, nunca debería matchear el tipoTile
    const rng = crearRNG(42);
    let alguno = false;
    for (let i = 0; i < 100; i++) {
      if (intentarEncuentro('pampa_cazadores', 'pasto_alto', rng) !== null) alguno = true;
    }
    expect(alguno).toBe(false);
  });

  it('pasto bajo en pampa_wild_low (tabla exige pasto_alto) → null', () => {
    const rng = crearRNG(7);
    let alguno = false;
    for (let i = 0; i < 100; i++) {
      if (intentarEncuentro('pampa_wild_low', 'pasto', rng) !== null) alguno = true;
    }
    expect(alguno).toBe(false);
  });
});

describe('intentarEncuentro — pampa_wild_low', () => {
  it('pasto_alto en pampa_wild_low produce encuentros con niveles 3-7', () => {
    const rng = crearRNG(1234);
    const encuentros: Array<{ especieId: string; nivel: number }> = [];
    // Con rate=0.10, necesitamos muchos intentos para acumular encuentros
    for (let i = 0; i < 2000; i++) {
      const r = intentarEncuentro('pampa_wild_low', 'pasto_alto', rng);
      if (r) encuentros.push(r);
    }
    expect(encuentros.length).toBeGreaterThan(0);
    for (const e of encuentros) {
      expect(e.nivel).toBeGreaterThanOrEqual(3);
      expect(e.nivel).toBeLessThanOrEqual(7);
    }
  });

  it('criaturas de pampa_wild_low son del set esperado', () => {
    const permitidas = new Set(['mara', 'vizcacha', 'nandu', 'peludo', 'yarara']);
    const rng = crearRNG(9999);
    for (let i = 0; i < 2000; i++) {
      const r = intentarEncuentro('pampa_wild_low', 'pasto_alto', rng);
      if (r) expect(permitidas.has(r.especieId)).toBe(true);
    }
  });
});

describe('intentarEncuentro — pampa_wild_high', () => {
  it('pasto_alto en pampa_wild_high produce encuentros con niveles 8-12', () => {
    const rng = crearRNG(5678);
    const encuentros: Array<{ especieId: string; nivel: number }> = [];
    for (let i = 0; i < 2000; i++) {
      const r = intentarEncuentro('pampa_wild_high', 'pasto_alto', rng);
      if (r) encuentros.push(r);
    }
    expect(encuentros.length).toBeGreaterThan(0);
    for (const e of encuentros) {
      expect(e.nivel).toBeGreaterThanOrEqual(8);
      expect(e.nivel).toBeLessThanOrEqual(12);
    }
  });
});

describe('intentarEncuentro — pampa_cazadores', () => {
  it('monte en pampa_cazadores produce solo jabalí', () => {
    const rng = crearRNG(1111);
    const encuentros: Array<{ especieId: string; nivel: number }> = [];
    // rate=0.05, necesitamos más intentos
    for (let i = 0; i < 5000; i++) {
      const r = intentarEncuentro('pampa_cazadores', 'monte', rng);
      if (r) encuentros.push(r);
    }
    expect(encuentros.length).toBeGreaterThan(0);
    for (const e of encuentros) {
      expect(e.especieId).toBe('jabali');
      expect(e.nivel).toBeGreaterThanOrEqual(7);
      expect(e.nivel).toBeLessThanOrEqual(10);
    }
  });
});
