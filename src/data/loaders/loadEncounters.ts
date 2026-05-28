import encountersJson from '@/data/json/encounters.json';
import { EncuentrosSchema } from '@/data/schemas/encounter.schema';
import { ESPECIES } from '@/data/loaders/loadCreatures';
import type { TablaEncuentro } from '@/data/schemas/encounter.schema';

export type { TablaEncuentro };

function loadEncounters(): Map<string, TablaEncuentro> {
  let parsed;
  try {
    parsed = EncuentrosSchema.parse(encountersJson);
  } catch (err) {
    console.error('Error parsing encounters.json:', err);
    throw new Error('Failed to load encounters data. Check encounters.json structure.');
  }

  const result = new Map<string, TablaEncuentro>();
  for (const [zoneId, tabla] of Object.entries(parsed.tablas)) {
    for (const entrada of tabla.criaturas) {
      if (!ESPECIES[entrada.especieId]) {
        throw new Error(`Encounter table "${zoneId}" references unknown species: ${entrada.especieId}`);
      }
    }
    result.set(zoneId, tabla);
  }

  return result;
}

export const TABLAS_ENCUENTROS: Map<string, TablaEncuentro> = loadEncounters();
