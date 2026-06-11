import biomeIntrosJson from '@/data/json/biome_intros.json';
import { BiomeIntrosCatalogSchema } from '@/data/schemas/biome_intro.schema';
import type { BiomeIntroEntry } from '@/data/schemas/biome_intro.schema';

export type { BiomeIntroEntry };

function loadBiomeIntros(): Record<string, BiomeIntroEntry> {
  let parsed;
  try {
    parsed = BiomeIntrosCatalogSchema.parse(biomeIntrosJson);
  } catch (err) {
    console.error('Error parsing biome_intros.json:', err);
    throw new Error('Failed to load biome intros catalog. Check biome_intros.json structure.');
  }
  return parsed;
}

export const BIOME_INTROS: Record<string, BiomeIntroEntry> = loadBiomeIntros();

export function getBiomeIntro(biomaId: string): BiomeIntroEntry {
  const entry = BIOME_INTROS[biomaId];
  if (!entry) {
    throw new Error(`No hay introducción declarada para el bioma '${biomaId}'.`);
  }
  return entry;
}
