import { z } from 'zod';

const EntradaEncuentroSchema = z.object({
  especieId: z.string().min(1),
  peso: z.number().positive(),
  nivelMin: z.number().int().min(1),
  nivelMax: z.number().int().min(1),
});

export type EntradaEncuentro = z.infer<typeof EntradaEncuentroSchema>;

export const EncuentrosSchema = z.object({
  probEncuentroPorPaso: z.number().min(0).max(1),
  tablas: z.record(z.string(), z.array(EntradaEncuentroSchema).min(1)),
});

export type EncuentrosJSON = z.infer<typeof EncuentrosSchema>;
