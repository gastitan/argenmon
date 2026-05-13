import movesJson from '@/data/json/moves.json';
import { MovimientosArraySchema } from '@/data/schemas/move.schema';
import type { EfectoMovimiento } from '@/data/schemas/move.schema';
import type { Tipo } from '@/data/types';

export interface Movimiento {
  readonly id: string;
  readonly nombre: string;
  readonly tipo: Tipo;
  readonly categoria: 'fisico' | 'especial' | 'estado';
  readonly poder: number;
  readonly precision: number;
  readonly pp: number;
  readonly prioridad: number;
  readonly efecto?: EfectoMovimiento;
}

function loadMoves(): Record<string, Movimiento> {
  let parsed;
  try {
    parsed = MovimientosArraySchema.parse(movesJson);
  } catch (err) {
    console.error('Error parsing moves.json:', err);
    throw new Error('Failed to load moves data. Check moves.json structure.');
  }

  const result: Record<string, Movimiento> = {};
  for (const m of parsed) {
    if (result[m.id]) throw new Error(`Duplicate move id: ${m.id}`);
    const { efecto: efectoRaw, ...rest } = m;
    result[m.id] = { ...rest, ...(efectoRaw !== null ? { efecto: efectoRaw } : {}) };
  }
  return result;
}

export const MOVIMIENTOS: Record<string, Movimiento> = loadMoves();
export type MovimientoId = string;
