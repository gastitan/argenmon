import { z } from 'zod';

const FlagDefSchema = z.object({
  default: z.boolean(),
  desc: z.string(),
});

const CounterDefSchema = z.object({
  default: z.number().int(),
  desc: z.string(),
});

const VariableDefSchema = z.object({
  default: z.string(),
  values: z.array(z.string()).min(1),
  desc: z.string(),
});

export const ProgressSchema = z.object({
  flags: z.record(z.string(), FlagDefSchema),
  counters: z.record(z.string(), CounterDefSchema),
  variables: z.record(z.string(), VariableDefSchema),
});

export type ProgressCatalog = z.infer<typeof ProgressSchema>;
