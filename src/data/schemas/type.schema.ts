import { z } from 'zod';

export const TipoEnum = z.enum(['Tierra', 'Aire', 'Agua', 'Veneno', 'Normal']);
export type Tipo = z.infer<typeof TipoEnum>;
export const TIPOS = TipoEnum.options;

const RowSchema = z.object({
  Tierra: z.number(),
  Aire: z.number(),
  Agua: z.number(),
  Veneno: z.number(),
  Normal: z.number(),
});

export const TablaEfectividadSchema = z.object({
  Tierra: RowSchema,
  Aire: RowSchema,
  Agua: RowSchema,
  Veneno: RowSchema,
  Normal: RowSchema,
});
