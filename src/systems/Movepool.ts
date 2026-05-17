import { ESPECIES } from '@/data/creatures';

/**
 * Devuelve los movimientos que una criatura de esta especie tendría al nivel dado.
 * Filtra el movepool con nivel <= nivelActual, ordena ascendente y toma los últimos 4
 * (los más recientes). En empates de nivel, se conservan los que aparecen más tarde
 * en el movepool (se dropean los primeros al desbordar).
 */
export function movimientosAlNivel(especieId: string, nivel: number): string[] {
  if (nivel <= 0) throw new Error(`movimientosAlNivel: nivel inválido (${nivel})`);
  const especie = ESPECIES[especieId];
  if (!especie) throw new Error(`movimientosAlNivel: especie desconocida (${especieId})`);

  const elegibles = especie.movepool
    .filter((e) => e.nivel <= nivel)
    .map((e) => e.movimientoId);

  return elegibles.slice(-4);
}

/**
 * Devuelve los movimientos que se aprenden al subir de nivelAnterior a nivelNuevo.
 * Filtra entradas con nivel > nivelAnterior y nivel <= nivelNuevo, ordenadas
 * ascendentemente para procesarlas en el orden correcto.
 */
export function nuevosMovimientosAlSubir(
  especieId: string,
  nivelAnterior: number,
  nivelNuevo: number,
): string[] {
  if (nivelNuevo <= nivelAnterior) return [];
  const especie = ESPECIES[especieId];
  if (!especie) throw new Error(`nuevosMovimientosAlSubir: especie desconocida (${especieId})`);

  return especie.movepool
    .filter((e) => e.nivel > nivelAnterior && e.nivel <= nivelNuevo)
    .sort((a, b) => a.nivel - b.nivel)
    .map((e) => e.movimientoId);
}
