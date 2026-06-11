import { describe, it, expect } from 'vitest';
import { BIOME_INTROS, getBiomeIntro } from '@/data/loaders/loadBiomeIntros';
import biomeIntrosJson from '@/data/json/biome_intros.json';
import { BiomeIntrosCatalogSchema } from '@/data/schemas/biome_intro.schema';

describe('biome_intros.json — carga y estructura', () => {
  it('la entrada de Pampa tiene los campos requeridos', () => {
    const pampa = getBiomeIntro('pampa');
    expect(pampa.encabezadoFecha).toBe('Primer día');
    expect(pampa.lugar).toBe('Pampa húmeda');
    expect(pampa.cuerpo.length).toBeGreaterThanOrEqual(1);
    expect(pampa.leyendaPropiedad).toBeDefined();
  });

  it('BIOME_INTROS contiene la entrada de Pampa', () => {
    expect(BIOME_INTROS['pampa']).toBeDefined();
  });

  it('todos los párrafos del cuerpo son strings no vacíos', () => {
    const pampa = getBiomeIntro('pampa');
    for (const parrafo of pampa.cuerpo) {
      expect(parrafo.length).toBeGreaterThan(0);
    }
  });
});

describe('getBiomeIntro — helper', () => {
  it('lanza error para un bioma no declarado', () => {
    expect(() => getBiomeIntro('patagonia')).toThrow(
      "No hay introducción declarada para el bioma 'patagonia'."
    );
  });
});

describe('BiomeIntrosCatalogSchema — validación', () => {
  it('acepta la estructura correcta de biome_intros.json', () => {
    expect(() => BiomeIntrosCatalogSchema.parse(biomeIntrosJson)).not.toThrow();
  });

  it('falla si cuerpo está vacío', () => {
    const json = { pampa: { encabezadoFecha: 'Primer día', lugar: 'Pampa húmeda', cuerpo: [] } };
    expect(() => BiomeIntrosCatalogSchema.parse(json)).toThrow();
  });

  it('falla si un elemento de cuerpo es string vacío', () => {
    const json = { pampa: { encabezadoFecha: 'Primer día', lugar: 'Pampa húmeda', cuerpo: [''] } };
    expect(() => BiomeIntrosCatalogSchema.parse(json)).toThrow();
  });

  it('falla si encabezadoFecha está vacío', () => {
    const json = { pampa: { encabezadoFecha: '', lugar: 'Pampa húmeda', cuerpo: ['Texto.'] } };
    expect(() => BiomeIntrosCatalogSchema.parse(json)).toThrow();
  });

  it('falla si lugar está vacío', () => {
    const json = { pampa: { encabezadoFecha: 'Primer día', lugar: '', cuerpo: ['Texto.'] } };
    expect(() => BiomeIntrosCatalogSchema.parse(json)).toThrow();
  });

  it('leyendaPropiedad es opcional (un bioma sin ella es válido)', () => {
    const json = {
      delta: { encabezadoFecha: 'Día 1', lugar: 'Delta del Paraná', cuerpo: ['Texto de prueba.'] },
    };
    expect(() => BiomeIntrosCatalogSchema.parse(json)).not.toThrow();
    const parsed = BiomeIntrosCatalogSchema.parse(json);
    expect(parsed['delta'].leyendaPropiedad).toBeUndefined();
  });
});
