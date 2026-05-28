import Phaser from 'phaser';
import { PALETA_HEX, SCENE_KEYS, TILE_SIZE, FONT } from '@/config';
import { OVERWORLD_LAYOUT } from '@/config/layout';
import { Player } from '@/entities/Player';
import { ARBOLES, mapaPampaNumeros, getTileData } from '@/data/maps';
import { GameState } from '@/state/GameState';
import { ESPECIES } from '@/data/creatures';
import { DATOS_ENTRENADORES } from '@/data/trainers';
import type { DatosEntrenador } from '@/data/trainers';
import { DATOS_CIVILES } from '@/data/loaders/loadCivilians';
import type { DatosCivil } from '@/data/loaders/loadCivilians';
import { OBJETOS_MUNDO } from '@/data/loaders/loadWorldObjects';
import { resolverFootprint } from '@/utils/worldObjectFootprint';
import { intentarEncuentro } from '@/systems/EncounterSystem';
import { crearRNG } from '@/utils/rng';
import type { RNG } from '@/utils/rng';

const TILE_AGUA = 3;

const COLOR_ENTRENADOR = 0x306230;

interface MarcadorEntrenador {
  datos: DatosEntrenador;
  visual: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
}

interface MarcadorCivil {
  datos: DatosCivil;
  image: Phaser.GameObjects.Image;
}

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private map!: Phaser.Tilemaps.Tilemap;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private debugText!: Phaser.GameObjects.Text;
  private rng!: RNG;
  private marcadores: MarcadorEntrenador[] = [];
  private marcadoresCiviles: MarcadorCivil[] = [];
  private tilesObjetosMundo = new Set<string>();
  private pasosSinGuardar = 0;
  private dialogoActivo = false;

  constructor() {
    super(SCENE_KEYS.Overworld);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETA_HEX.clarisimo);
    this.rng = crearRNG(Math.floor(Math.random() * 0xffffffff));

    if (GameState.haySave()) {
      GameState.cargar();
    } else {
      GameState.iniciarNuevaPartida('Jugador', 'hornero');
    }

    this.map = this.make.tilemap({
      data: mapaPampaNumeros,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tiles = this.map.addTilesetImage('tileset', 'tileset', TILE_SIZE, TILE_SIZE, 0, 0);
    if (!tiles) throw new Error('No se pudo cargar el tileset');
    const layer = this.map.createLayer(0, tiles, 0, 0);
    if (!layer) throw new Error('No se pudo crear la layer del mapa');
    this.layer = layer;
    this.layer.setCollision([TILE_AGUA]);
    this.layer.setDepth(0);

    this.crearArboles();
    this.crearObjetosMundo();

    const { x: startTileX, y: startTileY } = GameState.datos.posicion;
    this.player = new Player(this, startTileX, startTileY, this.esBloqueado.bind(this));
    this.player.sprite.setDepth(this.player.sprite.y);

    this.cameras.main.startFollow(this.player.sprite, true, 1, 1);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.crearMarcadoresEntrenadores();
    this.crearMarcadoresCiviles();

    this.debugText = this.add
      .text(OVERWORLD_LAYOUT.DEBUG_TEXT_POS.x, OVERWORLD_LAYOUT.DEBUG_TEXT_POS.y, '', {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscurisimo,
        backgroundColor: PALETA_HEX.clarisimo,
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.input.keyboard?.on('keydown-B', () => {
      this.scene.start(SCENE_KEYS.Battle, { tipo: 'debug' });
    });

    this.input.keyboard?.on('keydown-C', () => {
      if (!this.dialogoActivo) this.scene.start(SCENE_KEYS.Catalog);
    });

    this.input.keyboard?.on('keydown-Z', () => {
      if (!this.dialogoActivo) this.intentarHablarConCivil();
    });

    this.events.on('player-step', (tx: number, ty: number) => {
      this.alPisar(tx, ty);
    });
  }

  update(_time: number, delta: number): void {
    if (!this.dialogoActivo) this.player.update(delta);
    this.player.sprite.setDepth(this.player.sprite.y);
  }

  // ── Árboles (pasada de objetos) ─────────────────────────────────────────────

  private crearArboles(): void {
    const ARBOL_BASELINE_OFFSET = 6;
    const variantes = ['arbol_ombu', 'arbol_ceibo', 'arbol_algarrobo'] as const;
    for (const key of ARBOLES) {
      const [x, y] = key.split(',').map(Number);
      this.tilesObjetosMundo.add(key);
      const idx = (x * 7 + y * 13) % 3;
      const img = this.add
        .image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE, variantes[idx])
        .setOrigin(0.5, 1);
      img.setDepth(img.y - ARBOL_BASELINE_OFFSET);
    }
  }

  // ── Objetos del mundo (ranchos, etc.) ──────────────────────────────────────

  private crearObjetosMundo(): void {
    for (const obj of OBJETOS_MUNDO) {
      const px = obj.posicion.x * TILE_SIZE + TILE_SIZE / 2;
      const py = obj.posicion.y * TILE_SIZE + TILE_SIZE;
      const img = this.add.image(px, py, obj.spriteId).setOrigin(0.5, 1);
      img.setDepth(img.y);
      for (const tile of resolverFootprint(obj)) {
        this.tilesObjetosMundo.add(`${tile.x},${tile.y}`);
      }
    }
  }

  // ── Marcadores de entrenadores ──────────────────────────────────────────────

  private crearMarcadoresEntrenadores(): void {
    for (const datos of DATOS_ENTRENADORES) {
      const x = datos.tileX * TILE_SIZE;
      const y = datos.tileY * TILE_SIZE;
      const visual = datos.spriteKey
        ? this.add.image(x, y, datos.spriteKey).setOrigin(0, 0).setDepth(y + TILE_SIZE)
        : this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, COLOR_ENTRENADOR).setOrigin(0, 0).setDepth(y + TILE_SIZE);

      if (datos.flagDerrota && GameState.obtenerFlag(datos.flagDerrota)) {
        visual.setVisible(false);
      }

      this.marcadores.push({ datos, visual });
    }
  }

  // ── Marcadores de civiles ───────────────────────────────────────────────────

  private crearMarcadoresCiviles(): void {
    for (const datos of DATOS_CIVILES) {
      const x = datos.tileX * TILE_SIZE;
      const y = datos.tileY * TILE_SIZE;
      const image = this.add
        .image(x, y, datos.spriteKey)
        .setOrigin(0, 0)
        .setDepth(y + TILE_SIZE);
      this.marcadoresCiviles.push({ datos, image });
    }
  }

  // ── Interacción con civiles ─────────────────────────────────────────────────

  private intentarHablarConCivil(): void {
    const { x: px, y: py } = this.player.posicionTile;
    const adyacentes = [
      { x: px, y: py - 1 },
      { x: px, y: py + 1 },
      { x: px - 1, y: py },
      { x: px + 1, y: py },
    ];
    for (const marcador of this.marcadoresCiviles) {
      const { tileX, tileY } = marcador.datos;
      if (adyacentes.some((a) => a.x === tileX && a.y === tileY)) {
        this.mostrarDialogoCivil(marcador.datos);
        return;
      }
    }
  }

  private mostrarDialogoCivil(datos: DatosCivil): void {
    this.dialogoActivo = true;
    const { DIALOG_BOX, DIALOG_TEXT_POS } = OVERWORLD_LAYOUT;

    const fondo = this.add
      .rectangle(DIALOG_BOX.x, DIALOG_BOX.y, DIALOG_BOX.w, DIALOG_BOX.h, 0x9bbc0f)
      .setOrigin(0).setScrollFactor(0).setDepth(1000);

    const texto = this.add.text(
      DIALOG_TEXT_POS.x,
      DIALOG_TEXT_POS.y,
      `${datos.nombre}: ${datos.dialogos[0]}`,
      {
        fontFamily: FONT,
        fontSize: '8px',
        color: PALETA_HEX.oscurisimo,
        wordWrap: { width: DIALOG_BOX.w - 16 },
      },
    ).setScrollFactor(0).setDepth(1001);

    const cerrar = () => {
      fondo.destroy();
      texto.destroy();
      this.dialogoActivo = false;
      this.input.keyboard?.off('keydown-Z', cerrar);
      this.input.keyboard?.off('keydown-X', cerrar);
    };

    this.input.keyboard?.once('keydown-Z', cerrar);
    this.input.keyboard?.once('keydown-X', cerrar);
  }

  // ── Lógica de cada paso ─────────────────────────────────────────────────────

  private alPisar(tx: number, ty: number): void {
    this.pasosSinGuardar++;
    GameState.incrementarContador('stats.steps_walked');
    if (this.pasosSinGuardar >= 10) {
      this.pasosSinGuardar = 0;
      GameState.actualizarPosicion(tx, ty);
      GameState.guardar();
    }

    // Verificar línea de visión de entrenadores (tiene prioridad sobre encuentros)
    for (const marcador of this.marcadores) {
      if (!marcador.visual.visible) continue;
      if (this.enLineaDeVision(tx, ty, marcador.datos)) {
        if (marcador.datos.id === 'almacenero') {
          this.mostrarDialogoAlmacenero();
        } else {
          this.iniciarBatallaEntrenador(marcador.datos);
        }
        return;
      }
    }

    // Verificar encuentro wild según zoneId y tipo de tile
    const tileData = getTileData(tx, ty);
    if (tileData && (tileData.terreno === 'pasto_alto' || tileData.terreno === 'monte')) {
      const resultado = intentarEncuentro(tileData.zoneId, tileData.terreno, this.rng);
      if (resultado) {
        GameState.marcarVisto(resultado.especieId);
        this.scene.start(SCENE_KEYS.Battle, { tipo: 'wild', ...resultado });
        return;
      }
      this.debugText.setText(`${tileData.terreno} (${tx},${ty}) zona:${tileData.zoneId}`);
    } else {
      const nomEspecie = GameState.datos.equipo[0]
        ? ESPECIES[GameState.datos.equipo[0].especieId].nombre
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
      if (this.esBloqueado(vx, vy)) break;
    }
    return false;
  }

  private iniciarBatallaEntrenador(datos: DatosEntrenador): void {
    const marcador = this.marcadores.find((m) => m.datos.id === datos.id);
    if (marcador) marcador.visual.setVisible(false);

    const comenzar = () => {
      this.scene.start(SCENE_KEYS.Battle, { tipo: 'entrenador', entrenadorId: datos.id });
    };

    if (datos.dialogoPreBatalla) {
      this.dialogoActivo = true;
      const { DIALOG_BOX, DIALOG_TEXT_POS } = OVERWORLD_LAYOUT;
      const fondo = this.add
        .rectangle(DIALOG_BOX.x, DIALOG_BOX.y, DIALOG_BOX.w, DIALOG_BOX.h, 0x9bbc0f)
        .setOrigin(0).setScrollFactor(0).setDepth(1000);
      const texto = this.add.text(
        DIALOG_TEXT_POS.x, DIALOG_TEXT_POS.y,
        `${datos.nombre}: ${datos.dialogoPreBatalla}`,
        { fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo, wordWrap: { width: DIALOG_BOX.w - 16 } },
      ).setScrollFactor(0).setDepth(1001);

      const cerrar = () => {
        fondo.destroy();
        texto.destroy();
        this.dialogoActivo = false;
        this.input.keyboard?.off('keydown-Z', cerrar);
        this.input.keyboard?.off('keydown-X', cerrar);
        comenzar();
      };
      this.input.keyboard?.once('keydown-Z', cerrar);
      this.input.keyboard?.once('keydown-X', cerrar);
    } else {
      comenzar();
    }
  }

  // ── Diálogo Almacenero ──────────────────────────────────────────────────────

  private mostrarDialogoAlmacenero(): void {
    this.dialogoActivo = true;
    const { DIALOG_BOX, DIALOG_TEXT_POS, SHOP_OPTION_SI, SHOP_OPTION_NO } = OVERWORLD_LAYOUT;

    const fondo = this.add
      .rectangle(DIALOG_BOX.x, DIALOG_BOX.y, DIALOG_BOX.w, DIALOG_BOX.h, 0x9bbc0f)
      .setOrigin(0).setScrollFactor(0).setDepth(1000);

    const texto = this.add.text(DIALOG_TEXT_POS.x, DIALOG_TEXT_POS.y, '¡Bienvenido!\n¿Querés que cure a tus animales?', {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
      wordWrap: { width: DIALOG_BOX.w - 16 },
    }).setScrollFactor(0).setDepth(1001);

    let seleccion = 0;

    const opSi = this.add.text(SHOP_OPTION_SI.x, SHOP_OPTION_SI.y, '>Sí', {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(1001);

    const opNo = this.add.text(SHOP_OPTION_NO.x, SHOP_OPTION_NO.y, ' No', {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    }).setScrollFactor(0).setDepth(1001);

    const destruir = () => {
      fondo.destroy();
      texto.destroy();
      opSi.destroy();
      opNo.destroy();
      this.dialogoActivo = false;
    };

    const mostrarRespuesta = (msg: string) => {
      opSi.setVisible(false);
      opNo.setVisible(false);
      texto.setText(msg);
      this.input.keyboard?.once('keydown-Z', destruir);
    };

    const limpiarListeners = () => {
      this.input.keyboard?.off('keydown-LEFT', navHandler);
      this.input.keyboard?.off('keydown-RIGHT', navHandler);
      this.input.keyboard?.off('keydown-Z', confirmarHandler);
      this.input.keyboard?.off('keydown-X', cancelarHandler);
    };

    const navHandler = () => {
      seleccion = seleccion === 0 ? 1 : 0;
      opSi.setText(seleccion === 0 ? '>Sí' : ' Sí');
      opNo.setText(seleccion === 1 ? '>No' : ' No');
    };

    const confirmarHandler = () => {
      limpiarListeners();
      if (seleccion === 0) {
        GameState.curarEquipoCompleto();
        GameState.guardar();
        mostrarRespuesta('¡Tus animales están\nlistos para seguir!');
      } else {
        mostrarRespuesta('¡Volvé cuando los necesites!');
      }
    };

    const cancelarHandler = () => {
      limpiarListeners();
      mostrarRespuesta('¡Volvé cuando los necesites!');
    };

    this.input.keyboard?.on('keydown-LEFT', navHandler);
    this.input.keyboard?.on('keydown-RIGHT', navHandler);
    this.input.keyboard?.on('keydown-Z', confirmarHandler);
    this.input.keyboard?.on('keydown-X', cancelarHandler);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private esBloqueado(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.map.width || ty >= this.map.height) return true;
    if (this.marcadoresCiviles.some((m) => m.datos.tileX === tx && m.datos.tileY === ty)) return true;
    if (this.marcadores.some((m) => m.visual.visible && m.datos.tileX === tx && m.datos.tileY === ty)) return true;
    if (this.tilesObjetosMundo.has(`${tx},${ty}`)) return true;
    const tile = this.layer.getTileAt(tx, ty);
    if (!tile) return true;
    return tile.index === TILE_AGUA;
  }
}
