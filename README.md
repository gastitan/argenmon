# Argenmon

RPG 2D por turnos estilo Game Boy con fauna autóctona de la Pampa argentina. Explorás ecosistemas, capturás animales y combatís con ellos usando un sistema de tipos y movimientos.

## Stack

- **Motor:** Phaser 3
- **Lenguaje:** TypeScript (strict)
- **Build:** Vite
- **Tests:** Vitest

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

## Paleta visual

4 colores estilo Game Boy original:

| Color | Hex | Uso |
|-------|-----|-----|
| Verde más oscuro | `#0f380f` | Sombras, contornos |
| Verde oscuro | `#306230` | Fondos, tierra |
| Verde claro | `#8bac0f` | Highlights, zonas de combate |
| Verde más claro | `#9bbc0f` | Fondos claros |

## Estado actual

- Fase 1 ✅ Mapa de la Pampa, movimiento del jugador, colisiones
- Fase 2 ✅ Combate por turnos completo: daño, tipos, estados, captura, entrenadores
- Fase 3 ✅ Las 6 criaturas con sprites, sistema de captura con trampas
- Fase 4 ✅ Encuentros aleatorios en pasto alto, 3 NPCs entrenadores, boss (Capataz)
- Fase 5 🔄 Sprites finales integrados, pulido visual en progreso

## Licencia

Proyecto privado — prototipo educativo. No afiliado a Nintendo ni Game Freak.
