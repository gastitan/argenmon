import encountersJson from '@/data/json/encounters.json';
import { EncuentrosSchema } from '@/data/schemas/encounter.schema';
import { ESPECIES } from '@/data/loaders/loadCreatures';
import type { EntradaEncuentro } from '@/data/schemas/encounter.schema';

export type { EntradaEncuentro };

function loadEncounters() {
  let parsed;
  try {
    parsed = EncuentrosSchema.parse(encountersJson);
  } catch (err) {
    console.error('Error parsing encounters.json:', err);
    throw new Error('Failed to load encounters data. Check encounters.json structure.');
  }

  for (const [bioma, tabla] of Object.entries(parsed.tablas)) {
    for (const entrada of tabla) {
      if (!ESPECIES[entrada.especieId]) {
        throw new Error(`Encounter table "${bioma}" references unknown species: ${entrada.especieId}`);
      }
    }
  }

  return parsed;
}

const _data = loadEncounters();
export const PROB_ENCUENTRO_POR_PASO: number = _data.probEncuentroPorPaso;
export const TABLAS_ENCUENTROS: Record<string, EntradaEncuentro[]> = _data.tablas;
