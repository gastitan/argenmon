import { describe, it, expect } from 'vitest';
import { damageFormula, captureFormula, PROB_CRITICO } from '@/utils/formulas';
import { crearRNG } from '@/utils/rng';
import { efectividad, efectividadCombinada } from '@/data/types';

describe('tabla de efectividad', () => {
  it('Aire es fuerte contra Tierra (×2)', () => {
    expect(efectividad('Aire', 'Tierra')).toBe(2);
  });

  it('Tierra es débil contra Aire (×0.5)', () => {
    expect(efectividad('Tierra', 'Aire')).toBe(0.5);
  });

  it('Tierra es fuerte contra Veneno (×2)', () => {
    expect(efectividad('Tierra', 'Veneno')).toBe(2);
  });

  it('Agua es débil contra sí misma (×0.5)', () => {
    expect(efectividad('Agua', 'Agua')).toBe(0.5);
  });

  it('Normal es neutral contra todo', () => {
    expect(efectividad('Normal', 'Tierra')).toBe(1);
    expect(efectividad('Normal', 'Aire')).toBe(1);
    expect(efectividad('Normal', 'Agua')).toBe(1);
    expect(efectividad('Normal', 'Veneno')).toBe(1);
    expect(efectividad('Normal', 'Normal')).toBe(1);
  });

  it('combinada multiplica los tipos del defensor', () => {
    // Ñandú es Tierra/Aire. Aire vs Tierra = 2, Aire vs Aire = 1 → 2.
    expect(efectividadCombinada('Aire', ['Tierra', 'Aire'])).toBe(2);
    // Tierra vs Tierra/Aire = 1 × 0.5 = 0.5.
    expect(efectividadCombinada('Tierra', ['Tierra', 'Aire'])).toBe(0.5);
  });
});

describe('damageFormula', () => {
  const rng = crearRNG(42);

  it('aplica STAB cuando coincide tipo del movimiento con el atacante', () => {
    const sinStab = damageFormula(
      { nivel: 50, atk: 70, tipos: ['Aire'] },
      { def: 70, tipos: ['Normal'] },
      { poder: 60, tipo: 'Tierra' },
      rng,
      { forzarCritico: false, forzarVariance: 1 },
    );
    const conStab = damageFormula(
      { nivel: 50, atk: 70, tipos: ['Tierra'] },
      { def: 70, tipos: ['Normal'] },
      { poder: 60, tipo: 'Tierra' },
      rng,
      { forzarCritico: false, forzarVariance: 1 },
    );
    expect(conStab.danio).toBeGreaterThan(sinStab.danio);
    // STAB es ×1.5, así que la relación debe ser cercana a 1.5.
    expect(conStab.danio / sinStab.danio).toBeCloseTo(1.5, 1);
  });

  it('aplica efectividad ×2 cuando el tipo es fuerte', () => {
    // Atacante Veneno con movimiento Aire en ambos casos para que NO haya STAB
    // y aislemos el efecto de la efectividad de tipo.
    const neutral = damageFormula(
      { nivel: 50, atk: 70, tipos: ['Veneno'] },
      { def: 70, tipos: ['Normal'] },
      { poder: 60, tipo: 'Aire' },
      rng,
      { forzarCritico: false, forzarVariance: 1 },
    );
    const efectivo = damageFormula(
      { nivel: 50, atk: 70, tipos: ['Veneno'] },
      { def: 70, tipos: ['Tierra'] },
      { poder: 60, tipo: 'Aire' },
      rng,
      { forzarCritico: false, forzarVariance: 1 },
    );
    expect(efectivo.danio / neutral.danio).toBeCloseTo(2, 1);
    expect(efectivo.efectividad).toBe(2);
    expect(neutral.efectividad).toBe(1);
  });

  it('aplica ×1.5 cuando el golpe es crítico', () => {
    const normal = damageFormula(
      { nivel: 50, atk: 70, tipos: ['Normal'] },
      { def: 70, tipos: ['Normal'] },
      { poder: 60, tipo: 'Normal' },
      rng,
      { forzarCritico: false, forzarVariance: 1 },
    );
    const critico = damageFormula(
      { nivel: 50, atk: 70, tipos: ['Normal'] },
      { def: 70, tipos: ['Normal'] },
      { poder: 60, tipo: 'Normal' },
      rng,
      { forzarCritico: true, forzarVariance: 1 },
    );
    expect(critico.esCritico).toBe(true);
    expect(critico.danio / normal.danio).toBeCloseTo(1.5, 1);
  });

  it('reduce daño cuando la efectividad es ×0.5', () => {
    const debil = damageFormula(
      { nivel: 50, atk: 70, tipos: ['Normal'] },
      { def: 70, tipos: ['Aire'] },
      { poder: 60, tipo: 'Tierra' },
      rng,
      { forzarCritico: false, forzarVariance: 1 },
    );
    expect(debil.efectividad).toBe(0.5);
  });

  it('siempre hace al menos 1 de daño', () => {
    const minimo = damageFormula(
      { nivel: 1, atk: 1, tipos: ['Normal'] },
      { def: 999, tipos: ['Normal'] },
      { poder: 1, tipo: 'Normal' },
      rng,
      { forzarCritico: false, forzarVariance: 0.85 },
    );
    expect(minimo.danio).toBeGreaterThanOrEqual(1);
  });

  it('la probabilidad de crítico es ~1/16', () => {
    expect(PROB_CRITICO).toBeCloseTo(1 / 16, 4);
  });

  it('reproducible con la misma seed', () => {
    const r1 = crearRNG(123);
    const r2 = crearRNG(123);
    const a = damageFormula(
      { nivel: 50, atk: 70, tipos: ['Normal'] },
      { def: 70, tipos: ['Normal'] },
      { poder: 60, tipo: 'Normal' },
      r1,
    );
    const b = damageFormula(
      { nivel: 50, atk: 70, tipos: ['Normal'] },
      { def: 70, tipos: ['Normal'] },
      { poder: 60, tipo: 'Normal' },
      r2,
    );
    expect(a).toEqual(b);
  });
});

describe('captureFormula', () => {
  it('a HP máximo la captura es difícil', () => {
    const p = captureFormula({
      hpMax: 100,
      hpActual: 100,
      tasaBase: 0.3,
      bonusTrampa: 1,
      conEstadoAlterado: false,
    });
    // Numerador = (300 - 200) * 0.3 = 30; denom = 300; prob = 0.1
    expect(p).toBeCloseTo(0.1, 3);
  });

  it('a HP bajo la captura es fácil', () => {
    const p = captureFormula({
      hpMax: 100,
      hpActual: 5,
      tasaBase: 0.3,
      bonusTrampa: 1,
      conEstadoAlterado: false,
    });
    // Numerador = (300 - 10) * 0.3 = 87; denom = 300; prob = 0.29
    expect(p).toBeCloseTo(0.29, 2);
  });

  it('estado alterado mejora la tasa ×1.5', () => {
    const sin = captureFormula({
      hpMax: 100, hpActual: 50, tasaBase: 0.3, bonusTrampa: 1, conEstadoAlterado: false,
    });
    const con = captureFormula({
      hpMax: 100, hpActual: 50, tasaBase: 0.3, bonusTrampa: 1, conEstadoAlterado: true,
    });
    expect(con / sin).toBeCloseTo(1.5, 3);
  });

  it('trampa mejor mejora la tasa proporcionalmente', () => {
    const comun = captureFormula({
      hpMax: 100, hpActual: 50, tasaBase: 0.3, bonusTrampa: 1, conEstadoAlterado: false,
    });
    const fina = captureFormula({
      hpMax: 100, hpActual: 50, tasaBase: 0.3, bonusTrampa: 2, conEstadoAlterado: false,
    });
    expect(fina / comun).toBeCloseTo(2, 3);
  });

  it('clamp entre 0 y 1', () => {
    const altisimo = captureFormula({
      hpMax: 100, hpActual: 1, tasaBase: 1, bonusTrampa: 5, conEstadoAlterado: true,
    });
    expect(altisimo).toBeLessThanOrEqual(1);
    expect(altisimo).toBeGreaterThanOrEqual(0);
  });
});
