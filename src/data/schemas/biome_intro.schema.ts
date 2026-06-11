import { z } from 'zod';

export const BiomeIntroEntrySchema = z.object({
  encabezadoFecha: z.string().min(1),
  lugar: z.string().min(1),
  cuerpo: z.array(z.string().min(1)).min(1),
  leyendaPropiedad: z.string().min(1).optional(),
});

export type BiomeIntroEntry = z.infer<typeof BiomeIntroEntrySchema>;

export const BiomeIntrosCatalogSchema = z.record(z.string(), BiomeIntroEntrySchema);
export type BiomeIntrosCatalog = z.infer<typeof BiomeIntrosCatalogSchema>;
