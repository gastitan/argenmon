import { describe, it, expect } from 'vitest';
import { CHARACTER_SPRITES, getCharacterSprite } from '@/data/loaders/loadCharacterSprites';
import { DATOS_CIVILES } from '@/data/loaders/loadCivilians';
import { DATOS_ENTRENADORES } from '@/data/trainers';
import characterSpritesJson from '@/data/json/character_sprites.json';
import { CharacterSpritesCatalogSchema } from '@/data/schemas/character_sprite.schema';

describe('Catálogo de sprites — carga y estructura', () => {
  it('carga exactamente 14 sprites', () => {
    expect(CHARACTER_SPRITES).toHaveLength(14);
  });

  it('todos tienen id, spriteKey, displayName, category y gender', () => {
    for (const s of CHARACTER_SPRITES) {
      expect(s.id).toBeTruthy();
      expect(s.spriteKey).toBeTruthy();
      expect(s.displayName).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(s.gender).toBeTruthy();
    }
  });

  it('cada spriteKey es "char_" + id', () => {
    for (const s of CHARACTER_SPRITES) {
      expect(s.spriteKey).toBe(`char_${s.id}`);
    }
  });

  it('category solo puede ser child, adult, elderly o boss', () => {
    const validas = ['child', 'adult', 'elderly', 'boss'];
    for (const s of CHARACTER_SPRITES) {
      expect(validas).toContain(s.category);
    }
  });

  it('gender solo puede ser male, female o neutral', () => {
    const validos = ['male', 'female', 'neutral'];
    for (const s of CHARACTER_SPRITES) {
      expect(validos).toContain(s.gender);
    }
  });
});

describe('getCharacterSprite', () => {
  it('devuelve el sprite para un id existente', () => {
    const s = getCharacterSprite('man_adult_1');
    expect(s).toBeDefined();
    expect(s!.spriteKey).toBe('char_man_adult_1');
  });

  it('devuelve undefined para un id inexistente', () => {
    expect(getCharacterSprite('id_que_no_existe')).toBeUndefined();
  });
});

describe('Catálogo de sprites — unicidad', () => {
  it('ids únicos en todo el catálogo', () => {
    const ids = CHARACTER_SPRITES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('spriteKeys únicos en todo el catálogo', () => {
    const keys = CHARACTER_SPRITES.map((s) => s.spriteKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('schema falla si hay ids duplicados', () => {
    const json = {
      sprites: [
        ...characterSpritesJson.sprites,
        { ...characterSpritesJson.sprites[0], spriteKey: 'char_duplicado_key' },
      ],
    };
    expect(() => CharacterSpritesCatalogSchema.parse(json)).toThrow();
  });

  it('schema falla si hay spriteKeys duplicados', () => {
    const json = {
      sprites: [
        ...characterSpritesJson.sprites,
        { ...characterSpritesJson.sprites[0], id: 'id_duplicado_unico' },
      ],
    };
    expect(() => CharacterSpritesCatalogSchema.parse(json)).toThrow();
  });
});

describe('Integración — spriteKeys char_* deben existir en el catálogo', () => {
  const catalogKeys = new Set(CHARACTER_SPRITES.map((s) => s.spriteKey));

  it('todos los spriteKey char_* de civilians.json están en el catálogo', () => {
    for (const civil of DATOS_CIVILES) {
      if (civil.spriteKey.startsWith('char_')) {
        expect(catalogKeys.has(civil.spriteKey)).toBe(true);
      }
    }
  });

  it('todos los spriteKey char_* de trainers.json están en el catálogo', () => {
    for (const trainer of DATOS_ENTRENADORES) {
      if (trainer.spriteKey && trainer.spriteKey.startsWith('char_')) {
        expect(catalogKeys.has(trainer.spriteKey)).toBe(true);
      }
    }
  });
});
