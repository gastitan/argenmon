import { describe, it, expect } from 'vitest';
import { movimientosAlNivel, nuevosMovimientosAlSubir } from '@/systems/Movepool';

describe('movimientosAlNivel', () => {
  it('Hornero Lv5: solo los 2 movimientos de Lv1', () => {
    const result = movimientosAlNivel('hornero', 5);
    expect(result).toEqual(['picotazo', 'embestida']);
  });

  it('Hornero Lv6: aprende ala_acero (3 movimientos)', () => {
    const result = movimientosAlNivel('hornero', 6);
    expect(result).toEqual(['picotazo', 'embestida', 'ala_acero']);
  });

  it('Hornero Lv14: exactamente 4 movimientos (slot lleno, los más recientes)', () => {
    const result = movimientosAlNivel('hornero', 14);
    expect(result).toHaveLength(4);
    expect(result).toContain('ala_acero');
    expect(result).toContain('ala_viento');
    expect(result).toContain('vuelo_rasante');
    // embestida(lv1) queda fuera al desbordarse, picotazo(lv1) también
    // Con 5 elegibles (lv1,lv1,lv6,lv10,lv14), se quedan los últimos 4:
    // embestida,ala_acero,ala_viento,vuelo_rasante
    expect(result).toContain('embestida');
    expect(result).not.toContain('picotazo');
  });

  it('Ñandú Lv25: máximo 4 aunque el movepool tenga 7 entradas', () => {
    const result = movimientosAlNivel('nandu', 25);
    expect(result).toHaveLength(4);
  });

  it('Ñandú Lv15: Picotazo(lv1) queda fuera, Patada Veloz(lv1) se conserva', () => {
    const result = movimientosAlNivel('nandu', 15);
    expect(result).toHaveLength(4);
    expect(result).toContain('patada_veloz');
    expect(result).not.toContain('picotazo');
    expect(result).toContain('carrera');
    expect(result).toContain('ala_viento');
    expect(result).toContain('patada_potente');
  });

  it('Peludo Lv15: Embestida(lv1) queda fuera, Zarpazo(lv1) se conserva', () => {
    const result = movimientosAlNivel('peludo', 15);
    expect(result).toHaveLength(4);
    expect(result).toContain('zarpazo');
    expect(result).not.toContain('embestida');
    expect(result).toContain('aranazo');
    expect(result).toContain('cuevada');
    expect(result).toContain('golpe_bajo');
  });

  it('Yarará Lv14: 4 movimientos esperados para el Capataz', () => {
    const result = movimientosAlNivel('yarara', 14);
    expect(result).toEqual(['mordida', 'constriccion', 'enroscada', 'colmillo_venenoso']);
  });

  it('Mara Lv3: solo 2 movimientos de Lv1', () => {
    const result = movimientosAlNivel('mara', 3);
    expect(result).toEqual(['patada_veloz', 'golpe_rapido']);
  });

  it('especie inexistente: lanza error', () => {
    expect(() => movimientosAlNivel('pokemon_falso', 5)).toThrow();
  });

  it('nivel 0: lanza error', () => {
    expect(() => movimientosAlNivel('hornero', 0)).toThrow();
  });

  it('nivel negativo: lanza error', () => {
    expect(() => movimientosAlNivel('hornero', -1)).toThrow();
  });
});

describe('nuevosMovimientosAlSubir', () => {
  it('Hornero 5→6: aprende ala_acero', () => {
    expect(nuevosMovimientosAlSubir('hornero', 5, 6)).toEqual(['ala_acero']);
  });

  it('Hornero 5→14: aprende ala_acero, ala_viento, vuelo_rasante en orden', () => {
    expect(nuevosMovimientosAlSubir('hornero', 5, 14)).toEqual([
      'ala_acero',
      'ala_viento',
      'vuelo_rasante',
    ]);
  });

  it('Hornero 10→10: no aprende nada (mismo nivel)', () => {
    expect(nuevosMovimientosAlSubir('hornero', 10, 10)).toEqual([]);
  });

  it('Hornero 14→10: no aprende nada (nivelNuevo < nivelAnterior)', () => {
    expect(nuevosMovimientosAlSubir('hornero', 14, 10)).toEqual([]);
  });

  it('Hornero 5→5: no aprende nada', () => {
    expect(nuevosMovimientosAlSubir('hornero', 5, 5)).toEqual([]);
  });

  it('Mara 1→7: aprende patada_doble', () => {
    expect(nuevosMovimientosAlSubir('mara', 1, 7)).toEqual(['patada_doble']);
  });

  it('Yarará 10→15: aprende colmillo_venenoso y golpe_cola', () => {
    expect(nuevosMovimientosAlSubir('yarara', 10, 15)).toEqual([
      'colmillo_venenoso',
      'golpe_cola',
    ]);
  });

  it('especie inexistente: lanza error', () => {
    expect(() => nuevosMovimientosAlSubir('pokemon_falso', 5, 6)).toThrow();
  });
});
