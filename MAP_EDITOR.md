# Map Editor

El editor de mapa es una herramienta standalone HTML+Canvas servida por el servidor de desarrollo de Vite. **Solo funciona en dev** — no existe en el bundle de producción.

**URL:** `http://localhost:5173/map-editor` (con `npm run dev` corriendo)

---

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `tools/map-editor.html` | Editor visual completo (UI + lógica en un solo archivo) |
| `vite.config.ts` | Plugin Vite que sirve el HTML y expone la API de guardado |
| `src/data/json/map_pampa.json` | Datos del mapa (terreno 60×30 + capa de árboles) |
| `src/data/json/world_objects.json` | Edificios y cercos con posición y dimensiones |
| `src/data/json/civilians.json` | Civiles (posición editable desde el editor) |
| `src/data/json/trainers.json` | Entrenadores (posición editable desde el editor) |
| `src/data/maps.ts` | Carga el JSON y exporta arrays tipados para el juego |
| `src/scenes/BootScene.ts` | Genera el tileset en runtime a partir de PNGs individuales |
| `src/scenes/OverworldScene.ts` | Usa los arrays de `maps.ts` para crear el Phaser Tilemap |

---

## Arquitectura del mapa

El juego **no usa Tiled**. El mapa es un archivo JSON propio de 60×30 tiles con dos capas:

```json
{
  "width": 60,
  "height": 30,
  "tiles": [["pasto", "pasto_alto", ...], ...],
  "trees": [{ "x": 10, "y": 5 }, ...]
}
```

- **`tiles`** — array 2D de strings de terreno; la capa visual base.
- **`trees`** — array de posiciones `{x, y}` de árboles; capa de overlay separada del terreno.

El módulo `src/data/maps.ts` carga este JSON y exporta:

| Export | Tipo | Uso |
|---|---|---|
| `MAPA_PAMPA` | `TileData[][]` | Para lógica de juego: contiene `{ terreno, zoneId }` por tile |
| `mapaPampaNumeros` | `number[][]` | Para Phaser Tilemap: enteros que indexan el tileset |
| `ARBOLES` | `ReadonlySet<string>` | Set de claves `"x,y"` con árbol; para sprites y colisión |
| `getTileData(tx, ty)` | función | Devuelve `TileData` en esa posición |

### Tipos de terreno y sus índices

| Terreno | Índice tileset | Comportamiento |
|---|---|---|
| `pasto` | 0 | Transitable, sin encuentros |
| `pasto_alto` | 1 | Encuentros wild (en zonas que lo soportan) |
| `agua` | 3 | **Colisión** — bloquea movimiento |
| `vereda` | 4 | Transitable, sin encuentros |
| `monte` | 5 | Encuentros en `pampa_cazadores` |
| `tierra_pelada` | 6 | Transitable, sin encuentros |
| `camino` | 7 | Transitable, sin encuentros |
| `arbol` | — | No es tile; vive en el campo `trees` del JSON |

> El índice 2 no se usa. Los árboles se renderizan como sprites encima del tilemap, no como tiles.

### Tileset generado en runtime

No hay un archivo de tileset pre-armado. `BootScene` carga los PNG individuales de `/assets/raw_sprites/tilesets/` y los compone en un canvas de 128×16 px (`8 tiles × 16 px`), que Phaser registra como la textura `'tileset'`. Los slots corresponden exactamente a los índices de la tabla anterior.

### Colisión

Están bloqueados:
1. Tiles de `agua` (índice 3) — vía `layer.setCollision([3])`
2. Posiciones de árboles — via `tilesObjetosMundo` Set
3. Footprints de edificios — calculados de `world_objects.json`
4. Tiles ocupados por NPCs visibles (entrenadores y civiles)
5. Bordes del mapa

---

## Sistema de zonas

Las zonas de encuentro se derivan automáticamente de la coordenada X del tile. No hay que definirlas en ningún otro lugar — están hardcodeadas en `maps.ts` y replicadas en el editor para la visualización.

| Zona | Rango X | Color en editor |
|---|---|---|
| `pampa_entrada` | 0–5 | Amarillo |
| `pampa_wild_low` | 6–15 | Verde claro |
| `pampa_tres_sombras` | 16–25 | Celeste |
| `pampa_cazadores` | 26–35 | Naranja |
| `pampa_wild_high` | 36–47 | Verde lima |
| `pampa_estancia` | 48–59 | Violeta |

Cada zona tiene su tabla de encuentros en `src/data/json/encounters.json`, con su `rate`, `tipoTile` requerido y las criaturas ponderadas. Si el tile tiene el terreno correcto Y el jugador pisa en esa zona, puede dispararse un encuentro.

---

## Interfaz del editor

### Toolbar

| Control | Función |
|---|---|
| **Terreno** / **Objetos/NPCs** | Cambia de modo |
| Zonas (checkbox) | Muestra/oculta overlay de zonas con etiquetas |
| Grilla (checkbox) | Muestra/oculta líneas de cuadrícula |
| NPCs (checkbox) | Muestra/oculta sprites y footprints de entidades |
| Zoom 8 / 12 / 16 / 20 | Tamaño de celda en pantalla (default: 12) |
| **Guardar Mapa** | Guarda `map_pampa.json` |
| **Guardar Objetos** | Guarda `world_objects.json` |

### Modo Terreno

**Sidebar izquierdo:** paleta de terrenos con swatch de color. Seleccioná uno y pintá en el canvas.

| Acción | Gesto |
|---|---|
| Pintar tile | Click izquierdo |
| Pintar área | Arrastrar con click izquierdo |
| Pipeta (seleccionar terreno del tile bajo el cursor) | Click derecho |
| Cambio rápido de terreno | Teclas `1`–`8` |
| Guardar | `Ctrl+S` |

**Árbol** es un terreno especial: no reemplaza el tile base, sino que alterna la presencia del árbol en ese tile (toggle). Si pintás un terreno no-árbol sobre un tile con árbol, el árbol desaparece.

**Barra de estado** (abajo): muestra coordenadas, terreno base, zona de encuentro y entidad en el tile bajo el cursor en tiempo real.

### Modo Objetos / NPCs

**Sidebar izquierdo:**

- **Seleccionado** — info del objeto seleccionado (nombre, posición). Click en mapa → moverlo. `Esc` → deseleccionar.
- **Edificios** — lista de edificios existentes. Click → seleccionar. Click seleccionado → deseleccionar.
- **Agregar** — botones para instanciar objetos nuevos (Rancho A/B, Iglesia, Cercos). La Iglesia es única: el botón se deshabilita si ya hay una en el mapa.
- **Eliminar seleccionado** — solo para edificios.
- **Civiles** — lista de civiles con posición. Click → seleccionar y poder moverlos en el canvas.
- **Entrenadores** — lista de entrenadores. Jefe Final aparece con ★.

**Guardado granular:** cada sección tiene su propio botón "Guardar X" que se habilita solo cuando esa sección tiene cambios pendientes (`dirty`). `Ctrl+S` guarda todo lo que esté sucio.

**En el canvas:**
- Click en tile vacío (sin selección activa) → intenta seleccionar el objeto/civil/entrenador en ese tile.
- Click en tile con selección activa → mueve la entidad seleccionada a ese tile.
- Los NPCs se renderizan con sus sprites reales si el `spriteKey` está en `SPRITE_PATHS`; sino, como punto de color (azul = civil, rojo = entrenador, dorado = jefe).
- Los footprints de edificios se muestran como rectángulos semitransparentes.

---

## API del backend (Vite plugin)

El plugin en `vite.config.ts` intercepta estas rutas durante dev:

| Método | URL | Acción |
|---|---|---|
| `GET` | `/api/map-editor/data` | Carga y devuelve los 4 JSON juntos (`mapData`, `worldObjects`, `civilians`, `trainers`) |
| `POST` | `/api/map-editor/save-map` | Valida JSON y sobreescribe `map_pampa.json` |
| `POST` | `/api/map-editor/save-objects` | Valida JSON y sobreescribe `world_objects.json` |
| `POST` | `/api/map-editor/save-civilians` | Valida JSON y sobreescribe `civilians.json` |
| `POST` | `/api/map-editor/save-trainers` | Valida JSON y sobreescribe `trainers.json` |

Todos los endpoints de escritura hacen `JSON.parse()` del body antes de escribir — si el JSON está malformado, devuelven 400 y no tocan el archivo.

**Generación inicial del mapa:** si `map_pampa.json` no existe al arrancar el servidor, el plugin lo genera con `buildInitialMapJson()` — que construye el mapa base con los parches de terreno, árboles y footprints de edificios hardcodeados.

---

## Flujo completo: JSON → juego

```
npm run dev
  ↓
Vite plugin verifica/genera map_pampa.json
  ↓
BootScene
  ├─ Carga PNGs de /assets/raw_sprites/tilesets/
  └─ Compone tileset canvas 128×16 → registra textura 'tileset'
  ↓
OverworldScene.create()
  ├─ maps.ts carga map_pampa.json → MAPA_PAMPA, mapaPampaNumeros, ARBOLES
  ├─ Phaser.make.tilemap({ data: mapaPampaNumeros }) → capa visual
  ├─ crearArboles() → Image por cada key en ARBOLES
  ├─ crearObjetosMundo() → Image por cada world object + footprint en tilesObjetosMundo
  ├─ crearMarcadoresEntrenadores() → entrenadores en tileX/tileY × 16
  └─ crearMarcadoresCiviles() → civiles en tileX/tileY × 16
  ↓
Juego corriendo
```

---

## Cómo editar el mapa

### Cambiar terreno

1. `npm run dev` → abrir `http://localhost:5173/map-editor`
2. Seleccionar terreno en el sidebar
3. Click/arrastrar en el canvas para pintar
4. **Guardar Mapa** (o `Ctrl+S`)
5. Refrescar el juego en otra pestaña → los cambios se cargan en el próximo `OverworldScene.create()`

> Vite HMR **no recarga automáticamente** el JSON del mapa — hay que refrescar manualmente.

### Agregar/mover un árbol

1. Modo Terreno, seleccionar **arbol** en el sidebar
2. Click en un tile → agrega árbol. Click de nuevo → lo quita (toggle).
3. Arrastrar → aplica la misma acción (add/remove) definida en el primer click del drag.
4. Guardar Mapa.

### Agregar un edificio nuevo

1. Modo Objetos / NPCs
2. Click en "**+ Rancho A**" (o el tipo deseado) → aparece en (1,1)
3. Click en el edificio en la lista → seleccionarlo
4. Click en el mapa → moverlo a la posición deseada
5. **Guardar edificios**

El footprint de colisión se calcula automáticamente a partir de `spriteWidth` y `spriteHeight`. Si necesitás un footprint personalizado, editá `world_objects.json` directamente y agregá el campo `footprint: [{ dx, dy }, ...]` con los offsets relativos al tile de posición.

### Mover un civil o entrenador

1. Modo Objetos / NPCs
2. Click en el civil/entrenador en la lista del sidebar (o en su sprite en el canvas)
3. Click en el tile de destino
4. **Guardar civiles** / **Guardar entrenadores**

> Los atributos del NPC (nombre, equipo, diálogos, etc.) **no se editan desde el editor visual** — hay que editar el JSON directamente. Ver `NPC_SYSTEM.md`.

---

## Agregar un nuevo tipo de edificio colocable

Requiere dos cambios:

**1. En `tools/map-editor.html` — registrar en `PLACEABLE_SPRITES`:**

```js
const PLACEABLE_SPRITES = {
  // ... existentes ...
  almacen: { spriteWidth: 48, spriteHeight: 32, unique: false },
};
```

**2. En `tools/map-editor.html` — agregar el botón en el HTML:**

```html
<button class="save-section-btn" id="add-btn-almacen" onclick="addWorldObject('almacen')">+ Almacén</button>
```

**3. Si el sprite nuevo necesita verse en el editor** — agregarlo a `SPRITE_PATHS` con su ruta en `/assets/sprites/`.

El sprite del juego se carga aparte en `BootScene` — asegurate de que la `spriteKey` usada en `world_objects.json` esté precargada ahí también.

---

## Estructura de `world_objects.json`

```json
{
  "objetos": [
    {
      "id": "iglesia_1718000000000",
      "spriteId": "iglesia",
      "posicion": { "x": 20, "y": 8 },
      "spriteWidth": 48,
      "spriteHeight": 64
    },
    {
      "id": "cerco_v_1",
      "spriteId": "cerco_vertical",
      "posicion": { "x": 10, "y": 5 },
      "spriteWidth": 16,
      "spriteHeight": 48,
      "footprint": [
        { "dx": 0, "dy": -1 },
        { "dx": 0, "dy":  0 }
      ]
    }
  ]
}
```

`footprint` es opcional. Sin él, el footprint se calcula automáticamente desde el centro-inferior del sprite usando `spriteWidth`/`spriteHeight` como dimensiones en píxeles. Con él, los `dx`/`dy` son offsets en tiles relativos a `posicion`.
