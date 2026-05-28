import { describe, it, expect } from 'vitest';
import { DATOS_CIVILES } from '@/data/loaders/loadCivilians';
import { MAPA_PAMPA } from '@/data/maps';

describe('Civiles — cantidad y estructura', () => {
  it('existen exactamente 7 civiles', () => {
    expect(DATOS_CIVILES).toHaveLength(7);
  });

  it('todos tienen id, nombre, posición y al menos un diálogo', () => {
    for (const c of DATOS_CIVILES) {
      expect(c.id).toBeTruthy();
      expect(c.nombre).toBeTruthy();
      expect(typeof c.tileX).toBe('number');
      expect(typeof c.tileY).toBe('number');
      expect(c.dialogos.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('ids únicos', () => {
    const ids = DATOS_CIVILES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Civiles — posiciones válidas en el mapa', () => {
  it('todos están dentro de los límites del mapa (60×30)', () => {
    for (const c of DATOS_CIVILES) {
      expect(c.tileX).toBeGreaterThanOrEqual(0);
      expect(c.tileX).toBeLessThan(60);
      expect(c.tileY).toBeGreaterThanOrEqual(0);
      expect(c.tileY).toBeLessThan(30);
    }
  });

  it('ningún civil está en un tile de árbol o agua', () => {
    for (const c of DATOS_CIVILES) {
      const tile = MAPA_PAMPA[c.tileY]?.[c.tileX];
      expect(tile).toBeDefined();
      expect(tile!.terreno).not.toBe('arbol');
      expect(tile!.terreno).not.toBe('agua');
    }
  });
});

describe('Civiles — zonas esperadas', () => {
  it('civiles de tres_sombras están en x 14-25', () => {
    const enTresSombras = ['don_ramon', 'nina_honda', 'mujer_ropa', 'almacenera'];
    for (const id of enTresSombras) {
      const civil = DATOS_CIVILES.find((c) => c.id === id)!;
      expect(civil).toBeDefined();
      expect(civil.tileX).toBeGreaterThanOrEqual(14);
      expect(civil.tileX).toBeLessThanOrEqual(25);
    }
  });

  it('civiles de wild_high están en x 36-47', () => {
    const enWildHigh = ['don_aniceto', 'peon_a', 'peon_b'];
    for (const id of enWildHigh) {
      const civil = DATOS_CIVILES.find((c) => c.id === id)!;
      expect(civil).toBeDefined();
      expect(civil.tileX).toBeGreaterThanOrEqual(36);
      expect(civil.tileX).toBeLessThanOrEqual(47);
    }
  });
});
