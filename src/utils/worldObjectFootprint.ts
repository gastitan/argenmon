import type { ObjetoMundo } from '@/data/schemas/world_objects';

// Constantes del mapa de Pampa — sincronizadas con maps.ts y el schema de world_objects.
const TILE_PX   = 16;
const MAP_W     = 60;
const MAP_H     = 30;

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < MAP_W && y >= 0 && y < MAP_H;
}

/**
 * Devuelve los tiles que ocupa un sprite dado su posición de anclaje y dimensiones.
 * Usa píxeles reales del sprite (setOrigin 0.5, 1) para determinar qué tiles cubre,
 * incluyendo tiles parcialmente cubiertos. Tiles fuera del mapa se filtran silenciosamente.
 *
 * La fórmula tile-count (ceil(w/16)) NO es suficiente porque el centro del sprite
 * cae en el centro del tile ancla, no en su borde — un sprite de 32px centrado en tile 18
 * se extiende 8px dentro del tile 19 y 8px dentro del tile 17, por lo que ocupa 3 tiles
 * aunque ceil(32/16) = 2.
 */
export function calcularFootprintAutomatico(
  posicion: { x: number; y: number },
  spriteWidth: number,
  spriteHeight: number,
): Array<{ x: number; y: number }> {
  // Posición del sprite en píxeles (espejo exacto de crearObjetosMundo en OverworldScene)
  const cx = posicion.x * TILE_PX + TILE_PX / 2;  // centro X del sprite
  const by = (posicion.y + 1) * TILE_PX;           // borde inferior del sprite

  // Tiles que contienen al menos un píxel del sprite
  const leftTile   = Math.floor((cx - spriteWidth  / 2) / TILE_PX);
  const rightTile  = Math.floor((cx + spriteWidth  / 2 - 1) / TILE_PX);
  const topTile    = Math.floor((by - spriteHeight) / TILE_PX);
  const bottomTile = Math.floor((by - 1) / TILE_PX);

  const tiles: Array<{ x: number; y: number }> = [];
  for (let y = topTile; y <= bottomTile; y++) {
    for (let x = leftTile; x <= rightTile; x++) {
      if (inBounds(x, y)) tiles.push({ x, y });
    }
  }
  return tiles;
}

/**
 * Resuelve el footprint completo de un objeto:
 * - Si el objeto declara footprint: usa los offsets {dx, dy} relativos al anclaje.
 * - Si no: calcula automáticamente desde spriteWidth/spriteHeight.
 * En ambos casos filtra tiles fuera del mapa.
 */
export function resolverFootprint(obj: ObjetoMundo): Array<{ x: number; y: number }> {
  if (obj.footprint) {
    return obj.footprint
      .map(({ dx, dy }) => ({ x: obj.posicion.x + dx, y: obj.posicion.y + dy }))
      .filter(({ x, y }) => inBounds(x, y));
  }
  return calcularFootprintAutomatico(obj.posicion, obj.spriteWidth, obj.spriteHeight);
}
