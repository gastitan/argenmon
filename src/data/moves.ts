import type { Tipo } from './types';

export type EfectoMovimiento =
  | { readonly tipo: 'envenenar'; readonly objetivo: 'defensor' }
  | { readonly tipo: 'evasion'; readonly objetivo: 'atacante'; readonly etapas: number };

export interface Movimiento {
  readonly id: string;
  readonly nombre: string;
  readonly tipo: Tipo;
  readonly categoria: 'fisico' | 'especial' | 'estado';
  readonly poder: number;
  readonly precision: number; // 0-100
  readonly pp: number;
  readonly prioridad: number;
  readonly efecto?: EfectoMovimiento;
}

export const MOVIMIENTOS = {
  // ── Hornero (Aire) ──────────────────────────────────────────────────────────
  picotazo: {
    id: 'picotazo', nombre: 'Picotazo',
    tipo: 'Aire' as Tipo, categoria: 'fisico', poder: 40, precision: 100, pp: 35, prioridad: 0,
  },
  vuelo_rasante: {
    id: 'vuelo_rasante', nombre: 'Vuelo Rasante',
    tipo: 'Aire' as Tipo, categoria: 'fisico', poder: 60, precision: 95, pp: 15, prioridad: 0,
  },
  ala_acero: {
    id: 'ala_acero', nombre: 'Ala de Acero',
    tipo: 'Normal' as Tipo, categoria: 'fisico', poder: 50, precision: 100, pp: 20, prioridad: 0,
  },
  rafaga: {
    id: 'rafaga', nombre: 'Ráfaga',
    tipo: 'Aire' as Tipo, categoria: 'especial', poder: 55, precision: 90, pp: 10, prioridad: 0,
  },

  // ── Mara (Tierra) ───────────────────────────────────────────────────────────
  patada_veloz: {
    id: 'patada_veloz', nombre: 'Patada Veloz',
    tipo: 'Tierra' as Tipo, categoria: 'fisico', poder: 40, precision: 100, pp: 30, prioridad: 1,
  },
  carrera: {
    id: 'carrera', nombre: 'Carrera',
    tipo: 'Tierra' as Tipo, categoria: 'fisico', poder: 65, precision: 90, pp: 20, prioridad: 0,
  },
  patada_doble: {
    id: 'patada_doble', nombre: 'Patada Doble',
    tipo: 'Tierra' as Tipo, categoria: 'fisico', poder: 55, precision: 95, pp: 20, prioridad: 0,
  },
  golpe_rapido: {
    id: 'golpe_rapido', nombre: 'Golpe Rápido',
    tipo: 'Normal' as Tipo, categoria: 'fisico', poder: 45, precision: 100, pp: 25, prioridad: 0,
  },

  // ── Vizcacha (Tierra) ───────────────────────────────────────────────────────
  zarpazo: {
    id: 'zarpazo', nombre: 'Zarpazo',
    tipo: 'Normal' as Tipo, categoria: 'fisico', poder: 45, precision: 100, pp: 30, prioridad: 0,
  },
  cuevada: {
    id: 'cuevada', nombre: 'Cuevada',
    tipo: 'Tierra' as Tipo, categoria: 'fisico', poder: 65, precision: 90, pp: 15, prioridad: 0,
  },
  golpe_bajo: {
    id: 'golpe_bajo', nombre: 'Golpe Bajo',
    tipo: 'Tierra' as Tipo, categoria: 'fisico', poder: 55, precision: 95, pp: 20, prioridad: 0,
  },
  escondite: {
    id: 'escondite', nombre: 'Escondite',
    tipo: 'Normal' as Tipo, categoria: 'estado', poder: 0, precision: 100, pp: 20, prioridad: 0,
    efecto: { tipo: 'evasion', objetivo: 'atacante', etapas: 1 } as EfectoMovimiento,
  },

  // ── Ñandú (Tierra/Aire) ─────────────────────────────────────────────────────
  patada_potente: {
    id: 'patada_potente', nombre: 'Patada Potente',
    tipo: 'Tierra' as Tipo, categoria: 'fisico', poder: 80, precision: 85, pp: 15, prioridad: 0,
  },
  ala_viento: {
    id: 'ala_viento', nombre: 'Ala de Viento',
    tipo: 'Aire' as Tipo, categoria: 'fisico', poder: 55, precision: 95, pp: 20, prioridad: 0,
  },
  embestida: {
    id: 'embestida', nombre: 'Embestida',
    tipo: 'Normal' as Tipo, categoria: 'fisico', poder: 50, precision: 100, pp: 25, prioridad: 0,
  },
  salto: {
    id: 'salto', nombre: 'Salto',
    tipo: 'Aire' as Tipo, categoria: 'fisico', poder: 70, precision: 90, pp: 15, prioridad: 0,
  },

  // ── Peludo (Tierra) ─────────────────────────────────────────────────────────
  aranazo: {
    id: 'aranazo', nombre: 'Arañazo',
    tipo: 'Normal' as Tipo, categoria: 'fisico', poder: 40, precision: 100, pp: 35, prioridad: 0,
  },
  enroscada: {
    id: 'enroscada', nombre: 'Enroscada',
    tipo: 'Tierra' as Tipo, categoria: 'fisico', poder: 60, precision: 95, pp: 20, prioridad: 0,
  },
  golpe_cola: {
    id: 'golpe_cola', nombre: 'Golpe de Cola',
    tipo: 'Normal' as Tipo, categoria: 'fisico', poder: 45, precision: 100, pp: 25, prioridad: 0,
  },
  terramoto: {
    id: 'terramoto', nombre: 'Terramoto',
    tipo: 'Tierra' as Tipo, categoria: 'fisico', poder: 80, precision: 85, pp: 10, prioridad: 0,
  },

  // ── Yarará (Veneno) ─────────────────────────────────────────────────────────
  mordida: {
    id: 'mordida', nombre: 'Mordida',
    tipo: 'Veneno' as Tipo, categoria: 'fisico', poder: 60, precision: 100, pp: 25, prioridad: 0,
  },
  colmillo_venenoso: {
    id: 'colmillo_venenoso', nombre: 'Colmillo Venenoso',
    tipo: 'Veneno' as Tipo, categoria: 'especial', poder: 65, precision: 90, pp: 15, prioridad: 0,
    efecto: { tipo: 'envenenar', objetivo: 'defensor' } as EfectoMovimiento,
  },
  constriccion: {
    id: 'constriccion', nombre: 'Constricción',
    tipo: 'Normal' as Tipo, categoria: 'fisico', poder: 35, precision: 100, pp: 30, prioridad: -1,
  },
  ataque_acido: {
    id: 'ataque_acido', nombre: 'Ataque Ácido',
    tipo: 'Veneno' as Tipo, categoria: 'especial', poder: 80, precision: 80, pp: 10, prioridad: 0,
  },
} as const satisfies Record<string, Movimiento>;

export type MovimientoId = keyof typeof MOVIMIENTOS;
