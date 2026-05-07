import type { Tipo } from '@/data/types';
import { efectividadCombinada } from '@/data/types';
import type { RNG } from './rng';

/**
 * Fórmula de daño del CLAUDE.md sección 8:
 *
 * daño = ((((2 × nivel / 5 + 2) × poder × atk / def) / 50) + 2) × modificadores
 *
 * modificadores:
 *   - STAB (Same-Type Attack Bonus): ×1.5 si el tipo del movimiento coincide con el del atacante
 *   - Efectividad del tipo: ×0.5, ×1, ×2 según tabla
 *   - Crítico: ×1.5 (probabilidad base 1/16)
 *   - Aleatorio: ×(0.85 a 1.0)
 */

export interface ParamsAtacante {
  nivel: number;
  atk: number;
  /** Tipos de la criatura atacante (1 o 2). */
  tipos: readonly Tipo[];
}

export interface ParamsDefensor {
  def: number;
  /** Tipos de la criatura defensora (1 o 2). */
  tipos: readonly Tipo[];
}

export interface ParamsMovimiento {
  poder: number;
  tipo: Tipo;
}

export interface ResultadoDanio {
  danio: number;
  esCritico: boolean;
  efectividad: number;
  stab: number;
  variance: number;
}

export interface OpcionesDanio {
  /** Forzar crítico (para tests). Si no se pasa, se decide con `rng.chance(1/16)`. */
  forzarCritico?: boolean;
  /** Forzar variance entre 0.85 y 1. Si no, se calcula con `rng`. */
  forzarVariance?: number;
}

export const PROB_CRITICO = 1 / 16;

export function damageFormula(
  atacante: ParamsAtacante,
  defensor: ParamsDefensor,
  movimiento: ParamsMovimiento,
  rng: RNG,
  opciones: OpcionesDanio = {},
): ResultadoDanio {
  const base = (((2 * atacante.nivel) / 5 + 2) * movimiento.poder * atacante.atk) / defensor.def;
  const danioBase = base / 50 + 2;

  const stab = atacante.tipos.includes(movimiento.tipo) ? 1.5 : 1;
  const efect = efectividadCombinada(movimiento.tipo, defensor.tipos);
  const esCritico = opciones.forzarCritico ?? rng.chance(PROB_CRITICO);
  const critMul = esCritico ? 1.5 : 1;
  const variance = opciones.forzarVariance ?? 0.85 + rng.next() * 0.15;

  const danio = Math.max(1, Math.floor(danioBase * stab * efect * critMul * variance));

  return { danio, esCritico, efectividad: efect, stab, variance };
}

/**
 * Fórmula de captura del CLAUDE.md sección 9:
 *
 * prob_captura = ((3 × hp_max - 2 × hp_actual) × tasa_base × bonus_trampa) / (3 × hp_max)
 * si hay estado alterado: bonus ×1.5
 */
export function captureFormula(params: {
  hpMax: number;
  hpActual: number;
  tasaBase: number;
  bonusTrampa: number;
  conEstadoAlterado: boolean;
}): number {
  const { hpMax, hpActual, tasaBase, bonusTrampa, conEstadoAlterado } = params;
  const numerador = (3 * hpMax - 2 * hpActual) * tasaBase * bonusTrampa;
  const denom = 3 * hpMax;
  let prob = numerador / denom;
  if (conEstadoAlterado) prob *= 1.5;
  return Math.max(0, Math.min(1, prob));
}
