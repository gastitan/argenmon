import type { EspecieId } from '@/data/creatures';
import type { RNG } from '@/utils/rng';
import { TABLAS_ENCUENTROS } from '@/data/loaders/loadEncounters';

export interface ResultadoEncuentro {
  especieId: EspecieId;
  nivel: number;
}

/**
 * Intenta generar un encuentro wild dado el zoneId y el tipo de tile pisado.
 * Retorna null si:
 *  - No hay tabla para ese zoneId
 *  - El tipoTile no coincide con el tipoTile de la tabla
 *  - El RNG no disparó el encuentro (según la tasa de la tabla)
 */
export function intentarEncuentro(
  zoneId: string,
  tipoTile: string,
  rng: RNG,
): ResultadoEncuentro | null {
  const tabla = TABLAS_ENCUENTROS.get(zoneId);
  if (!tabla) return null;
  if (tabla.tipoTile !== tipoTile) return null;
  if (!rng.chance(tabla.rate)) return null;

  const total = tabla.criaturas.reduce((s, e) => s + e.peso, 0);
  let r = rng.next() * total;
  for (const entrada of tabla.criaturas) {
    r -= entrada.peso;
    if (r <= 0) {
      const nivel = entrada.nivelMin + rng.rangoEntero(0, entrada.nivelMax - entrada.nivelMin);
      return { especieId: entrada.especieId, nivel };
    }
  }
  // Fallback: primera criatura de la tabla
  const primera = tabla.criaturas[0];
  return { especieId: primera.especieId, nivel: primera.nivelMin };
}
