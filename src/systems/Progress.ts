import { cargarCatalogoProgreso } from '@/data/loaders/loadProgress';

export interface ProgressoGuardado {
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  variables: Record<string, string>;
}

let estado: ProgressoGuardado = { flags: {}, counters: {}, variables: {} };

export function inicializarProgreso(guardado?: Partial<ProgressoGuardado>): void {
  const cat = cargarCatalogoProgreso();

  const flags: Record<string, boolean> = {};
  for (const [id, def] of Object.entries(cat.flags)) {
    flags[id] = guardado?.flags?.[id] ?? def.default;
  }

  const counters: Record<string, number> = {};
  for (const [id, def] of Object.entries(cat.counters)) {
    counters[id] = guardado?.counters?.[id] ?? def.default;
  }

  const variables: Record<string, string> = {};
  for (const [id, def] of Object.entries(cat.variables)) {
    variables[id] = guardado?.variables?.[id] ?? def.default;
  }

  estado = { flags, counters, variables };
}

export function exportarProgreso(): ProgressoGuardado {
  return {
    flags: { ...estado.flags },
    counters: { ...estado.counters },
    variables: { ...estado.variables },
  };
}

export function obtenerFlag(id: string): boolean {
  const cat = cargarCatalogoProgreso();
  if (!(id in cat.flags)) {
    throw new Error(`[Progress] Flag desconocida: "${id}". Declarala en progress.json → flags.`);
  }
  return estado.flags[id] ?? cat.flags[id].default;
}

export function setearFlag(id: string, valor: boolean): void {
  const cat = cargarCatalogoProgreso();
  if (!(id in cat.flags)) {
    throw new Error(`[Progress] Flag desconocida: "${id}". Declarala en progress.json → flags.`);
  }
  estado.flags[id] = valor;
  if (id === 'trainer.capataz_defeated' && valor === true) {
    estado.flags['biome.pampa_completed'] = true;
  }
}

export function obtenerContador(id: string): number {
  const cat = cargarCatalogoProgreso();
  if (!(id in cat.counters)) {
    throw new Error(`[Progress] Contador desconocido: "${id}". Declaralo en progress.json → counters.`);
  }
  return estado.counters[id] ?? cat.counters[id].default;
}

export function setearContador(id: string, valor: number): void {
  const cat = cargarCatalogoProgreso();
  if (!(id in cat.counters)) {
    throw new Error(`[Progress] Contador desconocido: "${id}". Declaralo en progress.json → counters.`);
  }
  estado.counters[id] = valor;
}

export function incrementarContador(id: string, cantidad = 1): void {
  const cat = cargarCatalogoProgreso();
  if (!(id in cat.counters)) {
    throw new Error(`[Progress] Contador desconocido: "${id}". Declaralo en progress.json → counters.`);
  }
  estado.counters[id] = (estado.counters[id] ?? cat.counters[id].default) + cantidad;
}

export function obtenerVariable(id: string): string {
  const cat = cargarCatalogoProgreso();
  if (!(id in cat.variables)) {
    throw new Error(`[Progress] Variable desconocida: "${id}". Declarala en progress.json → variables.`);
  }
  return estado.variables[id] ?? cat.variables[id].default;
}

export function setearVariable(id: string, valor: string): void {
  const cat = cargarCatalogoProgreso();
  if (!(id in cat.variables)) {
    throw new Error(`[Progress] Variable desconocida: "${id}". Declarala en progress.json → variables.`);
  }
  const valoresValidos = cat.variables[id].values;
  if (!valoresValidos.includes(valor)) {
    throw new Error(
      `[Progress] Valor inválido para variable "${id}": "${valor}". Valores válidos: ${valoresValidos.join(', ')}.`,
    );
  }
  estado.variables[id] = valor;
}
