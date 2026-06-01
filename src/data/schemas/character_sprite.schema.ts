import { z } from 'zod';

export const SpriteCategoria = z.enum(['child', 'adult', 'elderly', 'boss']);
export const SpriteGenero = z.enum(['male', 'female', 'neutral']);

export const CharacterSpriteSchema = z.object({
  id: z.string().min(1),
  spriteKey: z.string().min(1),
  displayName: z.string().min(1),
  category: SpriteCategoria,
  gender: SpriteGenero,
  tags: z.array(z.string()),
});

export type CharacterSprite = z.infer<typeof CharacterSpriteSchema>;

export const CharacterSpritesCatalogSchema = z.object({
  sprites: z
    .array(CharacterSpriteSchema)
    .refine((arr) => new Set(arr.map((s) => s.id)).size === arr.length, {
      message: 'ids duplicados en el catálogo de sprites',
    })
    .refine((arr) => new Set(arr.map((s) => s.spriteKey)).size === arr.length, {
      message: 'spriteKeys duplicados en el catálogo de sprites',
    }),
});
