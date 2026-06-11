import Phaser from 'phaser';
import { SCENE_KEYS, PALETA, TILE_SIZE } from '@/config';
import { CHARACTER_SPRITES } from '@/data/loaders/loadCharacterSprites';

/**
 * Genera placeholders gráficos en lugar de cargar assets externos.
 * Cumple con el CLAUDE.md: solo se usan los 4 colores de la paleta GB.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  preload(): void {
    // CREATURES
    this.load.image('sprite_hornero', 'assets/sprites/hornero.png');
    this.load.image('sprite_yarara', 'assets/sprites/yarara.png');
    this.load.image('sprite_mara', 'assets/sprites/mara.png');
    this.load.image('sprite_peludo', 'assets/sprites/peludo.png');
    this.load.image('sprite_nandu', 'assets/sprites/nandu.png');
    this.load.image('sprite_vizcacha', 'assets/sprites/vizcacha.png');
    this.load.image('sprite_dogo', 'assets/sprites/dogo.png');
    this.load.image('sprite_jabali', 'assets/sprites/jabali.png');
    this.load.image('sprite_coipo', 'assets/sprites/coipo.png');
    this.load.image('sprite_zorro', 'assets/sprites/zorro.png');
    this.load.image('sprite_ciervo', 'assets/sprites/ciervo.png');
    // PLAYER
    this.load.image('player_sprite', 'assets/sprites/player.png');
    // NPC sprites del catálogo genérico
    for (const sprite of CHARACTER_SPRITES) {
      this.load.image(sprite.spriteKey, `assets/raw_sprites/characters/${sprite.spriteKey}.png`);
    }
    // NPCs custom (no están en el catálogo: sprites únicos o no migrados)
    this.load.image('npc_capataz', 'assets/sprites/capataz.png');
    this.load.image('npc_peon_2', 'assets/sprites/peon_2.png');
    this.load.image('npc_peon_3', 'assets/sprites/peon_3.png');
    // TEST: pasto_1.png pintado a mano, evaluación visual antes de pintar las otras variantes.
    this.load.image('tile_pasto_bajo', 'assets/raw_sprites/tilesets/pasto_1.png');
    // TEST: pasto_alto_1.png pintado a mano, evaluación visual.
    this.load.image('tile_pasto_alto', 'assets/raw_sprites/tilesets/pasto_alto_1.png');
    // TEST: agua_1.png pintado a mano. Último tile base de Pampa.
    this.load.image('tile_agua', 'assets/raw_sprites/tilesets/agua_1.png');
    this.load.image('tile_vereda', 'assets/raw_sprites/tilesets/vereda.png');
    this.load.image('tile_monte', 'assets/raw_sprites/tilesets/monte.png');
    this.load.image('tile_tierra_pelada', 'assets/raw_sprites/tilesets/tierra_pelada.png');
    this.load.image('tile_camino', 'assets/raw_sprites/tilesets/camino_tierra.png');
    this.load.image('tile_orilla', 'assets/raw_sprites/tilesets/orilla.png');
    this.load.image('tile_orilla_2', 'assets/raw_sprites/tilesets/orilla-2.png');
    // TREES
    this.load.image('arbol_ombu', 'assets/raw_sprites/tilesets/ombu.png');
    this.load.image('arbol_ceibo', 'assets/raw_sprites/tilesets/ceibo.png');
    this.load.image('arbol_algarrobo', 'assets/raw_sprites/tilesets/algarrobo.png');
    // WORLD OBJECTS
    this.load.image('rancho_a', 'assets/sprites/rancho_a.png');
    this.load.image('rancho_b', 'assets/sprites/rancho_b.png');
    this.load.image('almacen', 'assets/sprites/almacen.png');
    this.load.image('escuela', 'assets/sprites/escuela.png');
    this.load.image('casona_estancia', 'assets/sprites/estancia.png');
    this.load.image('tranquera_malvi', 'assets/sprites/tranquera.png');
    this.load.image('cerco_vertical', 'assets/sprites/cerco-vertical.png');
    this.load.image('cerco_horizontal', 'assets/sprites/cerco-horizontal.png');
    this.load.image('iglesia', 'assets/sprites/iglesia.png');
    this.load.image('veterinaria', 'assets/sprites/veterinaria.png');
    this.crearTileset();
  }

  create(): void {
    // Render en dos pasadas: terreno + objetos. Ver mini-sprint árboles.
    // Tile ID=0 y tile ID=2 muestran pasto en la pasada de terreno (Tilemap).
    // Los sprites de árbol se superponen en crearArboles() de OverworldScene.
    const tilesetTex = this.textures.get('tileset');
    const canvas = tilesetTex.getSourceImage() as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const pastoImg = this.textures.get('tile_pasto_bajo').getSourceImage() as HTMLImageElement;

    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(pastoImg, 0, 0, TILE_SIZE, TILE_SIZE);

    // TEST: pasto_alto_1.png pintado a mano, evaluación visual.
    const pastoAltoImg = this.textures.get('tile_pasto_alto').getSourceImage() as HTMLImageElement;
    ctx.clearRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(pastoAltoImg, TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);

    ctx.clearRect(TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(pastoImg, TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE);

    // TEST: agua_1.png pintado a mano. Último tile base de Pampa.
    const aguaImg = this.textures.get('tile_agua').getSourceImage() as HTMLImageElement;
    ctx.clearRect(TILE_SIZE * 3, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(aguaImg, TILE_SIZE * 3, 0, TILE_SIZE, TILE_SIZE);

    const veredaImg = this.textures.get('tile_vereda').getSourceImage() as HTMLImageElement;
    ctx.clearRect(TILE_SIZE * 4, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(veredaImg, TILE_SIZE * 4, 0, TILE_SIZE, TILE_SIZE);

    const monteImg = this.textures.get('tile_monte').getSourceImage() as HTMLImageElement;
    ctx.clearRect(TILE_SIZE * 5, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(monteImg, TILE_SIZE * 5, 0, TILE_SIZE, TILE_SIZE);

    const tierraImg = this.textures.get('tile_tierra_pelada').getSourceImage() as HTMLImageElement;
    ctx.clearRect(TILE_SIZE * 6, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(tierraImg, TILE_SIZE * 6, 0, TILE_SIZE, TILE_SIZE);

    const caminoImg = this.textures.get('tile_camino').getSourceImage() as HTMLImageElement;
    ctx.clearRect(TILE_SIZE * 7, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(caminoImg, TILE_SIZE * 7, 0, TILE_SIZE, TILE_SIZE);

    const orillaImg = this.textures.get('tile_orilla').getSourceImage() as HTMLImageElement;
    ctx.clearRect(TILE_SIZE * 8, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(orillaImg, TILE_SIZE * 8, 0, TILE_SIZE, TILE_SIZE);

    const orilla2Img = this.textures.get('tile_orilla_2').getSourceImage() as HTMLImageElement;
    ctx.clearRect(TILE_SIZE * 9, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(orilla2Img, TILE_SIZE * 9, 0, TILE_SIZE, TILE_SIZE);

    tilesetTex.source[0].update();

    this.scene.start(SCENE_KEYS.Menu);
  }

  private crearTileset(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const TILES = 10;
    const W = TILE_SIZE * TILES;
    const H = TILE_SIZE;

    g.fillStyle(PALETA.clarisimo, 1).fillRect(0, 0, TILE_SIZE, H);
    for (let i = 0; i < 6; i++) {
      const x = (i * 7) % TILE_SIZE;
      const y = (i * 5) % TILE_SIZE;
      g.fillStyle(PALETA.claro, 1).fillRect(x, y, 1, 1);
    }

    const passOff = TILE_SIZE;
    g.fillStyle(PALETA.claro, 1).fillRect(passOff, 0, TILE_SIZE, H);
    for (let i = 0; i < 4; i++) {
      const x = passOff + (i * 5 + 2) % TILE_SIZE;
      const y = (i * 3 + 1) % TILE_SIZE;
      g.fillStyle(PALETA.oscuro, 1).fillRect(x, y, 2, 2);
      g.fillStyle(PALETA.oscurisimo, 1).fillRect(x, y, 1, 1);
    }

    const treeOff = TILE_SIZE * 2;
    g.fillStyle(PALETA.clarisimo, 1).fillRect(treeOff, 0, TILE_SIZE, H);
    g.fillStyle(PALETA.oscurisimo, 1).fillRect(treeOff + 7, 11, 2, 5);
    g.fillStyle(PALETA.oscuro, 1).fillRect(treeOff + 3, 1, 10, 11);
    g.fillStyle(PALETA.oscurisimo, 1).fillRect(treeOff + 4, 2, 1, 1);
    g.fillStyle(PALETA.oscurisimo, 1).fillRect(treeOff + 11, 3, 1, 1);
    g.fillStyle(PALETA.oscurisimo, 1).fillRect(treeOff + 7, 8, 1, 1);

    const waterOff = TILE_SIZE * 3;
    g.fillStyle(PALETA.oscuro, 1).fillRect(waterOff, 0, TILE_SIZE, H);
    g.fillStyle(PALETA.claro, 1).fillRect(waterOff + 2, 4, 6, 1);
    g.fillStyle(PALETA.claro, 1).fillRect(waterOff + 8, 11, 6, 1);
    g.fillStyle(PALETA.oscurisimo, 1).fillRect(waterOff + 1, 9, 4, 1);

    const veredaOff = TILE_SIZE * 4;
    g.fillStyle(0x8a8a85, 1).fillRect(veredaOff, 0, TILE_SIZE, H);

    const monteOff = TILE_SIZE * 5;
    g.fillStyle(0x4a6b3a, 1).fillRect(monteOff, 0, TILE_SIZE, H);

    const tierraOff = TILE_SIZE * 6;
    g.fillStyle(0xa87b4f, 1).fillRect(tierraOff, 0, TILE_SIZE, H);

    const caminoOff = TILE_SIZE * 7;
    g.fillStyle(0xc9a576, 1).fillRect(caminoOff, 0, TILE_SIZE, H);

    const orillaOff = TILE_SIZE * 8;
    g.fillStyle(0x5a8a6a, 1).fillRect(orillaOff, 0, TILE_SIZE, H);

    const orilla2Off = TILE_SIZE * 9;
    g.fillStyle(0x4a7a60, 1).fillRect(orilla2Off, 0, TILE_SIZE, H);

    g.generateTexture('tileset', W, H);
    g.destroy();
  }
}
