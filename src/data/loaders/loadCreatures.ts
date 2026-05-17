import creaturesJson from '@/data/json/creatures.json';
import { EspeciesArraySchema } from '@/data/schemas/creature.schema';
import { MOVIMIENTOS } from '@/data/loaders/loadMoves';
import type { Tipo } from '@/data/schemas/type.schema';

export interface MovepoolEntrada {
  readonly nivel: number;
  readonly movimientoId: string;
}

export interface EspecieBase {
  readonly id: string;
  readonly nombre: string;
  readonly tipos: readonly Tipo[];
  readonly hpBase: number;
  readonly atkBase: number;
  readonly defBase: number;
  readonly atkEspBase: number;
  readonly defEspBase: number;
  readonly velBase: number;
  readonly tasaCaptura: number;
  readonly movepool: readonly MovepoolEntrada[];
  readonly spriteKey: string;
}

export type EspecieId = string;

function loadCreatures(): Record<string, EspecieBase> {
  let parsed;
  try {
    parsed = EspeciesArraySchema.parse(creaturesJson);
  } catch (err) {
    console.error('Error parsing creatures.json:', err);
    throw new Error('Failed to load creatures data. Check creatures.json structure.');
  }

  const result: Record<string, EspecieBase> = {};
  for (const c of parsed) {
    if (result[c.id]) throw new Error(`Duplicate creature id: ${c.id}`);
    for (const entrada of c.movepool) {
      if (!MOVIMIENTOS[entrada.movimientoId]) {
        throw new Error(`Creature ${c.id} movepool references unknown move: ${entrada.movimientoId}`);
      }
    }
    result[c.id] = c;
  }
  return result;
}

export const ESPECIES: Record<string, EspecieBase> = loadCreatures();
