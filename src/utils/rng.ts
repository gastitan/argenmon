/**
 * RNG seedeable para que los tests sean determinísticos.
 * Algoritmo: Mulberry32 (rápido, suficiente para combate de juego).
 */

export interface RNG {
  next(): number;
  rangoEntero(min: number, maxInclusive: number): number;
  chance(probabilidad: number): boolean;
}

export function crearRNG(seed: number): RNG {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    rangoEntero(min, maxInclusive) {
      return Math.floor(next() * (maxInclusive - min + 1)) + min;
    },
    chance(probabilidad) {
      return next() < probabilidad;
    },
  };
}

/** Wrapper de Math.random para producción. */
export const rngGlobal: RNG = {
  next: () => Math.random(),
  rangoEntero: (min, maxInclusive) => Math.floor(Math.random() * (maxInclusive - min + 1)) + min,
  chance: (p) => Math.random() < p,
};
