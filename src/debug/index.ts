import { DebugCommands } from './DebugCommands';

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).argendebug = DebugCommands;
  console.log('[DEBUG] Comandos disponibles en window.argendebug:');
  console.log('  argendebug.fillTraps()             — llena las 3 trampas a 10 unidades');
  console.log('  argendebug.dumpState()             — imprime el estado completo del juego');
  console.log('  argendebug.levelUp(indice, cant)   — sube de nivel a la criatura en el índice dado (default: 0, +1)');
  console.log('  argendebug.removeCreature(indice)  — elimina la criatura del equipo en ese índice (mínimo 1 criatura)');
  console.log('  argendebug.resetGame()             — borra el save y recarga la página (vuelta al estado inicial)');
}
