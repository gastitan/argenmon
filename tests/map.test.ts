import { describe, it, expect } from 'vitest';
import { MAPA_PAMPA, getTileData } from '@/data/maps';

describe('MAPA_PAMPA — dimensiones', () => {
  it('tiene 30 filas', () => {
    expect(MAPA_PAMPA).toHaveLength(30);
  });

  it('cada fila tiene 60 columnas', () => {
    for (const fila of MAPA_PAMPA) {
      expect(fila).toHaveLength(60);
    }
  });
});

describe('MAPA_PAMPA — zoneId por X', () => {
  const ZONAS: Array<[number, number, string]> = [
    [0, 5, 'pampa_entrada'],
    [6, 15, 'pampa_wild_low'],
    [16, 25, 'pampa_tres_sombras'],
    [26, 35, 'pampa_cazadores'],
    [36, 47, 'pampa_wild_high'],
    [48, 59, 'pampa_estancia'],
  ];

  for (const [xMin, xMax, zoneId] of ZONAS) {
    it(`x ${xMin}-${xMax} → zoneId "${zoneId}"`, () => {
      for (let x = xMin; x <= xMax; x++) {
        const tile = MAPA_PAMPA[15][x];
        expect(tile.zoneId).toBe(zoneId);
      }
    });
  }
});

describe('MAPA_PAMPA — bordes', () => {
  it('fila 0 es toda árboles', () => {
    for (const tile of MAPA_PAMPA[0]) {
      expect(tile.terreno).toBe('arbol');
    }
  });

  it('fila 29 es toda árboles', () => {
    for (const tile of MAPA_PAMPA[29]) {
      expect(tile.terreno).toBe('arbol');
    }
  });

  it('columna 0 es toda árboles', () => {
    for (const fila of MAPA_PAMPA) {
      expect(fila[0].terreno).toBe('arbol');
    }
  });

  it('columna 59 es toda árboles', () => {
    for (const fila of MAPA_PAMPA) {
      expect(fila[59].terreno).toBe('arbol');
    }
  });
});

describe('MAPA_PAMPA — spawn', () => {
  it('spawn (2, 15) está en pampa_entrada y es caminable', () => {
    const tile = getTileData(2, 15);
    expect(tile).toBeDefined();
    expect(tile!.zoneId).toBe('pampa_entrada');
    expect(tile!.terreno).not.toBe('arbol');
    expect(tile!.terreno).not.toBe('agua');
  });
});

describe('MAPA_PAMPA — manchones pasto alto (wild low)', () => {
  it('manchón A (x 8-10, y 8-12) es pasto_alto en pampa_wild_low', () => {
    for (let y = 8; y <= 12; y++) {
      for (let x = 8; x <= 10; x++) {
        const tile = getTileData(x, y)!;
        expect(tile.terreno).toBe('pasto_alto');
        expect(tile.zoneId).toBe('pampa_wild_low');
      }
    }
  });
});

describe('MAPA_PAMPA — manchones monte (cazadores)', () => {
  it('columna x=28 (y 8-11) es monte en pampa_cazadores', () => {
    // x=29 tiene un árbol en y=9 que oculta el tile monte; se usa x=28 que no tiene árboles
    for (let y = 8; y <= 11; y++) {
      const tile = getTileData(28, y)!;
      expect(tile.terreno).toBe('monte');
      expect(tile.zoneId).toBe('pampa_cazadores');
    }
  });
});

describe('MAPA_PAMPA — aguada wild high', () => {
  it('agua en (x 43-45, y 8-10)', () => {
    for (let y = 8; y <= 10; y++) {
      for (let x = 43; x <= 45; x++) {
        expect(getTileData(x, y)!.terreno).toBe('agua');
      }
    }
  });
});

describe('getTileData — fuera de rango', () => {
  it('fuera del mapa devuelve undefined', () => {
    expect(getTileData(-1, 0)).toBeUndefined();
    expect(getTileData(0, -1)).toBeUndefined();
    expect(getTileData(60, 0)).toBeUndefined();
    expect(getTileData(0, 30)).toBeUndefined();
  });
});
