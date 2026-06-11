import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockHaySave, mockIniciarNuevaPartida, mockGuardar, mockCargar, mockBorrarSave } =
  vi.hoisted(() => ({
    mockHaySave: vi.fn<[], boolean>(),
    mockIniciarNuevaPartida: vi.fn<[string, string], void>(),
    mockGuardar: vi.fn<[], void>(),
    mockCargar: vi.fn<[], boolean>(),
    mockBorrarSave: vi.fn<[], void>(),
  }));

vi.mock('@/state/GameState', () => ({
  GameState: {
    haySave: mockHaySave,
    iniciarNuevaPartida: mockIniciarNuevaPartida,
    guardar: mockGuardar,
    cargar: mockCargar,
    borrarSave: mockBorrarSave,
  },
}));

import { MenuController } from '@/scenes/MenuController';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Sin save ──────────────────────────────────────────────────────────────────

describe('MenuController — sin save', () => {
  beforeEach(() => {
    mockHaySave.mockReturnValue(false);
  });

  it('haySave es false', () => {
    const ctrl = new MenuController();
    expect(ctrl.haySave).toBe(false);
  });

  it('Continuar está deshabilitada', () => {
    const ctrl = new MenuController();
    expect(ctrl.continuarHabilitada).toBe(false);
  });

  it('selección inicial apunta a "Nueva partida" (índice 1)', () => {
    const ctrl = new MenuController();
    expect(ctrl.seleccionInicial).toBe(1);
  });

  it('confirmarNueva va directo sin pedir confirmación', () => {
    const ctrl = new MenuController();
    const resultado = ctrl.confirmarNueva();
    expect(resultado).toBe('directo');
    expect(ctrl.estadoActual).toBe('main');
  });

  it('confirmarNueva llama iniciarNuevaPartida con los args correctos', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    expect(mockIniciarNuevaPartida).toHaveBeenCalledOnce();
    expect(mockIniciarNuevaPartida).toHaveBeenCalledWith('Jugador', 'hornero');
  });

  it('confirmarNueva guarda atómicamente (sin borrarSave previo)', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    expect(mockGuardar).toHaveBeenCalledOnce();
    expect(mockBorrarSave).not.toHaveBeenCalled();
  });
});

// ── Con save ──────────────────────────────────────────────────────────────────

describe('MenuController — con save', () => {
  beforeEach(() => {
    mockHaySave.mockReturnValue(true);
  });

  it('haySave es true', () => {
    const ctrl = new MenuController();
    expect(ctrl.haySave).toBe(true);
  });

  it('Continuar está habilitada', () => {
    const ctrl = new MenuController();
    expect(ctrl.continuarHabilitada).toBe(true);
  });

  it('selección inicial apunta a "Continuar" (índice 0)', () => {
    const ctrl = new MenuController();
    expect(ctrl.seleccionInicial).toBe(0);
  });

  it('confirmarContinuar carga el save y retorna true', () => {
    const ctrl = new MenuController();
    const ok = ctrl.confirmarContinuar();
    expect(ok).toBe(true);
    expect(mockCargar).toHaveBeenCalledOnce();
  });

  it('confirmarContinuar no inicia partida nueva ni borra save', () => {
    const ctrl = new MenuController();
    ctrl.confirmarContinuar();
    expect(mockIniciarNuevaPartida).not.toHaveBeenCalled();
    expect(mockBorrarSave).not.toHaveBeenCalled();
  });

  it('confirmarNueva pide confirmación y no modifica nada aún', () => {
    const ctrl = new MenuController();
    const resultado = ctrl.confirmarNueva();
    expect(resultado).toBe('confirmar');
    expect(ctrl.estadoActual).toBe('confirmar1');
    expect(mockIniciarNuevaPartida).not.toHaveBeenCalled();
    expect(mockBorrarSave).not.toHaveBeenCalled();
    expect(mockGuardar).not.toHaveBeenCalled();
  });
});

// ── Flujo de cancelación no modifica el save ──────────────────────────────────

describe('MenuController — cancelación no modifica el save', () => {
  beforeEach(() => {
    mockHaySave.mockReturnValue(true);
  });

  it('NO en confirmar1 vuelve a main sin modificar nada', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    ctrl.responderConfirmar1(false);
    expect(ctrl.estadoActual).toBe('main');
    expect(mockIniciarNuevaPartida).not.toHaveBeenCalled();
    expect(mockBorrarSave).not.toHaveBeenCalled();
    expect(mockGuardar).not.toHaveBeenCalled();
  });

  it('NO en confirmar2 vuelve a main sin modificar nada', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    ctrl.responderConfirmar1(true);
    ctrl.responderConfirmar2(false);
    expect(ctrl.estadoActual).toBe('main');
    expect(mockIniciarNuevaPartida).not.toHaveBeenCalled();
    expect(mockBorrarSave).not.toHaveBeenCalled();
    expect(mockGuardar).not.toHaveBeenCalled();
  });

  it('cancelar() en confirmar1 vuelve a main sin modificar nada', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    ctrl.cancelar();
    expect(ctrl.estadoActual).toBe('main');
    expect(mockIniciarNuevaPartida).not.toHaveBeenCalled();
    expect(mockBorrarSave).not.toHaveBeenCalled();
  });

  it('cancelar() en confirmar2 vuelve a main sin modificar nada', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    ctrl.responderConfirmar1(true);
    ctrl.cancelar();
    expect(ctrl.estadoActual).toBe('main');
    expect(mockIniciarNuevaPartida).not.toHaveBeenCalled();
    expect(mockBorrarSave).not.toHaveBeenCalled();
  });

  it('SÍ en ambas confirmaciones llama iniciarNuevaPartida y guarda, sin borrarSave', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    ctrl.responderConfirmar1(true);
    const realizado = ctrl.responderConfirmar2(true);
    expect(realizado).toBe(true);
    expect(ctrl.estadoActual).toBe('mensaje');
    expect(mockIniciarNuevaPartida).toHaveBeenCalledOnce();
    expect(mockIniciarNuevaPartida).toHaveBeenCalledWith('Jugador', 'hornero');
    expect(mockGuardar).toHaveBeenCalledOnce();
    expect(mockBorrarSave).not.toHaveBeenCalled();
  });

  it('confirmarContinuar sin save retorna false sin llamar cargar', () => {
    mockHaySave.mockReturnValue(false);
    const ctrl = new MenuController();
    const ok = ctrl.confirmarContinuar();
    expect(ok).toBe(false);
    expect(mockCargar).not.toHaveBeenCalled();
  });
});

// ── Transiciones de estado ────────────────────────────────────────────────────

describe('MenuController — transiciones de estado', () => {
  beforeEach(() => {
    mockHaySave.mockReturnValue(true);
  });

  it('estado inicial es main', () => {
    const ctrl = new MenuController();
    expect(ctrl.estadoActual).toBe('main');
  });

  it('confirmarNueva → confirmar1', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    expect(ctrl.estadoActual).toBe('confirmar1');
  });

  it('confirmar1 SÍ → confirmar2', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    ctrl.responderConfirmar1(true);
    expect(ctrl.estadoActual).toBe('confirmar2');
  });

  it('confirmar2 SÍ → mensaje', () => {
    const ctrl = new MenuController();
    ctrl.confirmarNueva();
    ctrl.responderConfirmar1(true);
    ctrl.responderConfirmar2(true);
    expect(ctrl.estadoActual).toBe('mensaje');
  });
});
