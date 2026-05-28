import { describe, it, expect } from 'vitest';
import { OBJETOS_MUNDO } from '@/data/loaders/loadWorldObjects';
import { ObjetosMundoSchema } from '@/data/schemas/world_objects';
import { calcularFootprintAutomatico, resolverFootprint } from '@/utils/worldObjectFootprint';

// ── Carga de datos ──────────────────────────────────────────────────────────

describe('ObjetosMundo — carga de datos', () => {
  it.skip('carga exactamente 6 objetos', () => {
    expect(OBJETOS_MUNDO).toHaveLength(6);
  });

  it('los ids están presentes y son únicos', () => {
    const ids = OBJETOS_MUNDO.map((o) => o.id);
    expect(ids).toContain('rancho_civil_a_1');
    expect(ids).toContain('rancho_civil_b_1');
    expect(ids).toContain('almacen_tres_sombras');
    expect(ids).toContain('escuela_tres_sombras');
    expect(ids).toContain('casona_estancia');
    expect(ids).toContain('tranquera_malvi');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos los objetos tienen spriteId y dimensiones positivas', () => {
    for (const obj of OBJETOS_MUNDO) {
      expect(obj.spriteId).toBeTruthy();
      expect(obj.spriteWidth).toBeGreaterThan(0);
      expect(obj.spriteHeight).toBeGreaterThan(0);
    }
  });
});

// ── Footprint automático ────────────────────────────────────────────────────

describe('calcularFootprintAutomatico', () => {
  it('rancho A (32×48) en (18,8) → 9 tiles: 3 cols × 3 filas (sprite desborda 8px en tile 19)', () => {
    // cx=18*16+8=296; sprite 32px → [280,311]; tiles x: floor(280/16)=17 a floor(311/16)=19
    const tiles = calcularFootprintAutomatico({ x: 18, y: 8 }, 32, 48);
    expect(tiles).toHaveLength(9);
    const claves = tiles.map((t) => `${t.x},${t.y}`);
    for (const x of [17, 18, 19]) {
      for (const y of [6, 7, 8]) {
        expect(claves).toContain(`${x},${y}`);
      }
    }
  });

  it('rancho B (48×48) en (24,17) → 9 tiles: 3 cols × 3 filas centrado/base-abajo', () => {
    const tiles = calcularFootprintAutomatico({ x: 24, y: 17 }, 48, 48);
    expect(tiles).toHaveLength(9);
    const claves = tiles.map((t) => `${t.x},${t.y}`);
    for (const x of [23, 24, 25]) {
      for (const y of [15, 16, 17]) {
        expect(claves).toContain(`${x},${y}`);
      }
    }
  });

  it('almacén (32×48) en (19,13) → 9 tiles: 3 cols × 3 filas (sprite desborda 8px en tile 20)', () => {
    // cx=19*16+8=312; sprite 32px → [296,327]; tiles x: floor(296/16)=18 a floor(327/16)=20
    const tiles = calcularFootprintAutomatico({ x: 19, y: 13 }, 32, 48);
    expect(tiles).toHaveLength(9);
    const claves = tiles.map((t) => `${t.x},${t.y}`);
    for (const x of [18, 19, 20]) {
      for (const y of [11, 12, 13]) {
        expect(claves).toContain(`${x},${y}`);
      }
    }
  });

  it('escuela (32×48) en (22,10) → 9 tiles: 3 cols × 3 filas (sprite desborda 8px en tile 23)', () => {
    // cx=22*16+8=360; sprite 32px → [344,375]; tiles x: floor(344/16)=21 a floor(375/16)=23
    const tiles = calcularFootprintAutomatico({ x: 22, y: 10 }, 32, 48);
    expect(tiles).toHaveLength(9);
    const claves = tiles.map((t) => `${t.x},${t.y}`);
    for (const x of [21, 22, 23]) {
      for (const y of [8, 9, 10]) {
        expect(claves).toContain(`${x},${y}`);
      }
    }
  });

  it('tiles fuera del mapa se filtran silenciosamente', () => {
    // sprite muy alto anclado en la fila 1 — las filas negativas no se incluyen
    const tiles = calcularFootprintAutomatico({ x: 5, y: 1 }, 16, 64);
    // heightTiles = 4, startY = 1-4+1 = -2 → filas -2,-1 se filtran; solo 0,1 pasan
    for (const t of tiles) {
      expect(t.y).toBeGreaterThanOrEqual(0);
    }
    expect(tiles.length).toBeLessThan(4);
  });
});

// ── resolverFootprint ───────────────────────────────────────────────────────

describe('resolverFootprint', () => {
  it('sin footprint declarado usa el automático', () => {
    const ranchoA = OBJETOS_MUNDO.find((o) => o.id === 'rancho_civil_a_1')!;
    const tiles = resolverFootprint(ranchoA);
    expect(tiles).toHaveLength(9);
  });

  it('con footprint custom usa los offsets declarados', () => {
    // Objeto en memoria con footprint custom de 1 tile (solo el anclaje)
    const obj = {
      id: 'test',
      spriteId: 'rancho_a',
      posicion: { x: 10, y: 10 },
      spriteWidth: 32,
      spriteHeight: 48,
      footprint: [{ dx: 0, dy: 0 }],
    };
    const tiles = resolverFootprint(obj);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toEqual({ x: 10, y: 10 });
  });

  it('footprint custom fuera del mapa se filtra', () => {
    const obj = {
      id: 'test',
      spriteId: 'rancho_a',
      posicion: { x: 0, y: 0 },
      spriteWidth: 16,
      spriteHeight: 16,
      footprint: [{ dx: -1, dy: 0 }, { dx: 0, dy: 0 }],
    };
    const tiles = resolverFootprint(obj);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toEqual({ x: 0, y: 0 });
  });
});

// ── Tiles bloqueados por cada rancho ───────────────────────────────────────

describe.skip('ObjetosMundo — tiles de colisión completos', () => {
  it('rancho A bloquea los 9 tiles de su footprint 3×3 (incluye tile x=19 por desborde)', () => {
    const ranchoA = OBJETOS_MUNDO.find((o) => o.id === 'rancho_civil_a_1')!;
    const claves = new Set(resolverFootprint(ranchoA).map((t) => `${t.x},${t.y}`));
    for (const x of [17, 18, 19]) {
      for (const y of [6, 7, 8]) {
        expect(claves.has(`${x},${y}`)).toBe(true);
      }
    }
  });

  it('rancho B bloquea los 9 tiles de su footprint 3×3', () => {
    const ranchoB = OBJETOS_MUNDO.find((o) => o.id === 'rancho_civil_b_1')!;
    const claves = new Set(resolverFootprint(ranchoB).map((t) => `${t.x},${t.y}`));
    for (const x of [23, 24, 25]) {
      for (const y of [15, 16, 17]) {
        expect(claves.has(`${x},${y}`)).toBe(true);
      }
    }
  });

  it('almacén bloquea los 9 tiles de su footprint 3×3 (incluye tile x=20 por desborde)', () => {
    const almacen = OBJETOS_MUNDO.find((o) => o.id === 'almacen_tres_sombras')!;
    const claves = new Set(resolverFootprint(almacen).map((t) => `${t.x},${t.y}`));
    for (const x of [18, 19, 20]) {
      for (const y of [11, 12, 13]) {
        expect(claves.has(`${x},${y}`)).toBe(true);
      }
    }
  });

  it('escuela bloquea los 9 tiles de su footprint 3×3 (incluye tile x=22 por desborde)', () => {
    const escuela = OBJETOS_MUNDO.find((o) => o.id === 'escuela_tres_sombras')!;
    const claves = new Set(resolverFootprint(escuela).map((t) => `${t.x},${t.y}`));
    for (const x of [20, 21, 22]) {
      for (const y of [6, 7, 8]) {
        expect(claves.has(`${x},${y}`)).toBe(true);
      }
    }
  });
});

describe('ObjetosMundo — objetos de la Estancia', () => {
  it('casona bloquea los 12 tiles de su footprint 3×4 (col 53-55, fila 5-8)', () => {
    const casona = OBJETOS_MUNDO.find((o) => o.id === 'casona_estancia')!;
    const claves = new Set(resolverFootprint(casona).map((t) => `${t.x},${t.y}`));
    for (const x of [53, 54, 55]) {
      for (const y of [5, 6, 7, 8]) {
        expect(claves.has(`${x},${y}`)).toBe(true);
      }
    }
  });

  it('tranquera usa footprint custom: bloquea (53,20) y (55,20), no bloquea (54,20)', () => {
    const tranquera = OBJETOS_MUNDO.find((o) => o.id === 'tranquera_malvi')!;
    const tiles = resolverFootprint(tranquera);
    const claves = new Set(tiles.map((t) => `${t.x},${t.y}`));
    expect(claves.has('53,20')).toBe(true);
    expect(claves.has('55,20')).toBe(true);
    expect(claves.has('54,20')).toBe(false);
    expect(tiles).toHaveLength(2);
  });
});

// ── Validación Zod ──────────────────────────────────────────────────────────

describe('ObjetosMundo — validación Zod', () => {
  it('el JSON actual pasa la validación completa', () => {
    const json = { objetos: OBJETOS_MUNDO };
    expect(() => ObjetosMundoSchema.parse(json)).not.toThrow();
  });

  it('footprint declarado es válido en el schema', () => {
    const json = {
      objetos: [
        {
          id: 'test',
          spriteId: 'rancho_a',
          posicion: { x: 5, y: 5 },
          spriteWidth: 16,
          spriteHeight: 16,
          footprint: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }],
        },
      ],
    };
    expect(() => ObjetosMundoSchema.parse(json)).not.toThrow();
  });

  it('un objeto con x fuera del mapa (x=60) falla la validación', () => {
    const invalid = {
      objetos: [{ id: 'f', spriteId: 'rancho_a', posicion: { x: 60, y: 5 }, spriteWidth: 32, spriteHeight: 48 }],
    };
    expect(() => ObjetosMundoSchema.parse(invalid)).toThrow();
  });

  it('un objeto con y fuera del mapa (y=30) falla la validación', () => {
    const invalid = {
      objetos: [{ id: 'f', spriteId: 'rancho_a', posicion: { x: 5, y: 30 }, spriteWidth: 32, spriteHeight: 48 }],
    };
    expect(() => ObjetosMundoSchema.parse(invalid)).toThrow();
  });
});
