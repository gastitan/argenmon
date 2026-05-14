// Datos de entrenadores migrados a JSON. Este archivo re-exporta la API pública.
export type { EquipoEntrenador, DatosEntrenador } from '@/data/loaders/loadTrainers';
export { DATOS_ENTRENADORES } from '@/data/loaders/loadTrainers';

import type { DatosEntrenador } from '@/data/loaders/loadTrainers';
import { DATOS_ENTRENADORES } from '@/data/loaders/loadTrainers';
import type { EspecieId } from '@/data/creatures';

// BattleConfig vive aquí porque es un tipo de dominio del sistema de batalla,
// no un dato serializable.
export type BattleConfig =
  | { tipo: 'wild'; especieId: EspecieId; nivel: number }
  | { tipo: 'entrenador'; entrenadorId: string }
  | { tipo: 'debug' };

export function encontrarEntrenador(id: string): DatosEntrenador | undefined {
  return DATOS_ENTRENADORES.find((e) => e.id === id);
}
