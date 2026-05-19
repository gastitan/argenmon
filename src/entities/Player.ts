import Phaser from 'phaser';
import { TILE_SIZE, MOVE_DURATION_MS } from '@/config';

type EstadoPlayer = 'idle' | 'moving';

type EsBloqueado = (tileX: number, tileY: number) => boolean;

/**
 * Movimiento por grilla, estilo GameBoy: una tecla = un tile, sin physics continuas.
 * Mientras se mueve, ignora más input. Al llegar emite 'player-step' en la scene.
 */
export class Player {
  readonly sprite: Phaser.GameObjects.Image;
  private estado: EstadoPlayer = 'idle';
  private tileX: number;
  private tileY: number;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };

  constructor(
    private scene: Phaser.Scene,
    startTileX: number,
    startTileY: number,
    private esBloqueado: EsBloqueado,
  ) {
    this.tileX = startTileX;
    this.tileY = startTileY;
    // TEST: sprite temporal 32×48 para validación visual
    this.sprite = scene.add
      .image(startTileX * TILE_SIZE + TILE_SIZE / 2, startTileY * TILE_SIZE + TILE_SIZE, 'player_sprite')
      .setOrigin(0.5, 1);

    if (!scene.input.keyboard) throw new Error('Falta keyboard input');
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(_delta: number): void {
    if (this.estado !== 'idle') return;

    let dx = 0;
    let dy = 0;
    if (this.cursors.left?.isDown || this.wasd.left.isDown) dx = -1;
    else if (this.cursors.right?.isDown || this.wasd.right.isDown) dx = 1;
    else if (this.cursors.up?.isDown || this.wasd.up.isDown) dy = -1;
    else if (this.cursors.down?.isDown || this.wasd.down.isDown) dy = 1;

    if (dx === 0 && dy === 0) return;

    const nuevoTX = this.tileX + dx;
    const nuevoTY = this.tileY + dy;
    if (this.esBloqueado(nuevoTX, nuevoTY)) return;

    this.iniciarMovimiento(nuevoTX, nuevoTY);
  }

  private iniciarMovimiento(nuevoTX: number, nuevoTY: number): void {
    this.estado = 'moving';

    const targetX = nuevoTX * TILE_SIZE + TILE_SIZE / 2;
    const targetY = nuevoTY * TILE_SIZE + TILE_SIZE; // TEST: sprite temporal 32×48

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      duration: MOVE_DURATION_MS,
      ease: 'Linear',
      onComplete: () => {
        this.tileX = nuevoTX;
        this.tileY = nuevoTY;
        this.estado = 'idle';
        this.scene.events.emit('player-step', this.tileX, this.tileY);
      },
    });
  }

  get posicionTile(): { x: number; y: number } {
    return { x: this.tileX, y: this.tileY };
  }
}
