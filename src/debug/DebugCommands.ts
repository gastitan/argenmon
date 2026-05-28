import { GameState, calcularExpParaSiguienteNivel } from '@/state/GameState';
import { calcularHP, ESPECIES } from '@/data/creatures';
import { movimientosAlNivel } from '@/systems/Movepool';
import { MOVIMIENTOS } from '@/data/moves';

export const DebugCommands = {
  fillTraps(): void {
    GameState.datos.inventario.trampaComun = 10;
    GameState.datos.inventario.trampaMonte = 10;
    GameState.datos.inventario.trampaFina = 10;
    console.log('[DEBUG] Trampas llenadas: 10 común, 10 monte, 10 fina');
  },

  dumpState(): void {
    console.log('[DEBUG] Estado del juego:', JSON.stringify(GameState.datos, null, 2));
  },

  levelUp(indice = 0, cantidad = 1): void {
    const equipo = GameState.datos.equipo;
    if (indice < 0 || indice >= equipo.length) {
      console.warn(`[DEBUG] levelUp: índice ${indice} fuera de rango (equipo tiene ${equipo.length} criaturas)`);
      return;
    }
    const criatura = equipo[indice];
    const nivelAnterior = criatura.nivel;
    const nivelNuevo = Math.min(nivelAnterior + cantidad, 100);

    const especie = ESPECIES[criatura.especieId];
    const nuevoHpMax = calcularHP(especie.hpBase, nivelNuevo);
    const nuevosMovs = movimientosAlNivel(criatura.especieId, nivelNuevo);
    const nuevasPPs: [number, number, number, number] = [
      MOVIMIENTOS[nuevosMovs[0]]?.pp ?? 0,
      MOVIMIENTOS[nuevosMovs[1]]?.pp ?? 0,
      MOVIMIENTOS[nuevosMovs[2]]?.pp ?? 0,
      MOVIMIENTOS[nuevosMovs[3]]?.pp ?? 0,
    ];

    GameState.actualizarCriatura(criatura.uid, {
      nivel: nivelNuevo,
      expActual: 0,
      expParaSiguienteNivel: calcularExpParaSiguienteNivel(nivelNuevo),
      hpMaxCacheado: nuevoHpMax,
      hpActual: nuevoHpMax,
      movimientosActuales: nuevosMovs,
      movimientosAprendidos: Array.from(new Set([...criatura.movimientosAprendidos, ...nuevosMovs])),
      ppActuales: nuevasPPs,
    });

    console.log(`[DEBUG] ${especie.nombre} subió de nivel ${nivelAnterior} → ${nivelNuevo}`);
  },

  removeCreature(indice: number): void {
    const equipo = GameState.datos.equipo;
    if (equipo.length <= 1) {
      console.warn('[DEBUG] removeCreature: no se puede eliminar la última criatura del equipo');
      return;
    }
    if (indice < 0 || indice >= equipo.length) {
      console.warn(`[DEBUG] removeCreature: índice ${indice} fuera de rango (equipo tiene ${equipo.length} criaturas)`);
      return;
    }
    const eliminada = equipo[indice];
    const especie = ESPECIES[eliminada.especieId];
    GameState.datos.equipo.splice(indice, 1);
    console.log(`[DEBUG] ${especie.nombre} eliminada del equipo. Equipo actual: ${GameState.datos.equipo.length} criatura(s)`);
  },

  resetGame(): void {
    GameState.borrarSave();
    console.log('[DEBUG] Save borrado. Recargando...');
    location.reload();
  },
};
