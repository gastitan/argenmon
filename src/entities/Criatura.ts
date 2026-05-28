import type { EspecieBase } from '@/data/creatures';
import { calcularStat, calcularHP } from '@/data/creatures';
import type { Movimiento } from '@/data/moves';
import { MOVIMIENTOS } from '@/data/moves';
import type { Tipo } from '@/data/types';
import { movimientosAlNivel } from '@/systems/Movepool';

export interface EstadoMovimiento {
  movimiento: Movimiento;
  ppActual: number;
}

export class Criatura {
  readonly especie: EspecieBase;
  readonly nivel: number;
  readonly tipos: readonly Tipo[];

  readonly hpMax: number;
  hpActual: number;

  readonly atk: number;
  readonly def: number;
  readonly atkEsp: number;
  readonly defEsp: number;
  readonly vel: number;

  readonly movimientos: EstadoMovimiento[];

  movimientosAprendidos: string[];

  estadoAlterado: 'envenenado' | null = null;
  modificadorEvasion = 0;
  modificadorAtk = 0; // etapas de stat (-6 a +6)
  modificadorDef = 0;

  constructor(especie: EspecieBase, nivel: number, movimientoIds?: string[]) {
    this.especie = especie;
    this.nivel = nivel;
    this.tipos = especie.tipos;

    this.hpMax = calcularHP(especie.hpBase, nivel);
    this.hpActual = this.hpMax;

    this.atk = calcularStat(especie.atkBase, nivel);
    this.def = calcularStat(especie.defBase, nivel);
    this.atkEsp = calcularStat(especie.atkEspBase, nivel);
    this.defEsp = calcularStat(especie.defEspBase, nivel);
    this.vel = calcularStat(especie.velBase, nivel);

    const ids = movimientoIds ?? movimientosAlNivel(especie.id, nivel);
    this.movimientos = ids.map((id) => ({
      movimiento: MOVIMIENTOS[id],
      ppActual: MOVIMIENTOS[id].pp,
    }));
    this.movimientosAprendidos = [...ids];
  }

  get estaVivo(): boolean {
    return this.hpActual > 0;
  }

  recibirDanio(cantidad: number): void {
    this.hpActual = Math.max(0, this.hpActual - cantidad);
  }

  curar(cantidad: number): void {
    this.hpActual = Math.min(this.hpMax, this.hpActual + cantidad);
  }
}
