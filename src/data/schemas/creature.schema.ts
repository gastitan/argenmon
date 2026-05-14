import { z } from 'zod';
import { TipoEnum } from './type.schema';

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
  movimientosIniciales: z.array(z.string().min(1)).length(4),
  spriteKey: z.string().min(1),
});

export type EspecieJSON = z.infer<typeof EspecieJSONSchema>;
export const EspeciesArraySchema = z.array(EspecieJSONSchema);
