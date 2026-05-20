import Phaser from 'phaser';
import { SCENE_KEYS, PALETA, TILE_SIZE } from '@/config';

/**
 * Genera placeholders gráficos en lugar de cargar assets externos.
 * Cumple con el CLAUDE.md: solo se usan los 4 colores de la paleta GB.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  preload(): void {
    this.load.image('sprite_hornero', 'assets/sprites/hornero.png');
    this.load.image('sprite_yarara', 'assets/sprites/yarara.png');
    this.load.image('sprite_mara', 'assets/sprites/mara.png');
    this.load.image('sprite_peludo', 'assets/sprites/peludo.png');
    this.load.image('sprite_nandu', 'assets/sprites/nandu.png');
    this.load.image('sprite_vizcacha', 'assets/sprites/vizcacha.png');
    this.load.image('player_sprite', 'assets/sprites/player.png');
    // TEST: pasto_1.png pintado a mano, evaluación visual antes de pintar las otras variantes.
    this.load.image('tile_pasto_bajo', 'assets/raw_sprites/tilesets/pasto_1.png');
    // TEST: pasto_alto_1.png pintado a mano, evaluación visual.
    this.load.image('tile_pasto_alto', 'assets/raw_sprites/tilesets/pasto_alto_1.png');
    // TEST: agua_1.png pintado a mano. Último tile base de Pampa.
    this.load.image('tile_agua', 'assets/raw_sprites/tilesets/agua_1.png');
    this.load.image('arbol_ombu', 'assets/raw_sprites/tilesets/ombu.png');
    this.load.image('arbol_ceibo', 'assets/raw_sprites/tilesets/ceibo.png');
    this.load.image('arbol_algarrobo', 'assets/raw_sprites/tilesets/algarrobo.png');
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

    tilesetTex.source[0].update();

    this.scene.start(SCENE_KEYS.Menu);
  }

  private crearTileset(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const TILES = 4;
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

    g.generateTexture('tileset', W, H);
    g.destroy();
  }
}
