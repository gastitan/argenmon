import type { Criatura } from '@/entities/Criatura';
import type { Trampa } from '@/data/items';
import { captureFormula } from '@/utils/formulas';
import type { RNG } from '@/utils/rng';

export interface ResultadoCaptura {
  exito: boolean;
  sacudidas: number; // 1–3 sacudidas antes del resultado
}

export function intentarCaptura(criaturaWild: Criatura, trampa: Trampa, rng: RNG): ResultadoCaptura {
  const prob = captureFormula({
    hpMax: criaturaWild.hpMax,
    hpActual: criaturaWild.hpActual,
    tasaBase: criaturaWild.especie.tasaCaptura,
    bonusTrampa: trampa.bonusTrampa,
    conEstadoAlterado: criaturaWild.estadoAlterado !== null,
  });

  const exito = rng.chance(prob);
  // Sacudidas: éxito = 3, casi captura = 2, lejos = 1
  const sacudidas = exito ? 3 : prob >= 0.35 ? 2 : 1;

  return { exito, sacudidas };
}
