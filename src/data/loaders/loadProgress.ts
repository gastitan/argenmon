import { ProgressSchema } from '@/data/schemas/progress.schema';
import type { ProgressCatalog } from '@/data/schemas/progress.schema';
import progressJson from '@/data/json/progress.json';

let catalogo: ProgressCatalog | null = null;

export function cargarCatalogoProgreso(): ProgressCatalog {
  if (catalogo) return catalogo;
  const resultado = ProgressSchema.safeParse(progressJson);
  if (!resultado.success) {
    throw new Error(`[progress.json] Error de validación Zod:\n${resultado.error.toString()}`);
  }
  catalogo = resultado.data;
  return catalogo;
}
