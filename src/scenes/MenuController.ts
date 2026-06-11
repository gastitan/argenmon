import { GameState } from '@/state/GameState';

export type EstadoMenu = 'main' | 'confirmar1' | 'confirmar2' | 'mensaje';

export class MenuController {
  private _estado: EstadoMenu = 'main';
  readonly haySave: boolean;

  constructor() {
    this.haySave = GameState.haySave();
  }

  get estadoActual(): EstadoMenu {
    return this._estado;
  }

  get continuarHabilitada(): boolean {
    return this.haySave;
  }

  // Índice de la opción seleccionada por defecto en el menú principal.
  // 0 = Continuar, 1 = Nueva partida.
  get seleccionInicial(): number {
    return this.haySave ? 0 : 1;
  }

  // Carga el save existente. Retorna false si no hay save (no debería llamarse).
  confirmarContinuar(): boolean {
    if (!this.haySave) return false;
    GameState.cargar();
    return true;
  }

  // Inicia flujo de nueva partida.
  // - Sin save: inicializa y guarda atómicamente, retorna 'directo'.
  // - Con save: pide confirmación, retorna 'confirmar'.
  confirmarNueva(): 'directo' | 'confirmar' {
    if (!this.haySave) {
      GameState.iniciarNuevaPartida('Jugador', 'hornero');
      GameState.guardar();
      return 'directo';
    }
    this._estado = 'confirmar1';
    return 'confirmar';
  }

  // Respuesta a la primera pantalla de confirmación (¿Borrar tu partida?).
  responderConfirmar1(si: boolean): void {
    this._estado = si ? 'confirmar2' : 'main';
  }

  // Respuesta a la segunda pantalla de confirmación (¿Seguro?).
  // Retorna true si se inició partida nueva, false si se canceló.
  responderConfirmar2(si: boolean): boolean {
    if (si) {
      GameState.iniciarNuevaPartida('Jugador', 'hornero');
      GameState.guardar();
      this._estado = 'mensaje';
      return true;
    }
    this._estado = 'main';
    return false;
  }

  // Cancela cualquier confirmación y vuelve al menú principal.
  cancelar(): void {
    this._estado = 'main';
  }
}
