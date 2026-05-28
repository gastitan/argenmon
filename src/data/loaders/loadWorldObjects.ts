import worldObjectsJson from '@/data/json/world_objects.json';
import { ObjetosMundoSchema } from '@/data/schemas/world_objects';
import type { ObjetoMundo } from '@/data/schemas/world_objects';

export type { ObjetoMundo };

function loadWorldObjects(): ObjetoMundo[] {
  let parsed;
  try {
    parsed = ObjetosMundoSchema.parse(worldObjectsJson);
  } catch (err) {
    console.error('Error parsing world_objects.json:', err);
    throw new Error('Failed to load world objects data. Check world_objects.json structure.');
  }
  return parsed.objetos;
}

export const OBJETOS_MUNDO: ObjetoMundo[] = loadWorldObjects();
