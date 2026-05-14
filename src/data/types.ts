// Datos de tipos migrados a JSON. Este archivo re-exporta la API pública.
export type { Tipo } from '@/data/schemas/type.schema';
export { TIPOS, TipoEnum } from '@/data/schemas/type.schema';
export { TABLA_EFECTIVIDAD } from '@/data/loaders/loadTypes';

import { TABLA_EFECTIVIDAD } from '@/data/loaders/loadTypes';
import type { Tipo } from '@/data/schemas/type.schema';

export function efectividad(atacante: Tipo, defensor: Tipo): number {
  return TABLA_EFECTIVIDAD[atacante][defensor];
}

export function efectividadCombinada(atacante: Tipo, tiposDefensor: readonly Tipo[]): number {
  return tiposDefensor.reduce((acc, t) => acc * efectividad(atacante, t), 1);
}
