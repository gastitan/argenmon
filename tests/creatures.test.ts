import { describe, it, expect } from 'vitest';
import { ESPECIES } from '@/data/creatures';
import { MOVIMIENTOS } from '@/data/moves';

describe('Criaturas nuevas — Sabueso', () => {
  it('sabueso existe en ESPECIES', () => {
    expect(ESPECIES['sabueso']).toBeDefined();
  });

  it('sabueso pasa validación básica de stats', () => {
    const s = ESPECIES['sabueso'];
    expect(s.hpBase).toBeGreaterThan(0);
    expect(s.atkBase).toBeGreaterThan(0);
    expect(s.tipos).toContain('Normal');
    expect(s.tasaCaptura).toBeGreaterThan(0);
  });

  it('movepool de sabueso referencia solo movimientos existentes', () => {
    for (const entrada of ESPECIES['sabueso'].movepool) {
      expect(MOVIMIENTOS[entrada.movimientoId]).toBeDefined();
    }
  });
});

describe('Criaturas nuevas — Jabalí', () => {
  it('jabali existe en ESPECIES', () => {
    expect(ESPECIES['jabali']).toBeDefined();
  });

  it('jabali pasa validación básica de stats', () => {
    const j = ESPECIES['jabali'];
    expect(j.hpBase).toBeGreaterThan(0);
    expect(j.atkBase).toBeGreaterThan(0);
    expect(j.tipos).toContain('Tierra');
    expect(j.tasaCaptura).toBeGreaterThan(0);
  });

  it('movepool de jabalí referencia solo movimientos existentes', () => {
    for (const entrada of ESPECIES['jabali'].movepool) {
      expect(MOVIMIENTOS[entrada.movimientoId]).toBeDefined();
    }
  });
});

describe('Movimientos nuevos', () => {
  const nuevos = ['aullido', 'rastreo', 'colmillo_brutal', 'bramido', 'colmillo_jabali', 'carga', 'estampida'];

  for (const id of nuevos) {
    it(`"${id}" existe en MOVIMIENTOS`, () => {
      expect(MOVIMIENTOS[id]).toBeDefined();
    });
  }

  it('aullido tiene efecto modificador_stat en atk del atacante', () => {
    const m = MOVIMIENTOS['aullido'];
    expect(m.efecto?.tipo).toBe('modificador_stat');
    if (m.efecto?.tipo === 'modificador_stat') {
      expect(m.efecto.objetivo).toBe('atacante');
      expect(m.efecto.stat).toBe('atk');
      expect(m.efecto.etapas).toBeGreaterThan(0);
    }
  });

  it('bramido tiene efecto modificador_stat en atk del defensor', () => {
    const m = MOVIMIENTOS['bramido'];
    expect(m.efecto?.tipo).toBe('modificador_stat');
    if (m.efecto?.tipo === 'modificador_stat') {
      expect(m.efecto.objetivo).toBe('defensor');
      expect(m.efecto.stat).toBe('atk');
      expect(m.efecto.etapas).toBeLessThan(0);
    }
  });

  it('carga tiene efecto modificador_stat en def del atacante', () => {
    const m = MOVIMIENTOS['carga'];
    expect(m.efecto?.tipo).toBe('modificador_stat');
    if (m.efecto?.tipo === 'modificador_stat') {
      expect(m.efecto.objetivo).toBe('atacante');
      expect(m.efecto.stat).toBe('def');
      expect(m.efecto.etapas).toBeLessThan(0);
    }
  });
});
