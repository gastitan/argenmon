# Sistema de NPCs

Hay **dos tipos de NPC** con sistemas completamente distintos: **Entrenadores** (trainer battle) y **Civiles** (diálogo solo).

---

## Archivos involucrados

| Tipo | JSON | Schema (Zod) | Loader | Escena |
|---|---|---|---|---|
| Entrenador | `src/data/json/trainers.json` | `src/data/schemas/trainer.schema.ts` | `src/data/loaders/loadTrainers.ts` | `src/scenes/OverworldScene.ts` |
| Civil | `src/data/json/civilians.json` | `src/data/schemas/civilians.ts` | `src/data/loaders/loadCivilians.ts` | `src/scenes/OverworldScene.ts` |
| Flags de derrota | `src/data/json/progress.json` | — | — | — |

---

## Tipo 1: Entrenador

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `string` | Sí | Identificador único, ej. `"peon"` |
| `nombre` | `string` | Sí | Nombre mostrado, ej. `"El Peón"` |
| `tileX` / `tileY` | `number` (int ≥ 0) | Sí | Posición en coordenadas de tile |
| `direccion` | `"up"\|"down"\|"left"\|"right"` | Sí | Dirección a la que mira; define el cono de visión |
| `visionTiles` | `number` (int ≥ 1) | Sí | Alcance del cono en tiles |
| `equipo` | `{ especieId, nivel }[]` (min 1) | Sí | Equipo de criaturas. `especieId` debe existir en `creatures.json` |
| `esJefeFinal` | `boolean` | Sí | `true` solo para el Capataz |
| `spriteKey` | `string` | No | Clave del sprite precargado. Sin este campo se dibuja un rectángulo verde |
| `flagDerrota` | `string` | No | Flag en `progress.json` que se activa al ganarle. Si está activo, el NPC no aparece |
| `dialogoPreBatalla` | `string` | No | Línea de diálogo antes de arrancar la batalla (Z/X para continuar) |
| `dialogoPostDerrota` | `string` | No | Línea mostrada en `BattleScene` después de que el jugador gana |

### Zona de contacto — Cono de visión

Detección **automática**, sin input del jugador. Se dispara cada vez que el jugador pisa un tile (`OverworldScene.ts:106-108`, `241-251`).

El algoritmo en `enLineaDeVision()` (`OverworldScene.ts:271-285`) recorre tile a tile desde el entrenador en su `direccion`, hasta `visionTiles` pasos. Si el player está en alguno → trigger. Si hay un tile bloqueado en el camino → corta.

```
Entrenador (direccion: "down", visionTiles: 4)
  → mira los tiles (tileX, tileY+1), (tileX, tileY+2), (tileX, tileY+3), (tileX, tileY+4)
  → el primero bloqueado corta la visión
```

**Prioridad:** la línea de visión se verifica **antes** que los encuentros wild (`OverworldScene.ts:240`).

**Visibilidad:** si `flagDerrota` está activo al cargar la escena, el sprite se oculta (`setVisible(false)`) y el NPC ya no aparece en el loop de detección (`OverworldScene.ts:156-158`, `242`).

**Colisión:** los entrenadores visibles bloquean el movimiento del player y el cono de visión de otros entrenadores vía `esBloqueado()` (`OverworldScene.ts:402`).

### Diálogos

- **Pre-batalla** (`OverworldScene.ts:295-319`): caja de diálogo del overworld. Z o X cierra y arranca la batalla.
- **Post-derrota**: viaja a `BattleScene` a través del `entrenadorId`; se muestra al terminar la batalla.
- Sin estos campos opcionales, la batalla arranca directamente.

### Ejemplo — agregar un entrenador nuevo

**1. Agregar la flag de derrota en `src/data/json/progress.json`:**

```json
"trainer.veterinaria_defeated": {
  "default": false,
  "desc": "El jugador derrotó a la Veterinaria en la Pampa"
}
```

**2. Agregar el entrenador en `src/data/json/trainers.json`:**

```json
{
  "id": "veterinaria",
  "nombre": "La Veterinaria",
  "tileX": 18,
  "tileY": 30,
  "direccion": "right",
  "visionTiles": 5,
  "equipo": [
    { "especieId": "hornero", "nivel": 9 },
    { "especieId": "yarara", "nivel": 10 }
  ],
  "esJefeFinal": false,
  "spriteKey": "npc_veterinaria",
  "flagDerrota": "trainer.veterinaria_defeated",
  "dialogoPreBatalla": "¡Pará ahí! Primero me demostrás que sabés cuidar criaturas.",
  "dialogoPostDerrota": "Bien hecho. Venía perdiendo la fe en los jóvenes."
}
```

El loader valida automáticamente contra el schema Zod y contra las especies de `creatures.json`. Si algún campo falta o una `especieId` no existe, el juego no arranca y la consola muestra el error exacto.

---

## Tipo 2: Civil

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `string` | Sí | Identificador único |
| `nombre` | `string` | Sí | Nombre mostrado en el diálogo |
| `tileX` / `tileY` | `number` (int ≥ 0) | Sí | Posición en coordenadas de tile |
| `spriteKey` | `string` | Sí | Clave del sprite precargado (obligatorio, no hay fallback) |
| `dialogos` | `string[]` (min 1) | Sí | Array de diálogos; actualmente solo se muestra `dialogos[0]` |

### Zona de contacto — Adyacencia + tecla Z

El civil **no detecta al player automáticamente**. El jugador debe presionar **Z** estando en un tile adyacente (arriba, abajo, izquierda o derecha). Si ningún civil está adyacente, Z no hace nada.

Lógica en `intentarHablarConCivil()` (`OverworldScene.ts:180-195`): verifica los 4 tiles adyacentes al player contra la lista de civiles.

Los civiles **siempre bloquean** el movimiento — no desaparecen ni tienen flags (`OverworldScene.ts:401`).

### Diálogos

Caja en overworld (`OverworldScene.ts:197-227`): fondo rectángulo verde (`0x9bbc0f`), texto `"Nombre: mensaje"`, font Press Start 2P 8px. Z o X cierra.

### Ejemplo — agregar un civil nuevo

Solo editar `src/data/json/civilians.json`, dentro del array `"civiles"`:

```json
{
  "id": "gaucho_viejo",
  "nombre": "El Gaucho",
  "tileX": 35,
  "tileY": 8,
  "spriteKey": "npc_gaucho",
  "dialogos": [
    "Cuando el cielo se pone así de quieto, siempre aparece algo raro en el monte."
  ]
}
```

Nada más. El loader importa, valida y exporta el array completo automáticamente.

---

## Caso especial: Almacenero

El almacenero vive en `trainers.json` (con `visionTiles` y cono de detección automática como cualquier entrenador), pero su `id === "almacenero"` lo intercepta antes de arrancar una batalla y dispara en cambio el menú de curación (`OverworldScene.ts:244-245`). Es un entrenador sin `flagDerrota` — nunca desaparece.

---

## Flujo de datos

```
JSON → Zod schema.parse() → loader exporta array tipado
  → OverworldScene.create() crea sprites en (tileX * 16, tileY * 16)
  → cada paso del player:
      entrenadores → enLineaDeVision() → iniciarBatallaEntrenador() o mostrarDialogoAlmacenero()
      Z key        → intentarHablarConCivil() → mostrarDialogoCivil()
```

### Posición en pantalla

Tanto entrenadores como civiles usan coordenadas de tile. La conversión a píxeles es:

```
pixelX = tileX * TILE_SIZE   // TILE_SIZE = 16
pixelY = tileY * TILE_SIZE
```

El sprite se dibuja con `setOrigin(0, 0)` — el tile especificado es la esquina superior izquierda del sprite.

### Depth (orden de dibujado)

Ambos tipos usan `setDepth(y + TILE_SIZE)` para que el player pueda "pasar por detrás" de los NPCs cuando está en un tile de Y mayor.
