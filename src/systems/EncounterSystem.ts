import type { EspecieId } from '@/data/creatures';
import type { RNG } from '@/utils/rng';

interface EntradaEncuentro {
  especieId: EspecieId;
  peso: number;
  nivelMin: number;
  nivelMax: number;
}

const TABLA_PAMPA: EntradaEncuentro[] = [
  { especieId: 'mara',     peso: 30, nivelMin: 3, nivelMax: 7 },
  { especieId: 'vizcacha', peso: 25, nivelMin: 3, nivelMax: 7 },
  { especieId: 'nandu',    peso: 20, nivelMin: 4, nivelMax: 8 },
  { especieId: 'peludo',   peso: 15, nivelMin: 4, nivelMax: 8 },
  { especieId: 'yarara',   peso: 10, nivelMin: 5, nivelMax: 9 },
];

export const PROB_ENCUENTRO_POR_PASO = 0.10;

export function verificarEncuentro(rng: RNG): boolean {
  return rng.chance(PROB_ENCUENTRO_POR_PASO);
}

export function elegirWild(rng: RNG): { especieId: EspecieId; nivel: number } {
  const total = TABLA_PAMPA.reduce((s, e) => s + e.peso, 0);
  let r = rng.next() * total;
  for (const entrada of TABLA_PAMPA) {
    r -= entrada.peso;
    if (r <= 0) {
      const nivel = entrada.nivelMin + rng.rangoEntero(0, entrada.nivelMax - entrada.nivelMin);
      return { especieId: entrada.especieId, nivel };
    }
  }
  return { especieId: 'mara', nivel: 5 };
}
