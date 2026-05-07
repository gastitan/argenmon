import type { Tipo } from './types';
import type { MovimientoId } from './moves';

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
  readonly tasaCaptura: number; // 0-1
  readonly movimientosIniciales: readonly MovimientoId[];
}

export const ESPECIES = {
  hornero: {
    id: 'hornero', nombre: 'Hornero',
    tipos: ['Aire'] as const,
    hpBase: 55, atkBase: 55, defBase: 55, atkEspBase: 55, defEspBase: 55, velBase: 55,
    tasaCaptura: 0.35,
    movimientosIniciales: ['picotazo', 'vuelo_rasante', 'ala_acero', 'rafaga'],
  },
  mara: {
    id: 'mara', nombre: 'Mara',
    tipos: ['Tierra'] as const,
    hpBase: 45, atkBase: 60, defBase: 40, atkEspBase: 35, defEspBase: 40, velBase: 80,
    tasaCaptura: 0.40,
    movimientosIniciales: ['patada_veloz', 'carrera', 'patada_doble', 'golpe_rapido'],
  },
  vizcacha: {
    id: 'vizcacha', nombre: 'Vizcacha',
    tipos: ['Tierra'] as const,
    hpBase: 60, atkBase: 45, defBase: 85, atkEspBase: 40, defEspBase: 70, velBase: 30,
    tasaCaptura: 0.35,
    movimientosIniciales: ['zarpazo', 'cuevada', 'golpe_bajo', 'escondite'],
  },
  nandu: {
    id: 'nandu', nombre: 'Ñandú',
    tipos: ['Tierra', 'Aire'] as const,
    hpBase: 55, atkBase: 80, defBase: 45, atkEspBase: 35, defEspBase: 45, velBase: 75,
    tasaCaptura: 0.30,
    movimientosIniciales: ['patada_potente', 'ala_viento', 'embestida', 'salto'],
  },
  peludo: {
    id: 'peludo', nombre: 'Peludo',
    tipos: ['Tierra'] as const,
    hpBase: 75, atkBase: 55, defBase: 90, atkEspBase: 30, defEspBase: 80, velBase: 20,
    tasaCaptura: 0.25,
    movimientosIniciales: ['aranazo', 'enroscada', 'golpe_cola', 'terramoto'],
  },
  yarara: {
    id: 'yarara', nombre: 'Yarará',
    tipos: ['Veneno'] as const,
    hpBase: 40, atkBase: 50, defBase: 35, atkEspBase: 85, defEspBase: 50, velBase: 60,
    tasaCaptura: 0.30,
    movimientosIniciales: ['mordida', 'colmillo_venenoso', 'constriccion', 'ataque_acido'],
  },
} as const satisfies Record<string, EspecieBase>;

export type EspecieId = keyof typeof ESPECIES;

export function calcularStat(base: number, nivel: number): number {
  return Math.floor(((base * 2 * nivel) / 100) + nivel + 5);
}

export function calcularHP(base: number, nivel: number): number {
  return Math.floor(((base * 2 * nivel) / 100) + nivel + 10);
}
