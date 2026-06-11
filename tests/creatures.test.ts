import { describe, it, expect } from 'vitest';
import { ESPECIES } from '@/data/creatures';
import { MOVIMIENTOS } from '@/data/moves';

describe('Criaturas nuevas — Sabueso', () => {
  it('sabueso existe en ESPECIES', () => {
    expect(ESPECIES['sabueso']).toBeDefined();
  });

  it('sabueso pasa validación básica de stats', () => {
    const s = ESPECIES['sabueso'];
    expect(s.hpBase).toBeGreaterThan(0);
    expect(s.atkBase).toBeGreaterThan(0);
    expect(s.tipos).toContain('Normal');
    expect(s.tasaCaptura).toBeGreaterThan(0);
  });

  it('movepool de sabueso referencia solo movimientos existentes', () => {
    for (const entrada of ESPECIES['sabueso'].movepool) {
      expect(MOVIMIENTOS[entrada.movimientoId]).toBeDefined();
    }
  });
});

describe('Criaturas nuevas — Jabalí', () => {
  it('jabali existe en ESPECIES', () => {
    expect(ESPECIES['jabali']).toBeDefined();
  });

  it('jabali pasa validación básica de stats', () => {
    const j = ESPECIES['jabali'];
    expect(j.hpBase).toBeGreaterThan(0);
    expect(j.atkBase).toBeGreaterThan(0);
    expect(j.tipos).toContain('Tierra');
    expect(j.tasaCaptura).toBeGreaterThan(0);
  });

  it('movepool de jabalí referencia solo movimientos existentes', () => {
    for (const entrada of ESPECIES['jabali'].movepool) {
      expect(MOVIMIENTOS[entrada.movimientoId]).toBeDefined();
    }
  });
});

describe('Criaturas nuevas — Coipo', () => {
  it('coipo existe en ESPECIES', () => {
    expect(ESPECIES['coipo']).toBeDefined();
  });

  it('coipo es de tipo Agua con stats de tanque', () => {
    const c = ESPECIES['coipo'];
    expect(c.tipos).toContain('Agua');
    expect(c.hpBase).toBe(75);
    expect(c.defBase).toBe(70);
    expect(c.velBase).toBe(35);
    expect(c.tasaCaptura).toBeGreaterThan(0);
  });

  it('movepool de coipo referencia solo movimientos existentes', () => {
    for (const entrada of ESPECIES['coipo'].movepool) {
      expect(MOVIMIENTOS[entrada.movimientoId]).toBeDefined();
    }
  });

  it('coipo aprende chapoteo desde nivel 1 y coletazo a nivel 14', () => {
    const mp = ESPECIES['coipo'].movepool;
    const chapoteo = mp.find((e) => e.movimientoId === 'chapoteo');
    const coletazo = mp.find((e) => e.movimientoId === 'coletazo');
    expect(chapoteo?.nivel).toBe(1);
    expect(coletazo?.nivel).toBe(14);
  });
});

describe('Criaturas nuevas — Zorro', () => {
  it('zorro existe en ESPECIES', () => {
    expect(ESPECIES['zorro']).toBeDefined();
  });

  it('zorro es Normal con stats de atacante ágil', () => {
    const z = ESPECIES['zorro'];
    expect(z.tipos).toContain('Normal');
    expect(z.velBase).toBe(75);
    expect(z.tasaCaptura).toBeGreaterThan(0);
  });

  it('movepool de zorro referencia solo movimientos existentes', () => {
    for (const entrada of ESPECIES['zorro'].movepool) {
      expect(MOVIMIENTOS[entrada.movimientoId]).toBeDefined();
    }
  });

  it('zorro trae aranazo y golpe_rapido desde nivel 1 (no cojo al capturar)', () => {
    const mp = ESPECIES['zorro'].movepool;
    const aranazo = mp.find((e) => e.movimientoId === 'aranazo');
    const golpeRapido = mp.find((e) => e.movimientoId === 'golpe_rapido');
    expect(aranazo?.nivel).toBe(1);
    expect(golpeRapido?.nivel).toBe(1);
  });

  it('zorro aprende escondite a nivel 12 y embestida a nivel 16', () => {
    const mp = ESPECIES['zorro'].movepool;
    const escondite = mp.find((e) => e.movimientoId === 'escondite');
    const embestida = mp.find((e) => e.movimientoId === 'embestida');
    expect(escondite?.nivel).toBe(12);
    expect(embestida?.nivel).toBe(16);
  });
});

describe('Criaturas nuevas — Venado', () => {
  it('venado existe en ESPECIES', () => {
    expect(ESPECIES['venado']).toBeDefined();
  });

  it('venado es Normal con sprite sprite_ciervo', () => {
    const v = ESPECIES['venado'];
    expect(v.tipos).toContain('Normal');
    expect(v.spriteKey).toBe('sprite_ciervo');
    expect(v.tasaCaptura).toBeGreaterThan(0);
  });

  it('movepool de venado referencia solo movimientos existentes', () => {
    for (const entrada of ESPECIES['venado'].movepool) {
      expect(MOVIMIENTOS[entrada.movimientoId]).toBeDefined();
    }
  });
});

describe('Movimientos nuevos', () => {
  const nuevos = ['aullido', 'rastreo', 'colmillo_brutal', 'bramido', 'colmillo_jabali', 'carga', 'estampida'];

  for (const id of nuevos) {
    it(`"${id}" existe en MOVIMIENTOS`, () => {
      expect(MOVIMIENTOS[id]).toBeDefined();
    });
  }

  it('aullido tiene efecto modificador_stat en atk del atacante', () => {
    const m = MOVIMIENTOS['aullido'];
    expect(m.efecto?.tipo).toBe('modificador_stat');
    if (m.efecto?.tipo === 'modificador_stat') {
      expect(m.efecto.objetivo).toBe('atacante');
      expect(m.efecto.stat).toBe('atk');
      expect(m.efecto.etapas).toBeGreaterThan(0);
    }
  });

  it('bramido tiene efecto modificador_stat en atk del defensor', () => {
    const m = MOVIMIENTOS['bramido'];
    expect(m.efecto?.tipo).toBe('modificador_stat');
    if (m.efecto?.tipo === 'modificador_stat') {
      expect(m.efecto.objetivo).toBe('defensor');
      expect(m.efecto.stat).toBe('atk');
      expect(m.efecto.etapas).toBeLessThan(0);
    }
  });

  it('carga tiene efecto modificador_stat en def del atacante', () => {
    const m = MOVIMIENTOS['carga'];
    expect(m.efecto?.tipo).toBe('modificador_stat');
    if (m.efecto?.tipo === 'modificador_stat') {
      expect(m.efecto.objetivo).toBe('atacante');
      expect(m.efecto.stat).toBe('def');
      expect(m.efecto.etapas).toBeLessThan(0);
    }
  });
});

describe('Movimientos de Agua', () => {
  it('chapoteo existe con tipo Agua, categoría físico, poder 45, PP 25', () => {
    const m = MOVIMIENTOS['chapoteo'];
    expect(m).toBeDefined();
    expect(m.tipo).toBe('Agua');
    expect(m.categoria).toBe('fisico');
    expect(m.poder).toBe(45);
    expect(m.pp).toBe(25);
    expect(m.precision).toBe(100);
    expect(m.efecto).toBeFalsy();
  });

  it('coletazo existe con tipo Agua, categoría físico, poder 70, PP 15', () => {
    const m = MOVIMIENTOS['coletazo'];
    expect(m).toBeDefined();
    expect(m.tipo).toBe('Agua');
    expect(m.categoria).toBe('fisico');
    expect(m.poder).toBe(70);
    expect(m.pp).toBe(15);
    expect(m.precision).toBe(95);
    expect(m.efecto).toBeFalsy();
  });
});
