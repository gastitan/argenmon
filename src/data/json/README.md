# Archivos JSON de datos del juego

Todos los datos del juego viven aquí. Los schemas Zod están en `../schemas/`, los loaders en `../loaders/`.

---

## progress.json — Sistema de progresión

Define todas las flags, counters y variables de progresión del juego. El runtime (`src/systems/Progress.ts`) valida cualquier acceso contra este archivo: una key no declarada lanza un error en tiempo de ejecución.

### Secciones

| Sección | Tipo de valor | Uso |
|---------|--------------|-----|
| `flags` | `boolean` | Estado binario (derrotado / completado / visto) |
| `counters` | `number` (entero) | Acumuladores que solo crecen |
| `variables` | `string` (enum) | Estado narrativo con valores finitos |

### Naming convention

Formato: `<dominio>.<sujeto>_<estado>` en snake_case.

Los **booleans** terminan en verbo pasado: `_seen`, `_defeated`, `_completed`, `_unlocked`, `_obtained`, `_visited`, `_enabled`.

#### Dominios reservados

| Dominio | Descripción |
|---------|-------------|
| `story.` | Progresión narrativa principal |
| `trainer.` | Estado de entrenadores individuales |
| `biome.` | Estado de biomas completos |
| `quest.` | Sidequests futuras |
| `item.` | Items clave |
| `creature.` | Hitos relacionados a criaturas |
| `tutorial.` | Tutoriales mostrados |
| `stats.` | Counters de gameplay (solo para `counters`) |

### Cómo agregar una flag nueva

1. Agregar entrada en `progress.json → flags`:
   ```json
   "trainer.nuevo_defeated": {
     "default": false,
     "desc": "El jugador derrotó a Nuevo en la Pampa"
   }
   ```
2. Usar en el código: `GameState.setearFlag('trainer.nuevo_defeated', true)`.
3. No tocar TypeScript — el sistema la reconoce automáticamente al cargar.

### Cómo agregar un counter nuevo

1. Agregar entrada en `progress.json → counters`:
   ```json
   "stats.nuevo_counter": {
     "default": 0,
     "desc": "Descripción del counter"
   }
   ```
2. Usar: `GameState.incrementarContador('stats.nuevo_counter')` o `GameState.setearContador(...)`.

### Cómo agregar una variable nueva

Las variables representan estados con un conjunto finito de valores (enums narrativos). Requieren el campo `values`.

1. Agregar entrada en `progress.json → variables`:
   ```json
   "story.current_chapter": {
     "default": "intro",
     "values": ["intro", "mid", "end"],
     "desc": "Capítulo actual de la historia"
   }
   ```
2. Usar: `GameState.setearVariable('story.current_chapter', 'mid')`.
   El runtime valida que el valor esté dentro del enum declarado.

---

## Otros archivos

| Archivo | Descripción |
|---------|-------------|
| `creatures.json` | Las 6 criaturas del prototipo con stats base y movimientos |
| `moves.json` | Los 24 movimientos (4 por criatura) |
| `trainers.json` | Los 4 NPCs del mapa Pampa |
| `encounters.json` | Tablas de encuentros wild por bioma |
| `items.json` | Los 3 tipos de trampa |
| `types.json` | Tabla de efectividad 5×5 |
