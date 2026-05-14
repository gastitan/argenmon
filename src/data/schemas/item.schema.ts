import { z } from 'zod';

export const TrampaIdEnum = z.enum(['trampaComun', 'trampaMonte', 'trampaFina']);
export type TrampaId = z.infer<typeof TrampaIdEnum>;

export const TrampaSchema = z.object({
  id: TrampaIdEnum,
  nombre: z.string().min(1),
  bonusTrampa: z.number().positive(),
});

export type Trampa = z.infer<typeof TrampaSchema>;
export const TrampasArraySchema = z.array(TrampaSchema);
