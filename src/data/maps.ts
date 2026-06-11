/**
 * Mapa de la Pampa — datos en src/data/json/map_pampa.json.
 * Editá el mapa visualmente en http://localhost:5173/map-editor (solo en dev).
 *
 * Zonas por X:
 *   pampa_entrada      x 0–5
 *   pampa_wild_low     x 6–15
 *   pampa_tres_sombras x 16–25
 *   pampa_cazadores    x 26–35
 *   pampa_wild_high    x 36–47
 *   pampa_estancia     x 48–59
 *
 * Tipos de terreno y su índice para el tileset de Phaser:
 *   pasto        → 0
 *   pasto_alto   → 1  (encuentros)
 *   agua         → 3  (colisión)
 *   vereda       → 4  (transitable, sin encuentros)
 *   monte        → 5  (encuentros en pampa_cazadores)
 *   tierra_pelada→ 6  (transitable, sin encuentros)
 *   camino       → 7  (transitable, sin encuentros)
 *   orilla       → 8  (encuentros en pampa_orilla; orilla oeste)
 *   orilla-2     → 9  (mismos encuentros; orilla norte)
 *
 * Los árboles NO usan tile índice 2. Su presencia se almacena en el campo
 * `trees` del JSON (o, en formato viejo, en tiles con valor 'arbol').
 * La colisión se registra en tilesObjetosMundo (OverworldScene), igual que edificios.
 */

import mapJsonData from './json/map_pampa.json';

export type TipoTerreno =
  | 'pasto'
  | 'pasto_alto'
  | 'agua'
  | 'arbol'
  | 'monte'
  | 'orilla'
  | 'orilla-2'
  | 'tierra_pelada'
  | 'camino'
  | 'vereda';

export type ZoneId =
  | 'pampa_entrada'
  | 'pampa_wild_low'
  | 'pampa_tres_sombras'
  | 'pampa_cazadores'
  | 'pampa_wild_high'
  | 'pampa_estancia';

export interface TileData {
  terreno: TipoTerreno;
  zoneId: ZoneId;
}

function zoneForX(x: number): ZoneId {
  if (x <= 5)  return 'pampa_entrada';
  if (x <= 15) return 'pampa_wild_low';
  if (x <= 25) return 'pampa_tres_sombras';
  if (x <= 35) return 'pampa_cazadores';
  if (x <= 47) return 'pampa_wild_high';
  return 'pampa_estancia';
}

export function terrenoToTileIndex(terreno: TipoTerreno): number {
  switch (terreno) {
    case 'pasto_alto':    return 1;
    case 'agua':          return 3;
    case 'vereda':        return 4;
    case 'monte':         return 5;
    case 'tierra_pelada': return 6;
    case 'camino':        return 7;
    case 'orilla':        return 8;
    case 'orilla-2':      return 9;
    default:              return 0;  // pasto, arbol (fallback), etc.
  }
}

// ── Capa de árboles (separada del terreno base) ───────────────────────────────
// Soporta formato nuevo (campo trees en JSON) y formato viejo (arbol en tiles).
type MapJson = { tiles: string[][]; trees?: { x: number; y: number }[] };
const _json = mapJsonData as unknown as MapJson;

const _arbolesSet = new Set<string>();
if (_json.trees) {
  for (const { x, y } of _json.trees) _arbolesSet.add(`${x},${y}`);
} else {
  _json.tiles.forEach((row, y) => row.forEach((t, x) => {
    if (t === 'arbol') _arbolesSet.add(`${x},${y}`);
  }));
}

/** Set de posiciones "x,y" que tienen árbol. Usado por OverworldScene para sprites y colisión. */
export const ARBOLES: ReadonlySet<string> = _arbolesSet;

export const MAPA_PAMPA: TileData[][] = _json.tiles.map(
  (fila, y) => fila.map((terreno, x) => ({
    terreno: (_arbolesSet.has(`${x},${y}`) ? 'arbol' : terreno) as TipoTerreno,
    zoneId: zoneForX(x),
  }))
);

/** Array numérico para el tilemap de Phaser. Usa el terreno BASE (sin arbol → índice propio),
 *  de modo que el tile visual refleja el suelo real debajo del árbol. */
export const mapaPampaNumeros: number[][] = _json.tiles.map((fila) =>
  fila.map((t) => terrenoToTileIndex(t as TipoTerreno))
);

/** Devuelve el TileData en la posición (tx, ty) o undefined si está fuera de rango. */
export function getTileData(tx: number, ty: number): TileData | undefined {
  return MAPA_PAMPA[ty]?.[tx];
}
