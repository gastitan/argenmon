import { z } from 'zod';
import { TrampaIdEnum } from './item.schema';

export const CivilSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  tileX: z.number().int().min(0),
  tileY: z.number().int().min(0),
  spriteKey: z.string().min(1),
  dialogos: z.array(z.string().min(1)).min(1),
  regaloTrampas: z.object({
    tipo: TrampaIdEnum,
    cantidad: z.number().int().min(1),
    flag: z.string().min(1),
  }).optional(),
});

export type CivilJSON = z.infer<typeof CivilSchema>;

export const CivilesDatosSchema = z.object({
  civiles: z.array(CivilSchema).min(1),
});

export type CivilesDatosJSON = z.infer<typeof CivilesDatosSchema>;
