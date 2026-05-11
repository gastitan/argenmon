# CLAUDE.md — Fauna Argentina (nombre tentativo)

> Este archivo es el contexto persistente del proyecto. Claude Code lo lee automáticamente al inicio de cada sesión. Mantenelo actualizado a medida que el proyecto evoluciona.

---

## 1. Visión del proyecto

Un RPG 2D por turnos estilo Pokémon GameBoy, donde el jugador explora ecosistemas argentinos capturando, criando y combatiendo con animales autóctonos. La estética visual emula auténticamente al Game Boy original (paleta de 4 colores verdes, resolución 160×144 o múltiplos, sprites 16×16 o 32×32).

**Objetivo del prototipo actual:** una versión jugable de un único bioma (Pampa) con 6 criaturas, sistema de combate completo, captura, y exploración básica.

**Filosofía de diseño:** autenticidad cultural argentina por encima de la imitación literal de Pokémon. El juego respeta a Nintendo: no usa nombres, sprites, ni mecánicas idénticas. Inspiración sí, copia no.

---

## 2. Prioridades de desarrollo (en orden estricto)

1. **Mecánicas de combate sólidas** — el corazón del juego, hay que pulirlo a fondo
2. **Estética visual auténtica GameBoy** — paleta, dithering, animaciones limitadas a la ortodoxia 8-bit
3. **Variedad y diseño de criaturas** — cada una debe sentirse distinta en combate
4. **Mundo y exploración** — secundario al combate, suficiente para dar contexto
5. **Historia y personajes** — mínima, solo lo necesario para motivar la aventura

Cuando haya conflicto entre dos prioridades, gana la de número más bajo.

---

## 3. Stack técnico

- **Motor:** Phaser 3
- **Lenguaje:** TypeScript
- **Build tool:** Vite
- **Editor de mapas:** Tiled (mapas exportados a JSON)
- **Editor de sprites:** Aseprite o Piskel
- **Control de versiones:** Git + GitHub
- **Testing:** Vitest para lógica de combate (la matemática del daño debe estar testeada)

**No introducir librerías nuevas sin justificación**. Si una funcionalidad puede resolverse con Phaser puro, se hace con Phaser puro.

---

## 4. Estructura de carpetas

```
src/
  scenes/       # BootScene, MenuScene, OverworldScene, BattleScene, etc.
  entities/     # Player, Creature, NPC, Trainer
  systems/      # BattleSystem, CaptureSystem, EncounterSystem, SaveSystem
  data/         # creatures.ts, moves.ts, types.ts, items.ts (datos estáticos)
  ui/           # Componentes de menú, diálogos, HUD de combate
  utils/        # Helpers, constantes, fórmulas
  assets/       # Sprites, tilesets, audio (organizados por subcarpetas)
public/
tests/          # Tests unitarios de systems/
```

---

## 5. Estética visual GameBoy

**Paleta obligatoria (4 colores, en hex):**
- `#0f380f` — verde más oscuro (sombras, contornos)
- `#306230` — verde oscuro (cuerpos, tierra)
- `#8bac0f` — verde claro (highlights, vegetación)
- `#9bbc0f` — verde más claro (fondos, cielo)

La paleta de 4 colores aplica a tiles, UI y overworld. **Excepción deliberada: los sprites de criaturas en combate no están restringidos a esta paleta** — deben verse lo más fiel posible al animal real.

**Resolución base:** 160×144 píxeles (la del Game Boy original), escalada por enteros (×2, ×3, ×4) para pantallas modernas.

**Filtro de texturas:** los tiles y gráficos generados usan nearest-neighbor (`pixelArt: true`). Los sprites de criaturas y el sprite del jugador usan `FilterMode.LINEAR` (aplicado en `BootScene.create()`) para una mejor calidad al escalar imágenes de alta resolución.

**Paneles de texto (UI):** fondo `clarisimo` (#9bbc0f) con texto `oscurisimo` (#0f380f). Esta combinación da ~8:1 de contraste, mucho más legible que el esquema invertido anterior.

**Sprites:**
- Personajes overworld: 16×16
- Criaturas en combate: 56×56 (área del jugador, espalda) y 64×64 (área del rival, frente)
- Tiles del mundo: 16×16

**Animación:** frames limitados, estilo GameBoy. Caminar = 2 frames. Combate = 1-2 frames de animación de ataque por movimiento. No usar tweens suaves; todo movimiento es discreto.

---

## 6. Las 6 criaturas del prototipo

Todas existen en `src/data/creatures.ts`. Stats balanceados para que ninguna sea dominante.

| # | Nombre | Tipo(s) | Rol | Notas |
|---|--------|---------|-----|-------|
| 01 | **Hornero** | Aire | Inicial balanceado | Ave nacional argentina. Stats parejos. Movimientos voladores y de "construcción" (defensa). |
| 02 | **Mara** | Tierra | Velocista esquivo | Alta velocidad, baja defensa. Movimientos de patada y carrera. |
| 03 | **Vizcacha** | Tierra | Defensor cavador | Defensa alta. Puede esconderse (subir evasión) y atacar desde abajo. |
| 04 | **Ñandú** | Tierra/Aire | Atacante físico veloz | Velocidad y ataque alto. No vuela pero salta. |
| 05 | **Peludo** (armadillo) | Tierra/Acero | Tanque | Defensa altísima. Bola defensiva. Lento pero resistente. |
| 06 | **Yarará** | Veneno | Atacante especial con estados | Inflige envenenamiento. Bajo HP, alto ataque especial. |

**Sistema de stats** (por criatura):
- HP, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad
- Rango base por stat: 30–90 al nivel 50
- Cada criatura tiene 4 movimientos disponibles al máximo en combate

---

## 7. Sistema de tipos

5 tipos en total. Tabla de efectividad:

|        | Tierra | Aire | Agua | Veneno | Normal |
|--------|--------|------|------|--------|--------|
| Tierra |   1×   | 0.5× |  1×  |   2×   |   1×   |
| Aire   |   2×   |  1×  |  1×  |   1×   |   1×   |
| Agua   |   2×   |  1×  | 0.5× |   1×   |   1×   |
| Veneno |   1×   |  1×  |  1×  |  0.5×  |   1×   |
| Normal |   1×   |  1×  |  1×  |   1×   |   1×   |

Fila = tipo del atacante, columna = tipo del defensor.

---

## 8. Fórmula de daño

```
daño = ((((2 × nivel / 5 + 2) × poder × atk / def) / 50) + 2) × modificadores

modificadores:
  - STAB (Same-Type Attack Bonus): ×1.5 si el tipo del movimiento coincide con el del atacante
  - Efectividad del tipo: ×0.5, ×1, ×2 según tabla
  - Crítico: ×1.5 (probabilidad base 1/16)
  - Aleatorio: ×(0.85 a 1.0)
```

Esta fórmula vive en `src/systems/BattleSystem.ts` y debe estar cubierta por tests unitarios. **Cualquier cambio a la fórmula requiere actualizar los tests.**

---

## 9. Sistema de captura

En lugar de "Pokébola" usamos **"Trampa"** (objeto cultural más coherente con la ambientación gauchesca/naturalista). Variantes:

- **Trampa común** — captura básica
- **Trampa de monte** — más efectiva en zonas boscosas
- **Trampa fina** — alta tasa de captura, cara

**Fórmula de captura:**
```
prob_captura = ((3 × hp_max - 2 × hp_actual) × tasa_base × bonus_trampa) / (3 × hp_max)
si la criatura tiene estado alterado (envenenada, dormida): bonus ×1.5
```

---

## 10. Loop de juego del prototipo

1. Pantalla de título → "Nueva partida" / "Continuar"
2. Intro breve: tu abuelo naturalista te encarga catalogar la fauna pampeana
3. Recibís tu primera criatura (Hornero) y tres trampas comunes
4. Explorás el mapa de la Pampa: pasto alto = encuentros aleatorios
5. Combatís, capturás, subís de nivel
6. Hay 3 NPCs entrenadores en el mapa que te desafían
7. Boss final: el "Capataz de la estancia" con 3 criaturas nivel 15
8. Pantalla de "Catálogo completo" si capturaste las 6 criaturas

---

## 11. Convenciones de código

- **TypeScript estricto:** `strict: true` en `tsconfig.json`. Nada de `any`.
- **Nombres en español para entidades del dominio del juego:** `Criatura`, `Movimiento`, `Trampa`, `Entrenador`. Nombres en inglés para conceptos técnicos: `Scene`, `System`, `Manager`.
- **Datos del juego en archivos `.ts` exportando `as const`** para que TypeScript infiera literales y dé autocompletado.
- **Una clase/sistema por archivo.** Archivos chicos y enfocados.
- **Comentarios solo cuando el código no se explica solo.** No comentar lo obvio.
- **Sin estado global mutable fuera de los sistemas.** Cada sistema gestiona su propio estado.

---

## 12. Roadmap por fases

| Fase | Foco | Estado |
|------|------|--------|
| 1 | Setup + mundo base | ✅ Completa |
| 2 | **Sistema de combate** | ✅ Completa |
| 3 | Criaturas y captura | ✅ Completa |
| 4 | Encuentros y entrenadores | ✅ Completa |
| 5 | Arte y pulido | 🔄 En progreso — sprites integrados, pendiente música/SFX/save |

**Regla de fases:** no se avanza a la fase N+1 hasta que la fase N esté completa y testeada. Sin excepciones.

### Qué hay implementado (mayo 2026)

- **BattleSystem** completo: daño con fórmula estándar, STAB, efectividad de tipos, críticos, estados alterados (veneno, sueño), captura con trampas
- **6 criaturas** con sprites PNG integrados: Hornero, Mara, Vizcacha, Ñandú, Peludo, Yarará
- **Overworld**: mapa de la Pampa con colisiones, zonas de pasto alto para encuentros aleatorios, 3 NPCs entrenadores, boss (Capataz)
- **BattleScene**: layout GameBoy auténtico — zona de combate (y:0–96, fondo claro), franja de suelo (y:96–104, oscuro), zona de UI (y:104–144, clarisimo con texto oscurisimo para máximo contraste)
- **UI de combate**: BattleMenu, MoveMenu, TrampaMenu, EquipoMenu, DialogBox, HpBar — todos sin fondo propio (usan el fondo permanente de la escena)
- **CatalogScene**: pantalla de catálogo al completar el juego
- **Tests unitarios**: BattleSystem, CaptureSystem, formulas

---

## 13. Assets — política

- **Placeholders al inicio** desde fuentes con licencia libre (Kenney.nl, OpenGameArt) para no bloquear el desarrollo del código
- **Arte final** se hace en una fase dedicada (Fase 5)
- **Nunca usar assets con copyright** (sprites de Pokémon real, música de juegos comerciales, etc.)
- **Atribuir todo asset libre** en un archivo `CREDITS.md`

---

## 14. Lo que NO hace este proyecto (anti-scope)

Para mantener el prototipo enfocado:

- ❌ Multijugador
- ❌ Crianza/breeding de criaturas
- ❌ Intercambio entre jugadores
- ❌ Más de un bioma (la Patagonia queda para una expansión futura)
- ❌ Mecánicas de día/noche
- ❌ Sistema de clima
- ❌ Más de 6 criaturas en el prototipo
- ❌ Evoluciones (se evalúa para versión post-prototipo)

Si surge la tentación de agregar algo de esta lista durante el desarrollo del prototipo: **no**. Se anota en un archivo `IDEAS_FUTURAS.md` y se sigue.

---

## 15. Decisiones pendientes

Cosas que el desarrollador (humano) todavía tiene que definir. Marcar con [x] cuando se resuelvan.

- [ ] Nombre definitivo del juego
- [ ] Diseño visual del protagonista (¿gaucho, naturalista, niño/a de campo?)
- [ ] Nombres definitivos de los movimientos de cada criatura (4 por criatura = 24 movimientos)
- [ ] Lore mínimo: nombre del abuelo, nombre del pueblo inicial, nombre de la estancia del boss
- [ ] Música: ¿composición original chiptune o uso de tracks libres?

---

## 16. Cómo trabajar con Claude Code en este proyecto

- **Empezar siempre en plan mode** para tareas que toquen más de un archivo
- **Usar `/model` con la opción "Opus in plan mode, Sonnet otherwise"** para razonamiento fuerte al planear y velocidad al ejecutar
- **Mantener este CLAUDE.md actualizado** cuando se tomen decisiones nuevas
- **Tests primero** para todo lo que toque la fórmula de daño o de captura
- **Commits chicos y descriptivos**, uno por feature lógica
- **Si Claude propone agregar una librería nueva, justificarla en el commit**

---

*Última actualización: mayo 2026 — Fases 1–4 completas, Fase 5 en progreso. Visual: sprites de criaturas con filtro LINEAR, paneles de texto clarisimo/oscurisimo.*