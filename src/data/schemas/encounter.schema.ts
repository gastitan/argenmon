import { z } from 'zod';

const EntradaEncuentroSchema = z.object({
  especieId: z.string().min(1),
  peso: z.number().positive(),
  nivelMin: z.number().int().min(1),
  nivelMax: z.number().int().min(1),
});

export type EntradaEncuentro = z.infer<typeof EntradaEncuentroSchema>;

const TablaEncuentroSchema = z.object({
  rate: z.number().min(0).max(1),
  tipoTile: z.string().min(1),
  criaturas: z.array(EntradaEncuentroSchema).min(1),
});

export type TablaEncuentro = z.infer<typeof TablaEncuentroSchema>;

export const EncuentrosSchema = z.object({
  tablas: z.record(z.string(), TablaEncuentroSchema),
});

export type EncuentrosJSON = z.infer<typeof EncuentrosSchema>;
