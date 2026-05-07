export interface Trampa {
  readonly id: TrampaId;
  readonly nombre: string;
  readonly bonusTrampa: number;
}

export const TRAMPAS = {
  trampaComun: { id: 'trampaComun' as const, nombre: 'Trampa Común', bonusTrampa: 1 },
  trampaMonte: { id: 'trampaMonte' as const, nombre: 'Trampa de Monte', bonusTrampa: 1.5 },
  trampaFina: { id: 'trampaFina' as const, nombre: 'Trampa Fina', bonusTrampa: 2.5 },
} as const satisfies Record<string, Trampa>;

export type TrampaId = 'trampaComun' | 'trampaMonte' | 'trampaFina';
