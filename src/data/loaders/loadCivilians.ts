import civiliansJson from '@/data/json/civilians.json';
import { CivilesDatosSchema } from '@/data/schemas/civilians';
import type { CivilJSON } from '@/data/schemas/civilians';

export type { CivilJSON as DatosCivil };

function loadCivilians(): CivilJSON[] {
  let parsed;
  try {
    parsed = CivilesDatosSchema.parse(civiliansJson);
  } catch (err) {
    console.error('Error parsing civilians.json:', err);
    throw new Error('Failed to load civilians data. Check civilians.json structure.');
  }
  return parsed.civiles;
}

export const DATOS_CIVILES: CivilJSON[] = loadCivilians();
