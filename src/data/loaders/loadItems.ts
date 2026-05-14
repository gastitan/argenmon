import itemsJson from '@/data/json/items.json';
import { TrampasArraySchema } from '@/data/schemas/item.schema';
import type { Trampa, TrampaId } from '@/data/schemas/item.schema';

function loadItems(): Record<TrampaId, Trampa> {
  let parsed;
  try {
    parsed = TrampasArraySchema.parse(itemsJson);
  } catch (err) {
    console.error('Error parsing items.json:', err);
    throw new Error('Failed to load items data. Check items.json structure.');
  }

  const result = {} as Record<TrampaId, Trampa>;
  for (const t of parsed) {
    result[t.id] = t;
  }
  return result;
}

export const TRAMPAS: Record<TrampaId, Trampa> = loadItems();
