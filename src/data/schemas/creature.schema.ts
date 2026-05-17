import { z } from 'zod';
import { TipoEnum } from './type.schema';

export const MovepoolEntradaSchema = z.object({
  nivel: z.number().int().min(1),
  movimientoId: z.string().min(1),
});

export const EspecieJSONSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  tipos: z.array(TipoEnum).min(1).max(2),
  hpBase: z.number().int().min(1).max(255),
  atkBase: z.number().int().min(1).max(255),
  defBase: z.number().int().min(1).max(255),
  atkEspBase: z.number().int().min(1).max(255),
  defEspBase: z.number().int().min(1).max(255),
  velBase: z.number().int().min(1).max(255),
  tasaCaptura: z.number().min(0).max(1),
  movepool: z.array(MovepoolEntradaSchema).min(1),
  spriteKey: z.string().min(1),
});

export type EspecieJSON = z.infer<typeof EspecieJSONSchema>;
export type MovepoolEntradaJSON = z.infer<typeof MovepoolEntradaSchema>;
export const EspeciesArraySchema = z.array(EspecieJSONSchema);
