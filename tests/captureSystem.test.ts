import { describe, it, expect } from 'vitest';
import { intentarCaptura } from '@/systems/CaptureSystem';
import { Criatura } from '@/entities/Criatura';
import { ESPECIES } from '@/data/creatures';
import { TRAMPAS } from '@/data/items';
import { crearRNG } from '@/utils/rng';

function mkMara(nivel = 5): Criatura {
  return new Criatura(ESPECIES.mara, nivel);
}

describe('intentarCaptura — probabilidad', () => {
  it('a HP máximo la captura es difícil con trampa común', () => {
    // Prob ≈ 0.133 al 100% HP (tasaBase=0.4, bonusTrampa=1)
    let capturas = 0;
    for (let i = 0; i < 1000; i++) {
      if (intentarCaptura(mkMara(5), TRAMPAS.trampaComun, crearRNG(i)).exito) capturas++;
    }
    // Esperamos ~13% de éxito → entre 5% y 25%
    expect(capturas).toBeGreaterThan(50);
    expect(capturas).toBeLessThan(250);
  });

  it('a HP bajo la captura es más fácil', () => {
    // Probar muchas seeds: HP=1 debe ganar más que HP=max
    let exitosHPBajo = 0;
    let exitosHPAlto = 0;
    for (let s = 0; s < 200; s++) {
      const cBajo = mkMara(5); cBajo.hpActual = 1;
      const cAlto = mkMara(5); // hpMax
      if (intentarCaptura(cBajo, TRAMPAS.trampaComun, crearRNG(s)).exito) exitosHPBajo++;
      if (intentarCaptura(cAlto, TRAMPAS.trampaComun, crearRNG(s)).exito) exitosHPAlto++;
    }
    expect(exitosHPBajo).toBeGreaterThan(exitosHPAlto);
  });

  it('trampa fina captura más que trampa común a igual HP', () => {
    let exitosComun = 0;
    let exitosFina = 0;
    for (let s = 0; s < 300; s++) {
      const c1 = mkMara(5); c1.hpActual = Math.floor(c1.hpMax / 2);
      const c2 = mkMara(5); c2.hpActual = Math.floor(c2.hpMax / 2);
      if (intentarCaptura(c1, TRAMPAS.trampaComun, crearRNG(s)).exito) exitosComun++;
      if (intentarCaptura(c2, TRAMPAS.trampaFina, crearRNG(s)).exito) exitosFina++;
    }
    expect(exitosFina).toBeGreaterThan(exitosComun);
  });

  it('estado alterado mejora la tasa de captura', () => {
    let exitosSin = 0;
    let exitosCon = 0;
    for (let s = 0; s < 300; s++) {
      const sin = mkMara(5); sin.hpActual = Math.floor(sin.hpMax / 2);
      const con = mkMara(5); con.hpActual = Math.floor(con.hpMax / 2);
      con.estadoAlterado = 'envenenado';
      if (intentarCaptura(sin, TRAMPAS.trampaComun, crearRNG(s)).exito) exitosSin++;
      if (intentarCaptura(con, TRAMPAS.trampaComun, crearRNG(s)).exito) exitosCon++;
    }
    expect(exitosCon).toBeGreaterThan(exitosSin);
  });
});

describe('intentarCaptura — sacudidas', () => {
  it('captura exitosa siempre devuelve 3 sacudidas', () => {
    // Usamos HP=1 y trampa fina para maximizar prob de éxito
    for (let s = 0; s < 100; s++) {
      const c = mkMara(5); c.hpActual = 1;
      const r = intentarCaptura(c, TRAMPAS.trampaFina, crearRNG(s));
      if (r.exito) {
        expect(r.sacudidas).toBe(3);
      }
    }
  });

  it('captura fallida devuelve 1 o 2 sacudidas', () => {
    // HP máximo → prob muy baja → casi siempre falla
    for (let s = 0; s < 50; s++) {
      const c = mkMara(20); // nivel más alto = más HP
      const r = intentarCaptura(c, TRAMPAS.trampaComun, crearRNG(s));
      if (!r.exito) {
        expect(r.sacudidas).toBeGreaterThanOrEqual(1);
        expect(r.sacudidas).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('intentarCaptura — determinismo', () => {
  it('la misma seed produce el mismo resultado', () => {
    const c1 = mkMara(5); c1.hpActual = Math.floor(c1.hpMax / 3);
    const c2 = mkMara(5); c2.hpActual = Math.floor(c2.hpMax / 3);
    const r1 = intentarCaptura(c1, TRAMPAS.trampaComun, crearRNG(77));
    const r2 = intentarCaptura(c2, TRAMPAS.trampaComun, crearRNG(77));
    expect(r1.exito).toBe(r2.exito);
    expect(r1.sacudidas).toBe(r2.sacudidas);
  });
});
