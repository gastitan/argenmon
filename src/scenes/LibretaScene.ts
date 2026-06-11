import Phaser from 'phaser';
import { PALETA_HEX, SCENE_KEYS, FONT } from '@/config';
import { GameState } from '@/state/GameState';
import type { CriaturaGuardada } from '@/state/GameState';
import { ESPECIES } from '@/data/creatures';

type Entrada =
  | { tipo: 'equipo'; idx: number; criatura: CriaturaGuardada }
  | { tipo: 'deposito'; idx: number; criatura: CriaturaGuardada };

const ITEM_Y0 = 34;
const ITEM_STEP = 14;
const DEPOSITO_HEADER_OFFSET = 14;

export class LibretaScene extends Phaser.Scene {
  private gameObjects: Phaser.GameObjects.GameObject[] = [];
  private cursor = 0;
  private mensaje = '';

  private keyUp!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private keyZ!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENE_KEYS.Libreta);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETA_HEX.clarisimo);

    const kb = this.input.keyboard!;
    this.keyUp = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyZ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    this.cursor = 0;
    this.mensaje = '';
    this.renderLista();
  }

  update(): void {
    const entradas = this.getEntradas();
    if (entradas.length === 0) return;

    if (Phaser.Input.Keyboard.JustDown(this.keyUp)) {
      this.cursor = (this.cursor - 1 + entradas.length) % entradas.length;
      this.mensaje = '';
      this.renderLista();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyDown)) {
      this.cursor = (this.cursor + 1) % entradas.length;
      this.mensaje = '';
      this.renderLista();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
      this.intentarMover();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
      this.scene.start(SCENE_KEYS.Overworld);
    }
  }

  private getEntradas(): Entrada[] {
    const { equipo, deposito } = GameState.datos;
    const result: Entrada[] = [];
    equipo.forEach((c, i) => result.push({ tipo: 'equipo', idx: i, criatura: c }));
    deposito.forEach((c, i) => result.push({ tipo: 'deposito', idx: i, criatura: c }));
    return result;
  }

  private intentarMover(): void {
    const entradas = this.getEntradas();
    if (entradas.length === 0) return;
    const entrada = entradas[this.cursor];

    if (entrada.tipo === 'equipo') {
      const ok = GameState.moverDeEquipoADeposito(entrada.criatura.uid);
      if (!ok) {
        this.mensaje = 'No podés dejar\nel equipo vacío.';
      } else {
        const newLen = this.getEntradas().length;
        if (this.cursor >= newLen) this.cursor = newLen - 1;
        this.mensaje = '';
        GameState.guardar();
      }
    } else {
      const ok = GameState.moverDeDepositoAEquipo(entrada.criatura.uid);
      if (!ok) {
        this.mensaje = 'El equipo está\nlleno (máx 3).';
      } else {
        const newLen = this.getEntradas().length;
        if (this.cursor >= newLen) this.cursor = newLen - 1;
        this.mensaje = '';
        GameState.guardar();
      }
    }
    this.renderLista();
  }

  private renderLista(): void {
    this.gameObjects.forEach((o) => o.destroy());
    this.gameObjects = [];

    const { equipo, deposito } = GameState.datos;

    const title = this.add.text(160, 6, 'LIBRETA DE CAMPO', {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    }).setOrigin(0.5, 0);
    this.gameObjects.push(title);

    const sep1 = this.add.rectangle(0, 18, 320, 1, 0x0f380f).setOrigin(0, 0);
    this.gameObjects.push(sep1);

    const eqHeader = this.add.text(8, 22, `EQUIPO (${equipo.length}/3)`, {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    });
    this.gameObjects.push(eqHeader);

    let y = ITEM_Y0;

    equipo.forEach((c, i) => {
      const especie = ESPECIES[c.especieId];
      const isSelected = this.cursor === i;
      const prefix = isSelected ? '>' : ' ';
      const hpColor = c.hpActual <= 0 ? PALETA_HEX.oscuro : PALETA_HEX.oscurisimo;
      const label = `${prefix} ${especie.nombre} Lv${c.nivel}`;
      const hpStr = `${c.hpActual}/${c.hpMaxCacheado}`;

      const nameTxt = this.add.text(8, y, label, {
        fontFamily: FONT, fontSize: '8px', color: isSelected ? PALETA_HEX.oscurisimo : PALETA_HEX.oscuro,
      });
      const hpTxt = this.add.text(220, y, hpStr, {
        fontFamily: FONT, fontSize: '8px', color: hpColor,
      });
      this.gameObjects.push(nameTxt, hpTxt);
      y += ITEM_STEP;
    });

    const depY = y + DEPOSITO_HEADER_OFFSET;
    const sep2 = this.add.rectangle(0, depY - 8, 320, 1, 0x306230).setOrigin(0, 0);
    this.gameObjects.push(sep2);

    const depHeader = this.add.text(8, depY - 4, `DEPÓSITO (${deposito.length})`, {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscurisimo,
    });
    this.gameObjects.push(depHeader);

    let dy = depY + 12;

    if (deposito.length === 0) {
      const emptyTxt = this.add.text(16, dy, '(vacío)', {
        fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscuro,
      });
      this.gameObjects.push(emptyTxt);
    } else {
      deposito.forEach((c, i) => {
        const especie = ESPECIES[c.especieId];
        const entradaIdx = equipo.length + i;
        const isSelected = this.cursor === entradaIdx;
        const prefix = isSelected ? '>' : ' ';
        const hpColor = c.hpActual <= 0 ? PALETA_HEX.oscuro : PALETA_HEX.oscurisimo;
        const label = `${prefix} ${especie.nombre} Lv${c.nivel}`;
        const hpStr = `${c.hpActual}/${c.hpMaxCacheado}`;

        const nameTxt = this.add.text(8, dy, label, {
          fontFamily: FONT, fontSize: '8px', color: isSelected ? PALETA_HEX.oscurisimo : PALETA_HEX.oscuro,
        });
        const hpTxt = this.add.text(220, dy, hpStr, {
          fontFamily: FONT, fontSize: '8px', color: hpColor,
        });
        this.gameObjects.push(nameTxt, hpTxt);
        dy += ITEM_STEP;
      });
    }

    if (this.mensaje) {
      const msgTxt = this.add.text(8, 200, this.mensaje, {
        fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscuro,
        wordWrap: { width: 300 },
      });
      this.gameObjects.push(msgTxt);
    }

    const footer = this.add.text(160, 228, '[Z] Mover  [X] Cerrar', {
      fontFamily: FONT, fontSize: '8px', color: PALETA_HEX.oscuro,
    }).setOrigin(0.5, 0);
    this.gameObjects.push(footer);
  }
}
