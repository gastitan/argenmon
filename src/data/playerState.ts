import type { TrampaId } from './items';
import type { EspecieId } from './creatures';

export interface CriaturaGuardada {
  especieId: EspecieId;
  nivel: number;
}

export type Catalogo = Partial<Record<EspecieId, 'visto' | 'capturado'>>;
export type Inventario = Record<TrampaId, number>;

export const playerState = {
  inventario: { trampaComun: 3, trampaMonte: 0, trampaFina: 0 } as Inventario,
  equipo: [] as CriaturaGuardada[],
  entrenadoresDerrotados: [] as string[],
  catalogo: {} as Catalogo,
};
