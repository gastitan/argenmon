import type { EspecieBase } from '@/data/creatures';
import { calcularStat, calcularHP } from '@/data/creatures';
import type { Movimiento } from '@/data/moves';
import { MOVIMIENTOS } from '@/data/moves';
import type { Tipo } from '@/data/types';

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

  estadoAlterado: 'envenenado' | null = null;
  modificadorEvasion = 0; // 0 = normal, 1 = +1 etapa, 2 = +2 etapas (máx)

  constructor(especie: EspecieBase, nivel: number) {
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

    this.movimientos = especie.movimientosIniciales.map((id) => ({
      movimiento: MOVIMIENTOS[id],
      ppActual: MOVIMIENTOS[id].pp,
    }));
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
