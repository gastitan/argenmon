import characterSpritesJson from '@/data/json/character_sprites.json';
import { CharacterSpritesCatalogSchema } from '@/data/schemas/character_sprite.schema';
import type { CharacterSprite } from '@/data/schemas/character_sprite.schema';

export type { CharacterSprite };

function loadCharacterSprites(): CharacterSprite[] {
  let parsed;
  try {
    parsed = CharacterSpritesCatalogSchema.parse(characterSpritesJson);
  } catch (err) {
    console.error('Error parsing character_sprites.json:', err);
    throw new Error(
      'Failed to load character sprites catalog. Check character_sprites.json structure.'
    );
  }
  return parsed.sprites;
}

export const CHARACTER_SPRITES: CharacterSprite[] = loadCharacterSprites();

export function getCharacterSprite(id: string): CharacterSprite | undefined {
  return CHARACTER_SPRITES.find((s) => s.id === id);
}
