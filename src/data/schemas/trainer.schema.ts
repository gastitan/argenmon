import { z } from 'zod';

const DireccionEnum = z.enum(['up', 'down', 'left', 'right']);

const EquipoEntrenadorSchema = z.object({
  especieId: z.string().min(1),
  nivel: z.number().int().min(1).max(100),
});

export const EntrenadorJSONSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  tileX: z.number().int().min(0),
  tileY: z.number().int().min(0),
  direccion: DireccionEnum,
  visionTiles: z.number().int().min(1),
  equipo: z.array(EquipoEntrenadorSchema).min(1),
  esJefeFinal: z.boolean(),
  spriteKey: z.string().optional(),
  flagDerrota: z.string().optional(),
  dialogoPreBatalla: z.string().optional(),
  dialogoPostDerrota: z.string().optional(),
});

export type EntrenadorJSON = z.infer<typeof EntrenadorJSONSchema>;
export const EntrenadoresArraySchema = z.array(EntrenadorJSONSchema);
