import type { EspecieId } from './creatures';

export type BattleConfig =
  | { tipo: 'wild'; especieId: EspecieId; nivel: number }
  | { tipo: 'entrenador'; entrenadorId: string }
  | { tipo: 'debug' };

export interface EquipoEntrenador {
  especieId: EspecieId;
  nivel: number;
}

export interface DatosEntrenador {
  id: string;
  nombre: string;
  tileX: number;
  tileY: number;
  direccion: 'up' | 'down' | 'left' | 'right';
  visionTiles: number;
  equipo: EquipoEntrenador[];
  esJefeFinal?: boolean;
}

// Posiciones validadas contra el mapa de 30×20 tiles (todo _ en esas coords)
export const DATOS_ENTRENADORES: DatosEntrenador[] = [
  {
    id: 'peon',
    nombre: 'El Peón',
    tileX: 10, tileY: 10,
    direccion: 'down', visionTiles: 4,
    equipo: [{ especieId: 'mara', nivel: 7 }],
  },
  {
    id: 'maestra',
    nombre: 'La Maestra Rural',
    tileX: 19, tileY: 3,
    direccion: 'down', visionTiles: 5,
    equipo: [
      { especieId: 'vizcacha', nivel: 8 },
      { especieId: 'hornero', nivel: 7 },
    ],
  },
  {
    id: 'almacenero',
    nombre: 'El Almacenero',
    tileX: 5, tileY: 15,
    direccion: 'right', visionTiles: 5,
    equipo: [{ especieId: 'nandu', nivel: 9 }],
  },
  {
    id: 'capataz',
    nombre: 'El Capataz',
    tileX: 26, tileY: 16,
    direccion: 'left', visionTiles: 8,
    equipo: [
      { especieId: 'yarara', nivel: 14 },
      { especieId: 'peludo', nivel: 15 },
      { especieId: 'nandu', nivel: 15 },
    ],
    esJefeFinal: true,
  },
];

export function encontrarEntrenador(id: string): DatosEntrenador | undefined {
  return DATOS_ENTRENADORES.find((e) => e.id === id);
}
