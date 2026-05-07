import Phaser from 'phaser';
import { PALETA_HEX, SCENE_KEYS, TILE_SIZE, FONT } from '@/config';
import { Player } from '@/entities/Player';
import { mapaPampaInicial } from '@/data/maps';
import { playerState } from '@/data/playerState';
import { ESPECIES } from '@/data/creatures';
import { DATOS_ENTRENADORES } from '@/data/trainers';
import type { DatosEntrenador } from '@/data/trainers';
import { verificarEncuentro, elegirWild } from '@/systems/EncounterSystem';
import { crearRNG } from '@/utils/rng';
import type { RNG } from '@/utils/rng';

const TILE_PASTO_ALTO = 1;
const TILE_ARBOL = 2;
const TILE_AGUA = 3;

// Colores de marcador para cada entrenador
const COLOR_ENTRENADOR = 0x306230;

interface MarcadorEntrenador {
  datos: DatosEntrenador;
  rect: Phaser.GameObjects.Rectangle;
}

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private map!: Phaser.Tilemaps.Tilemap;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private debugText!: Phaser.GameObjects.Text;
  private rng!: RNG;
  private marcadores: MarcadorEntrenador[] = [];

  constructor() {
    super(SCENE_KEYS.Overworld);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETA_HEX.clarisimo);
    this.rng = crearRNG(Math.floor(Math.random() * 0xffffffff));

    // Inicializar equipo del jugador si está vacío (primera partida)
    if (playerState.equipo.length === 0) {
      playerState.equipo.push({ especieId: 'hornero', nivel: 5 });
    }

    this.map = this.make.tilemap({
      data: mapaPampaInicial,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tiles = this.map.addTilesetImage('tileset', 'tileset', TILE_SIZE, TILE_SIZE, 0, 0);
    if (!tiles) throw new Error('No se pudo cargar el tileset');
    const layer = this.map.createLayer(0, tiles, 0, 0);
    if (!layer) throw new Error('No se pudo crear la layer del mapa');
    this.layer = layer;
    this.layer.setCollision([TILE_ARBOL, TILE_AGUA]);

    const startTileX = 5;
    const startTileY = 5;
    this.player = new Player(this, startTileX, startTileY, this.esBloqueado.bind(this));

    this.cameras.main.startFollow(this.player.sprite, true, 1, 1);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.crearMarcadoresEntrenadores();

    this.debugText = this.add
      .text(2, 2, '', {
        fontFamily: FONT,
        fontSize: '6px',
        color: PALETA_HEX.oscurisimo,
        backgroundColor: PALETA_HEX.clarisimo,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.input.keyboard?.on('keydown-B', () => {
      this.scene.start(SCENE_KEYS.Battle, { tipo: 'debug' });
    });

    this.events.on('player-step', (tx: number, ty: number) => {
      this.alPisar(tx, ty);
    });
  }

  update(_time: number, delta: number): void {
    this.player.update(delta);
  }

  // ── Marcadores de entrenadores ──────────────────────────────────────────────

  private crearMarcadoresEntrenadores(): void {
    for (const datos of DATOS_ENTRENADORES) {
      const x = datos.tileX * TILE_SIZE;
      const y = datos.tileY * TILE_SIZE;
      const rect = this.add
        .rectangle(x, y, TILE_SIZE, TILE_SIZE, COLOR_ENTRENADOR)
        .setOrigin(0, 0)
        .setDepth(10);

      // Ocultar si ya fue derrotado
      if (playerState.entrenadoresDerrotados.includes(datos.id)) {
        rect.setVisible(false);
      }

      this.marcadores.push({ datos, rect });
    }
  }

  // ── Lógica de cada paso ─────────────────────────────────────────────────────

  private alPisar(tx: number, ty: number): void {
    // Verificar línea de visión de entrenadores (tiene prioridad sobre encuentros)
    for (const marcador of this.marcadores) {
      if (!marcador.rect.visible) continue;
      if (this.enLineaDeVision(tx, ty, marcador.datos)) {
        this.iniciarBatallaEntrenador(marcador.datos);
        return;
      }
    }

    // Verificar encuentro wild en pasto alto
    const tile = this.layer.getTileAt(tx, ty);
    if (tile && tile.index === TILE_PASTO_ALTO) {
      if (verificarEncuentro(this.rng)) {
        const wild = elegirWild(this.rng);
        // Marcar como visto antes de entrar a la escena
        if (playerState.catalogo[wild.especieId] !== 'capturado') {
          playerState.catalogo[wild.especieId] = 'visto';
        }
        this.scene.start(SCENE_KEYS.Battle, { tipo: 'wild', ...wild });
        return;
      }
      this.debugText.setText(`pasto (${tx},${ty})`);
    } else {
      const nomEspecie = playerState.equipo[0]
        ? ESPECIES[playerState.equipo[0].especieId].nombre
        : 'Hornero';
      this.debugText.setText(`${nomEspecie} — B=debug`);
    }
  }

  private enLineaDeVision(playerTX: number, playerTY: number, datos: DatosEntrenador): boolean {
    const { tileX, tileY, direccion, visionTiles } = datos;
    for (let i = 1; i <= visionTiles; i++) {
      let vx = tileX;
      let vy = tileY;
      if (direccion === 'down')  vy += i;
      if (direccion === 'up')    vy -= i;
      if (direccion === 'right') vx += i;
      if (direccion === 'left')  vx -= i;

      if (vx === playerTX && vy === playerTY) return true;
      // Detener si hay obstáculo en la línea de visión
      if (this.esBloqueado(vx, vy)) break;
    }
    return false;
  }

  private iniciarBatallaEntrenador(datos: DatosEntrenador): void {
    // Ocultar marcador inmediatamente para que no se reactive al volver
    const marcador = this.marcadores.find((m) => m.datos.id === datos.id);
    if (marcador) marcador.rect.setVisible(false);
    playerState.entrenadoresDerrotados.push(datos.id);
    this.scene.start(SCENE_KEYS.Battle, { tipo: 'entrenador', entrenadorId: datos.id });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private esBloqueado(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.map.width || ty >= this.map.height) return true;
    const tile = this.layer.getTileAt(tx, ty);
    if (!tile) return true;
    return tile.index === TILE_ARBOL || tile.index === TILE_AGUA;
  }
}
