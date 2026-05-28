import { z } from 'zod';
import { TipoEnum } from './type.schema';

export { TipoEnum };
export const CategoriaEnum = z.enum(['fisico', 'especial', 'estado']);

const EfectoEnvenenarSchema = z.object({
  tipo: z.literal('envenenar'),
  objetivo: z.literal('defensor'),
});

const EfectoEvasionSchema = z.object({
  tipo: z.literal('evasion'),
  objetivo: z.literal('atacante'),
  etapas: z.number().int().min(1),
});

const EfectoModificadorStatSchema = z.object({
  tipo: z.literal('modificador_stat'),
  objetivo: z.enum(['atacante', 'defensor']),
  stat: z.enum(['atk', 'def', 'atkEsp', 'defEsp', 'vel']),
  etapas: z.number().int().min(-6).max(6),
});

export const EfectoMovimientoSchema = z.union([
  EfectoEnvenenarSchema,
  EfectoEvasionSchema,
  EfectoModificadorStatSchema,
]);
export type EfectoMovimiento = z.infer<typeof EfectoMovimientoSchema>;
export type EfectoModificadorStat = z.infer<typeof EfectoModificadorStatSchema>;

export const MovimientoJSONSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  tipo: TipoEnum,
  categoria: CategoriaEnum,
  poder: z.number().int().min(0).max(255),
  precision: z.number().int().min(0).max(100),
  pp: z.number().int().min(1).max(64),
  prioridad: z.number().int().min(-7).max(7),
  efecto: EfectoMovimientoSchema.nullable(),
});

export type MovimientoJSON = z.infer<typeof MovimientoJSONSchema>;
export const MovimientosArraySchema = z.array(MovimientoJSONSchema);
