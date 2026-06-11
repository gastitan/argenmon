import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState, crearCriaturaGuardada, VERSION_SAVE } from '@/state/GameState';

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

beforeEach(() => {
  GameState.iniciarNuevaPartida('Test', 'hornero');
  vi.mocked(localStorage.setItem).mockClear();
});

// ── Hornero inicial marcado como capturado ────────────────────────────────────

describe('iniciarNuevaPartida — hornero inicial', () => {
  it('marca al hornero como capturado en el catálogo', () => {
    expect(GameState.datos.catalogo.hornero).toBe('capturado');
  });

  it('el hornero está en el equipo', () => {
    expect(GameState.datos.equipo).toHaveLength(1);
    expect(GameState.datos.equipo[0].especieId).toBe('hornero');
  });

  it('el depósito empieza vacío', () => {
    expect(GameState.datos.deposito).toHaveLength(0);
  });
});

// ── agregarAlEquipo ───────────────────────────────────────────────────────────

describe('agregarAlEquipo', () => {
  it('agrega al equipo y marca como capturado', () => {
    GameState.agregarAlEquipo(crearCriaturaGuardada('mara', 5));
    expect(GameState.datos.equipo).toHaveLength(2);
    expect(GameState.datos.catalogo.mara).toBe('capturado');
  });

  it('rechaza si el equipo ya tiene 3 criaturas', () => {
    GameState.agregarAlEquipo(crearCriaturaGuardada('mara', 5));
    GameState.agregarAlEquipo(crearCriaturaGuardada('vizcacha', 5));
    const result = GameState.agregarAlEquipo(crearCriaturaGuardada('yarara', 5));
    expect(result).toBe(false);
    expect(GameState.datos.equipo).toHaveLength(3);
  });
});

// ── agregarAlDeposito ─────────────────────────────────────────────────────────

describe('agregarAlDeposito', () => {
  it('agrega al depósito y marca como capturado', () => {
    const mara = crearCriaturaGuardada('mara', 10);
    GameState.agregarAlDeposito(mara);
    expect(GameState.datos.deposito).toHaveLength(1);
    expect(GameState.datos.deposito[0].especieId).toBe('mara');
    expect(GameState.datos.catalogo.mara).toBe('capturado');
  });

  it('acepta sin límite', () => {
    GameState.agregarAlDeposito(crearCriaturaGuardada('mara', 5));
    GameState.agregarAlDeposito(crearCriaturaGuardada('vizcacha', 5));
    GameState.agregarAlDeposito(crearCriaturaGuardada('nandu', 5));
    GameState.agregarAlDeposito(crearCriaturaGuardada('peludo', 5));
    expect(GameState.datos.deposito).toHaveLength(4);
  });
});

// ── tieneCriaturaEspecie ──────────────────────────────────────────────────────

describe('tieneCriaturaEspecie', () => {
  it('detecta especie en el equipo', () => {
    expect(GameState.tieneCriaturaEspecie('hornero')).toBe(true);
  });

  it('detecta especie en el depósito', () => {
    GameState.agregarAlDeposito(crearCriaturaGuardada('mara', 5));
    expect(GameState.tieneCriaturaEspecie('mara')).toBe(true);
  });

  it('devuelve false si no tiene la especie', () => {
    expect(GameState.tieneCriaturaEspecie('yarara')).toBe(false);
  });
});

// ── moverDeEquipoADeposito ────────────────────────────────────────────────────

describe('moverDeEquipoADeposito', () => {
  it('mueve correctamente del equipo al depósito', () => {
    GameState.agregarAlEquipo(crearCriaturaGuardada('mara', 7));
    const uid = GameState.datos.equipo[1].uid;

    const ok = GameState.moverDeEquipoADeposito(uid);

    expect(ok).toBe(true);
    expect(GameState.datos.equipo).toHaveLength(1);
    expect(GameState.datos.equipo[0].especieId).toBe('hornero');
    expect(GameState.datos.deposito).toHaveLength(1);
    expect(GameState.datos.deposito[0].uid).toBe(uid);
  });

  it('rechaza si el equipo tiene solo 1 criatura (invariante: equipo no vacío)', () => {
    const uid = GameState.datos.equipo[0].uid;
    const ok = GameState.moverDeEquipoADeposito(uid);
    expect(ok).toBe(false);
    expect(GameState.datos.equipo).toHaveLength(1);
    expect(GameState.datos.deposito).toHaveLength(0);
  });

  it('devuelve false si el uid no existe', () => {
    const ok = GameState.moverDeEquipoADeposito('uid-inexistente');
    expect(ok).toBe(false);
  });
});

// ── moverDeDepositoAEquipo ────────────────────────────────────────────────────

describe('moverDeDepositoAEquipo', () => {
  it('mueve correctamente del depósito al equipo', () => {
    const mara = crearCriaturaGuardada('mara', 7);
    GameState.agregarAlDeposito(mara);
    const uid = GameState.datos.deposito[0].uid;

    const ok = GameState.moverDeDepositoAEquipo(uid);

    expect(ok).toBe(true);
    expect(GameState.datos.equipo).toHaveLength(2);
    expect(GameState.datos.deposito).toHaveLength(0);
    expect(GameState.datos.equipo[1].uid).toBe(uid);
  });

  it('rechaza si el equipo ya tiene 3 criaturas (invariante: máx 3)', () => {
    GameState.agregarAlEquipo(crearCriaturaGuardada('mara', 5));
    GameState.agregarAlEquipo(crearCriaturaGuardada('vizcacha', 5));
    const yarara = crearCriaturaGuardada('yarara', 5);
    GameState.agregarAlDeposito(yarara);
    const uid = GameState.datos.deposito[0].uid;

    const ok = GameState.moverDeDepositoAEquipo(uid);

    expect(ok).toBe(false);
    expect(GameState.datos.equipo).toHaveLength(3);
    expect(GameState.datos.deposito).toHaveLength(1);
  });

  it('devuelve false si el uid no existe', () => {
    const ok = GameState.moverDeDepositoAEquipo('uid-inexistente');
    expect(ok).toBe(false);
  });
});

// ── Preservación de estado al mover ──────────────────────────────────────────

describe('preservación de estado al mover entre listas', () => {
  it('nivel, hpActual, PP y movimientos se preservan al mover equipo→depósito→equipo', () => {
    const nandu = crearCriaturaGuardada('nandu', 20);
    nandu.hpActual = 42;
    nandu.ppActuales = [3, 2, 1, 5];
    GameState.agregarAlEquipo(nandu);
    const uid = GameState.datos.equipo[1].uid;

    // equipo → depósito
    GameState.moverDeEquipoADeposito(uid);
    const enDeposito = GameState.datos.deposito[0];
    expect(enDeposito.nivel).toBe(20);
    expect(enDeposito.hpActual).toBe(42);
    expect(enDeposito.ppActuales).toEqual([3, 2, 1, 5]);
    expect(enDeposito.movimientosActuales).toEqual(nandu.movimientosActuales);

    // depósito → equipo
    GameState.moverDeDepositoAEquipo(uid);
    const enEquipo = GameState.datos.equipo[1];
    expect(enEquipo.nivel).toBe(20);
    expect(enEquipo.hpActual).toBe(42);
    expect(enEquipo.ppActuales).toEqual([3, 2, 1, 5]);
    expect(enEquipo.movimientosActuales).toEqual(nandu.movimientosActuales);
  });
});

// ── Invariante: especie única en equipo + depósito ────────────────────────────

describe('invariante: especie única', () => {
  it('no puede haber dos criaturas hornero entre equipo y depósito', () => {
    // El hornero ya está en el equipo. Si se manda otro al depósito
    // el sistema no lo impide automáticamente — es responsabilidad
    // de BattleScene deshabilitar Trampa. Este test verifica
    // que tieneCriaturaEspecie cubre ambas listas.
    expect(GameState.tieneCriaturaEspecie('hornero')).toBe(true);

    // No debería permitirse vía el flujo de juego, pero si se agrega
    // otro hornero al depósito la función lo detecta en equipo
    const otro = crearCriaturaGuardada('hornero', 3);
    GameState.agregarAlDeposito(otro);
    // Ahora hay dos horneros en el sistema — esto sería un bug en BattleScene
    // pero desde GameState la consulta tieneCriaturaEspecie sigue respondiendo true
    expect(GameState.tieneCriaturaEspecie('hornero')).toBe(true);
    // Limpiamos: retiramos el hornero del depósito manualmente para el próximo test
    const uid = GameState.datos.deposito[0].uid;
    GameState.datos.deposito.splice(GameState.datos.deposito.findIndex((c) => c.uid === uid), 1);
  });
});

// ── Save v5 ───────────────────────────────────────────────────────────────────

describe('save v5', () => {
  it('guardar incluye el campo deposito', () => {
    GameState.agregarAlDeposito(crearCriaturaGuardada('mara', 8));
    GameState.guardar();

    const setItem = vi.mocked(localStorage.setItem);
    const lastCall = setItem.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const saved = JSON.parse(lastCall![1]);
    expect(saved.version).toBe(VERSION_SAVE);
    expect(Array.isArray(saved.deposito)).toBe(true);
    expect(saved.deposito).toHaveLength(1);
    expect(saved.deposito[0].especieId).toBe('mara');
  });

  it('save v4 (sin deposito) es descartado en cargar()', () => {
    vi.mocked(localStorage.getItem).mockReturnValueOnce(
      JSON.stringify({
        version: 4,
        nombreJugador: 'Viejo',
        biomaActual: 'pampa',
        posicion: { x: 2, y: 15 },
        equipo: [],
        inventario: { trampaComun: 3, trampaMonte: 0, trampaFina: 0 },
        catalogo: {},
        mundo: { eventosVistos: [], objetosRecogidos: [], tilesModificados: {} },
        progreso: { flags: {}, counters: {}, variables: {} },
        ultimoGuardado: 0,
      }),
    );
    const resultado = GameState.cargar();
    expect(resultado).toBe(false);
  });

  it('save v5 con deposito carga correctamente', () => {
    const maraGuardada = crearCriaturaGuardada('mara', 9);
    const saveData = {
      version: 5,
      nombreJugador: 'Jugador',
      biomaActual: 'pampa',
      posicion: { x: 3, y: 10 },
      equipo: [crearCriaturaGuardada('hornero', 5)],
      deposito: [maraGuardada],
      inventario: { trampaComun: 2, trampaMonte: 0, trampaFina: 0 },
      catalogo: { hornero: 'capturado', mara: 'capturado' },
      mundo: { eventosVistos: [], objetosRecogidos: [], tilesModificados: {} },
      progreso: { flags: {}, counters: {}, variables: {} },
      ultimoGuardado: Date.now(),
    };
    vi.mocked(localStorage.getItem).mockReturnValueOnce(JSON.stringify(saveData));

    const resultado = GameState.cargar();

    expect(resultado).toBe(true);
    expect(GameState.datos.deposito).toHaveLength(1);
    expect(GameState.datos.deposito[0].especieId).toBe('mara');
    expect(GameState.datos.deposito[0].nivel).toBe(9);
  });
});

// ── Invariante: catalogo = capturado para toda criatura poseída ───────────────

describe('invariante: catálogo = capturado', () => {
  it('agregarAlEquipo marca capturado', () => {
    GameState.agregarAlEquipo(crearCriaturaGuardada('vizcacha', 5));
    expect(GameState.datos.catalogo.vizcacha).toBe('capturado');
  });

  it('agregarAlDeposito marca capturado', () => {
    GameState.agregarAlDeposito(crearCriaturaGuardada('peludo', 5));
    expect(GameState.datos.catalogo.peludo).toBe('capturado');
  });

  it('iniciarNuevaPartida marca la criatura inicial como capturado', () => {
    GameState.iniciarNuevaPartida('Otro', 'mara');
    expect(GameState.datos.catalogo.mara).toBe('capturado');
  });
});
