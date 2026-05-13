import type { Criatura } from '@/entities/Criatura';

export function primeraVivaIdx(equipo: Criatura[]): number {
  return equipo.findIndex((c) => c.estaVivo);
}

export function hayAlgunaViva(equipo: Criatura[]): boolean {
  return equipo.some((c) => c.estaVivo);
}
