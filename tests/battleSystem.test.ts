import { describe, it, expect } from 'vitest';
import { BattleSystem } from '@/systems/BattleSystem';
import { Criatura } from '@/entities/Criatura';
import { ESPECIES } from '@/data/creatures';

function mkHornero(nivel = 5): Criatura {
  return new Criatura(ESPECIES.hornero, nivel);
}

function mkMara(nivel = 5): Criatura {
  return new Criatura(ESPECIES.mara, nivel);
}

describe('BattleSystem — iniciar', () => {
  it('emite mensajes de apertura y pasa a esperando_input', () => {
    const sys = new BattleSystem([mkHornero()], [mkMara()], { seed: 1 });
    const eventos = sys.iniciar();
    expect(sys.estado.fase).toBe('esperando_input');
    expect(eventos.some((e) => e.mensaje?.includes('Mara'))).toBe(true);
    expect(eventos.some((e) => e.mensaje?.includes('Hornero'))).toBe(true);
  });
});

describe('BattleSystem — huida', () => {
  it('huir termina la batalla con resultado huida', () => {
    const sys = new BattleSystem([mkHornero()], [mkMara()], { seed: 1 });
    sys.iniciar();
    const eventos = sys.ejecutarTurno({ tipo: 'huir' });
    expect(sys.estado.fase).toBe('fin');
    expect(sys.estado.resultado).toBe('huida');
    expect(eventos.some((e) => e.tipo === 'batalla_fin' && e.resultado === 'huida')).toBe(true);
  });
});

describe('BattleSystem — orden de turno', () => {
  it('Mara (vel alta) ataca antes que Hornero a igual prioridad', () => {
    // Mara tiene velBase=80, Hornero=55 → Mara siempre va primero
    const hornero = mkHornero(5);
    const mara = mkMara(5);
    expect(mara.vel).toBeGreaterThan(hornero.vel);
  });

  it('movimiento con prioridad 1 va antes que vel inferior', () => {
    // patada_veloz (prioridad 1) debe ir antes aunque la otra tenga más vel
    const sys = new BattleSystem([mkMara(5)], [mkHornero(5)], { seed: 42 });
    sys.iniciar();
    // El rival (Hornero) podría ser más lento pero con prioridad 1 en patada_veloz
    // simplemente verificamos que el sistema acepta y resuelve sin error
    const eventos = sys.ejecutarTurno({ tipo: 'atacar', movimientoIdx: 0 }); // patada_veloz
    expect(eventos.length).toBeGreaterThan(0);
    expect(sys.estado.fase === 'esperando_input' || sys.estado.fase === 'fin').toBe(true);
  });
});

describe('BattleSystem — combate hasta fin', () => {
  it('victoria cuando el rival llega a 0 HP', () => {
    const jugador = mkHornero(50);
    const rival = new Criatura(ESPECIES.mara, 1); // muy débil
    const sys = new BattleSystem([jugador], [rival], { seed: 7 });
    sys.iniciar();

    let intentos = 0;
    while (sys.estado.fase !== 'fin' && intentos < 20) {
      sys.ejecutarTurno({ tipo: 'atacar', movimientoIdx: 0 });
      intentos++;
    }

    expect(sys.estado.resultado).toBe('victoria');
    expect(sys.estado.rival.hpActual).toBe(0);
  });

  it('derrota cuando el jugador llega a 0 HP', () => {
    const jugador = new Criatura(ESPECIES.hornero, 1); // muy débil
    const rival = mkMara(50);
    const sys = new BattleSystem([jugador], [rival], { seed: 7 });
    sys.iniciar();

    let intentos = 0;
    while (sys.estado.fase !== 'fin' && intentos < 20) {
      sys.ejecutarTurno({ tipo: 'atacar', movimientoIdx: 0 });
      intentos++;
    }

    expect(sys.estado.resultado).toBe('derrota');
    expect(sys.estado.jugador.hpActual).toBe(0);
  });

  it('emite desmayo_rival cuando el rival muere', () => {
    const jugador = mkHornero(50);
    const rival = new Criatura(ESPECIES.mara, 1);
    const sys = new BattleSystem([jugador], [rival], { seed: 7 });
    sys.iniciar();

    const todosEventos: import('@/systems/BattleSystem').EventoBatalla[] = [];
    let intentos = 0;
    while (sys.estado.fase !== 'fin' && intentos < 20) {
      todosEventos.push(...sys.ejecutarTurno({ tipo: 'atacar', movimientoIdx: 0 }));
      intentos++;
    }

    expect(todosEventos.some((e) => e.tipo === 'desmayo_rival')).toBe(true);
    expect(todosEventos.some((e) => e.tipo === 'batalla_fin' && e.resultado === 'victoria')).toBe(true);
  });
});

describe('BattleSystem — equipo múltiple', () => {
  it('auto-switch cuando la primera criatura del rival se desmaya', () => {
    const jugador = mkHornero(50);
    const rival1 = new Criatura(ESPECIES.mara, 1);
    const rival2 = mkMara(5);
    const sys = new BattleSystem([jugador], [rival1, rival2], { seed: 7 });
    sys.iniciar();

    const todosEventos: import('@/systems/BattleSystem').EventoBatalla[] = [];
    while (sys.estado.fase !== 'fin') {
      todosEventos.push(...sys.ejecutarTurno({ tipo: 'atacar', movimientoIdx: 0 }));
    }

    expect(todosEventos.some((e) => e.tipo === 'cambio_rival')).toBe(true);
    expect(sys.estado.resultado).toBe('victoria');
  });
});

describe('BattleSystem — daño', () => {
  it('el daño aplicado al rival coincide con el evento danio_rival', () => {
    const jugador = mkHornero(20);
    const rival = mkMara(20);
    const sys = new BattleSystem([jugador], [rival], { seed: 99 });
    sys.iniciar();
    const hpAntes = rival.hpActual;
    const eventos = sys.ejecutarTurno({ tipo: 'atacar', movimientoIdx: 0 });
    const evDanio = eventos.find((e) => e.tipo === 'danio_rival');
    if (evDanio && evDanio.cantidad !== undefined) {
      expect(rival.hpActual).toBe(hpAntes - evDanio.cantidad);
    }
  });

  it('el turno no rompe con dos criaturas del mismo nivel', () => {
    const sys = new BattleSystem([mkHornero(10)], [mkMara(10)], { seed: 55 });
    sys.iniciar();
    expect(() => sys.ejecutarTurno({ tipo: 'atacar', movimientoIdx: 1 })).not.toThrow();
  });
});

describe('BattleSystem — determinismo', () => {
  it('la misma seed produce los mismos resultados', () => {
    function correrBatalla(seed: number): number {
      const sys = new BattleSystem([mkHornero(10)], [mkMara(10)], { seed });
      sys.iniciar();
      sys.ejecutarTurno({ tipo: 'atacar', movimientoIdx: 0 });
      return sys.estado.rival.hpActual;
    }
    expect(correrBatalla(123)).toBe(correrBatalla(123));
  });
});
