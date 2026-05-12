# Argenmon

RPG 2D por turnos estilo Game Boy con fauna autóctona de la Pampa argentina. Explorás ecosistemas, capturás animales y combatís con ellos usando un sistema de tipos y movimientos.

## Stack

- **Motor:** Phaser 3
- **Lenguaje:** TypeScript (strict)
- **Build:** Vite
- **Tests:** Vitest
- **Canvas lógico:** 320×240 px, escalado ×3 → 960×720 en pantalla
- **Render:** pixel-perfect (`pixelArt: true`, `roundPixels: true`)
- **Fuente:** Press Start 2P (Google Fonts)
- **Guardado:** localStorage — clave `pampamon_save_v1`

## Instalación

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # build de producción
npm test         # tests unitarios
```

## Estructura

```
src/
  scenes/    # BootScene, MenuScene, OverworldScene, BattleScene, CatalogScene
  entities/  # Criatura, Player
  systems/   # BattleSystem, CaptureSystem, EncounterSystem
  data/      # creatures, moves, types, items, trainers, playerState
  ui/        # BattleMenu, MoveMenu, TrampaMenu, EquipoMenu, DialogBox, HpBar
  utils/     # formulas, rng
tests/       # tests unitarios de sistemas de combate y captura
public/
  assets/sprites/  # sprites de las 6 criaturas + jugador (PNG)
```

## Las 6 criaturas

| # | Nombre | Tipo(s) | Rol |
|---|--------|---------|-----|
| 01 | Hornero | Aire | Inicial balanceado |
| 02 | Mara | Tierra | Velocista esquivo |
| 03 | Vizcacha | Tierra | Defensor cavador |
| 04 | Ñandú | Tierra/Aire | Atacante físico veloz |
| 05 | Peludo | Tierra/Acero | Tanque |
| 06 | Yarará | Veneno | Atacante especial con estados |

## Controles

| Tecla | Acción |
|-------|--------|
| Flechas | Mover personaje / navegar menús |
| Z | Confirmar / Interactuar |
| X | Cancelar / Volver |
| Z (combate, texto) | Avanzar / Saltar animación |

## Pipeline de assets

- **Sprites de criatura:** generados con Nano Banana (Gemini 2.5 Flash Image) a 512×512, procesados con un script Python (Pillow) que aplica la paleta master de 20 colores y downscalea a 96×96 con LANCZOS.
- **Paleta master:** 20 colores definidos en `palette.json`. Aplicada a todos los assets visuales.
- **Estética:** "moderno con vibe retro", inspirada en la era Game Boy Advance.

## Paleta master (20 colores)

| Grupo | Colores |
|-------|---------|
| Neutrales | `#1a1410` `#2d2419` `#f5e6c8` `#ffffff` |
| Marrones | `#4a3520` `#7a5a3a` `#a87b4f` `#c9a576` |
| Verdes | `#2d3d1f` `#4a6b3a` `#7a9b5a` `#b8c97a` |
| Ocres/amarillos | `#8a6a2a` `#c9a23a` `#e8c870` |
| Acentos | `#a8442a` `#3d5a7a` `#6a4a7a` |
| Grises | `#5a5a55` `#8a8a85` |

## Estado actual

- Fase 1 ✅ Mapa de la Pampa, movimiento del jugador, colisiones
- Fase 2 ✅ Combate por turnos completo: daño, tipos, estados, captura, entrenadores
- Fase 3 ✅ Las 6 criaturas con sprites, sistema de captura con trampas
- Fase 4 ✅ Encuentros aleatorios en pasto alto, 3 NPCs entrenadores, boss (Capataz)
- Fase 5 ✅ Migración estética y pipeline de assets (paleta master 20 colores, Press Start 2P)
- Fase 6 ✅ Refactor canvas 320×240, SCALE ×3, todas las escenas rediseñadas
- Fase 7 ✅ Flujo de eventos de batalla secuencial, animaciones de daño/desmayo, invariante primera criatura viva
- Fase 8 🔄 Audio, polish, contenido pendiente

## Licencia

Proyecto privado — prototipo educativo. No afiliado a Nintendo ni Game Freak.
