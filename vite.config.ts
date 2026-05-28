import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Map generation (mirrors buildMapa in maps.ts) ─────────────────────────────
type TipoTerreno = 'pasto' | 'pasto_alto' | 'agua' | 'arbol' | 'monte' | 'tierra_pelada' | 'camino' | 'vereda';

function buildInitialMapJson(): string {
  const ov: Record<string, TipoTerreno> = {};
  const treesSet = new Set<string>();
  function patch(x1: number, x2: number, y1: number, y2: number, t: TipoTerreno) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) ov[`${x},${y}`] = t;
  }
  function addTree(x: number, y: number) { treesSet.add(`${x},${y}`); }
  addTree(10,5); addTree(14,22); addTree(8,25);
  addTree(37,14); addTree(46,23); addTree(51,22); addTree(57,23);
  for (let y = 9; y <= 20; y++) { addTree(51, y); addTree(52, y); }
  patch(56, 56, 9,  20, 'agua');
  patch(55, 55, 12, 18, 'agua');
  patch(8,  10, 8,  12, 'pasto_alto');
  patch(11, 13, 17, 21, 'pasto_alto');
  patch(7,  8,  13, 14, 'pasto_alto');
  patch(27, 29, 8,  11, 'monte');
  patch(31, 34, 19, 22, 'monte');
  patch(38, 42, 5,  11, 'pasto_alto');
  patch(40, 43, 18, 23, 'pasto_alto');
  patch(44, 46, 13, 17, 'pasto_alto');
  patch(43, 45, 8,  10, 'agua');

  // Tiles bajo world objects: usar 'tierra_pelada' si el tile no fue explícitamente patcheado.
  // Evita que la regeneración del mapa asigne 'pasto' bajo edificios.
  try {
    const woPath = resolve(__dirname, 'src/data/json/world_objects.json');
    if (existsSync(woPath)) {
      const woJson = JSON.parse(readFileSync(woPath, 'utf-8')) as {
        objetos: Array<{
          posicion: { x: number; y: number };
          spriteWidth: number;
          spriteHeight: number;
          footprint?: Array<{ dx: number; dy: number }>;
        }>;
      };
      const TILE_PX = 16;
      for (const obj of (woJson.objetos ?? [])) {
        let fp: Array<{ x: number; y: number }>;
        if (obj.footprint) {
          fp = obj.footprint.map(({ dx, dy }) => ({ x: obj.posicion.x + dx, y: obj.posicion.y + dy }));
        } else {
          const cx  = obj.posicion.x * TILE_PX + TILE_PX / 2;
          const by  = (obj.posicion.y + 1) * TILE_PX;
          const l   = Math.floor((cx - obj.spriteWidth  / 2) / TILE_PX);
          const r   = Math.floor((cx + obj.spriteWidth  / 2 - 1) / TILE_PX);
          const top = Math.floor((by - obj.spriteHeight) / TILE_PX);
          const bot = Math.floor((by - 1) / TILE_PX);
          fp = [];
          for (let fy = top; fy <= bot; fy++)
            for (let fx = l; fx <= r; fx++)
              if (fx > 0 && fx < 59 && fy > 0 && fy < 29) fp.push({ x: fx, y: fy });
        }
        for (const { x, y } of fp)
          if (!ov[`${x},${y}`]) ov[`${x},${y}`] = 'tierra_pelada';
      }
    }
  } catch { /* world_objects.json puede no existir todavía */ }

  const tiles: TipoTerreno[][] = [];
  for (let y = 0; y < 30; y++) {
    const row: TipoTerreno[] = [];
    for (let x = 0; x < 60; x++) {
      if (y === 0 || y === 29 || x === 0 || x === 59) {
        treesSet.add(`${x},${y}`);
        row.push('pasto');
      } else {
        row.push(ov[`${x},${y}`] ?? 'pasto');
      }
    }
    tiles.push(row);
  }
  const trees = Array.from(treesSet).map(key => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  });
  return JSON.stringify({ width: 60, height: 30, tiles, trees }, null, 2);
}

// ── Vite plugin ───────────────────────────────────────────────────────────────
function mapEditorPlugin(): Plugin {
  const root = __dirname;
  const mapJsonPath      = resolve(root, 'src/data/json/map_pampa.json');
  const worldObjJsonPath = resolve(root, 'src/data/json/world_objects.json');
  const civiliansPath    = resolve(root, 'src/data/json/civilians.json');
  const trainersPath     = resolve(root, 'src/data/json/trainers.json');
  const editorHtmlPath   = resolve(root, 'tools/map-editor.html');

  function ensureMapJson() {
    if (!existsSync(mapJsonPath)) {
      writeFileSync(mapJsonPath, buildInitialMapJson(), 'utf-8');
      console.log('[map-editor] Generated initial map_pampa.json');
    }
  }

  function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((res) => {
      let body = '';
      req.on('data', (c: Buffer) => { body += c.toString(); });
      req.on('end', () => res(body));
    });
  }

  function jsonOk(res: ServerResponse, data: unknown) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  }

  function jsonErr(res: ServerResponse, msg: string, code = 500) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = code;
    res.end(JSON.stringify({ error: msg }));
  }

  return {
    name: 'map-editor',

    configureServer(server) {
      ensureMapJson();

      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = (req.url ?? '').split('?')[0];

        // Serve editor HTML at /map-editor
        if (url === '/map-editor' || url === '/map-editor/') {
          try {
            const html = readFileSync(editorHtmlPath, 'utf-8');
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
          } catch {
            jsonErr(res, 'map-editor.html not found', 404);
          }
          return;
        }

        // GET /api/map-editor/data  — load all JSON files
        if (req.method === 'GET' && url === '/api/map-editor/data') {
          try {
            jsonOk(res, {
              mapData:      JSON.parse(readFileSync(mapJsonPath,      'utf-8')),
              worldObjects: JSON.parse(readFileSync(worldObjJsonPath, 'utf-8')),
              civilians:    JSON.parse(readFileSync(civiliansPath,    'utf-8')),
              trainers:     JSON.parse(readFileSync(trainersPath,     'utf-8')),
            });
          } catch (e) {
            jsonErr(res, String(e));
          }
          return;
        }

        // POST /api/map-editor/save-map  — overwrite map_pampa.json
        if (req.method === 'POST' && url === '/api/map-editor/save-map') {
          readBody(req).then(body => {
            try {
              JSON.parse(body);                           // validate JSON before writing
              writeFileSync(mapJsonPath, body, 'utf-8');
              jsonOk(res, { ok: true });
            } catch (e) {
              jsonErr(res, String(e), 400);
            }
          });
          return;
        }

        // POST /api/map-editor/save-objects  — overwrite world_objects.json
        if (req.method === 'POST' && url === '/api/map-editor/save-objects') {
          readBody(req).then(body => {
            try {
              JSON.parse(body);
              writeFileSync(worldObjJsonPath, body, 'utf-8');
              jsonOk(res, { ok: true });
            } catch (e) {
              jsonErr(res, String(e), 400);
            }
          });
          return;
        }

        // POST /api/map-editor/save-civilians  — merge positions into civilians.json
        // Only tileX/tileY are editor-controlled. All other fields (spriteKey, dialogos, etc.)
        // are preserved from the current file on disk to prevent stale-state overwrites.
        if (req.method === 'POST' && url === '/api/map-editor/save-civilians') {
          readBody(req).then(body => {
            try {
              const incoming = JSON.parse(body) as { civiles: Array<{ id: string; tileX: number; tileY: number }> };
              const current  = JSON.parse(readFileSync(civiliansPath, 'utf-8')) as { civiles: Array<Record<string, unknown>> };
              const posMap   = new Map(incoming.civiles.map(c => [c.id, { tileX: c.tileX, tileY: c.tileY }]));
              const merged   = { civiles: current.civiles.map(c => {
                const pos = posMap.get(c.id as string);
                return pos ? { ...c, tileX: pos.tileX, tileY: pos.tileY } : c;
              }) };
              writeFileSync(civiliansPath, JSON.stringify(merged, null, 2), 'utf-8');
              jsonOk(res, { ok: true });
            } catch (e) {
              jsonErr(res, String(e), 400);
            }
          });
          return;
        }

        // POST /api/map-editor/save-trainers  — merge positions into trainers.json
        // Only tileX/tileY are editor-controlled. All other fields (spriteKey, equipo, etc.)
        // are preserved from the current file on disk to prevent stale-state overwrites.
        if (req.method === 'POST' && url === '/api/map-editor/save-trainers') {
          readBody(req).then(body => {
            try {
              const incoming = JSON.parse(body) as Array<{ id: string; tileX: number; tileY: number }>;
              const current  = JSON.parse(readFileSync(trainersPath, 'utf-8')) as Array<Record<string, unknown>>;
              const posMap   = new Map(incoming.map(t => [t.id, { tileX: t.tileX, tileY: t.tileY }]));
              const merged   = current.map(t => {
                const pos = posMap.get(t.id as string);
                return pos ? { ...t, tileX: pos.tileX, tileY: pos.tileY } : t;
              });
              writeFileSync(trainersPath, JSON.stringify(merged, null, 2), 'utf-8');
              jsonOk(res, { ok: true });
            } catch (e) {
              jsonErr(res, String(e), 400);
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// ── Vite config ───────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [mapEditorPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
