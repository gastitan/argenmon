// Datos de criaturas migrados a JSON. Este archivo re-exporta la API pública.
export type { EspecieBase, EspecieId } from '@/data/loaders/loadCreatures';
export { ESPECIES } from '@/data/loaders/loadCreatures';

// Fórmulas puras de stats — no son datos, se mantienen aquí.
export function calcularStat(base: number, nivel: number): number {
  return Math.floor(((base * 2 * nivel) / 100) + nivel + 5);
}

export function calcularHP(base: number, nivel: number): number {
  return Math.floor(((base * 2 * nivel) / 100) + nivel + 10);
}
