import typesJson from '@/data/json/types.json';
import { TablaEfectividadSchema } from '@/data/schemas/type.schema';
import type { Tipo } from '@/data/schemas/type.schema';

function loadTypes(): Readonly<Record<Tipo, Readonly<Record<Tipo, number>>>> {
  try {
    return TablaEfectividadSchema.parse(typesJson) as Readonly<Record<Tipo, Readonly<Record<Tipo, number>>>>;
  } catch (err) {
    console.error('Error parsing types.json:', err);
    throw new Error('Failed to load type effectiveness data. Check types.json structure.');
  }
}

export const TABLA_EFECTIVIDAD: Readonly<Record<Tipo, Readonly<Record<Tipo, number>>>> = loadTypes();
