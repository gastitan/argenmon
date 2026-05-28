import { z } from 'zod';

export const ObjetoMundoSchema = z.object({
  id: z.string().min(1),
  spriteId: z.string().min(1),
  posicion: z.object({
    x: z.number().int().min(0).max(59),
    y: z.number().int().min(0).max(29),
  }),
  spriteWidth: z.number().int().positive(),
  spriteHeight: z.number().int().positive(),
  // Offsets relativos al tile de anclaje. Omitir para usar footprint automático.
  footprint: z.array(z.object({ dx: z.number().int(), dy: z.number().int() })).optional(),
});

export type ObjetoMundo = z.infer<typeof ObjetoMundoSchema>;

export const ObjetosMundoSchema = z.object({
  objetos: z.array(ObjetoMundoSchema),
});

export type ObjetosMundoJSON = z.infer<typeof ObjetosMundoSchema>;
