/**
 * Sistema de tipos del CLAUDE.md sección 7.
 * Tabla de efectividad: TABLA[atacante][defensor].
 */

export const TIPOS = ['Tierra', 'Aire', 'Agua', 'Veneno', 'Normal'] as const;
export type Tipo = (typeof TIPOS)[number];

export const TABLA_EFECTIVIDAD: Readonly<Record<Tipo, Readonly<Record<Tipo, number>>>> = {
  Tierra: { Tierra: 1, Aire: 0.5, Agua: 1, Veneno: 2, Normal: 1 },
  Aire:   { Tierra: 2, Aire: 1,   Agua: 1, Veneno: 1, Normal: 1 },
  Agua:   { Tierra: 2, Aire: 1,   Agua: 0.5, Veneno: 1, Normal: 1 },
  Veneno: { Tierra: 1, Aire: 1,   Agua: 1, Veneno: 0.5, Normal: 1 },
  Normal: { Tierra: 1, Aire: 1,   Agua: 1, Veneno: 1, Normal: 1 },
};

export function efectividad(atacante: Tipo, defensor: Tipo): number {
  return TABLA_EFECTIVIDAD[atacante][defensor];
}

export function efectividadCombinada(atacante: Tipo, tiposDefensor: readonly Tipo[]): number {
  return tiposDefensor.reduce((acc, t) => acc * efectividad(atacante, t), 1);
}
