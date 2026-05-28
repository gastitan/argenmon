#!/usr/bin/env python3
"""
Procesa sprites PNG para Criollos aplicando la paleta guía master y escalando
según el tipo de asset.

La paleta master (public/palette.json) actúa como PALETA GUÍA, no como
restricción estricta. Para criaturas (pipeline LANCZOS), la interpolación
produce variantes de los colores guía — esto es esperado y deseado para
lograr el look "pixel art HD". Para personajes y tilesets (pipeline NEAREST),
la cuantización sí aplica la paleta píxel a píxel sin interpolación.

Uso:
  python scripts/process_sprites.py creatures    # 96×96, LANCZOS
  python scripts/process_sprites.py characters   # 16×24, NEAREST
  python scripts/process_sprites.py tilesets     # sin resize, NEAREST
  python scripts/process_sprites.py all          # procesa todos los tipos

Estructura de carpetas:
  public/assets/raw_sprites/
    creatures/     → processed_sprites/creatures/
    characters/    → processed_sprites/characters/
    tilesets/      → processed_sprites/tilesets/
"""

import json
import math
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent.parent
RAW_BASE = ROOT / "public" / "assets" / "raw_sprites"
OUT_BASE = ROOT / "processed_sprites"
PALETTE_FILE = ROOT / "public" / "palette.json"

ASSET_CONFIGS: dict[str, dict] = {
    "creatures": {
        "input_dir": "creatures",
        "output_dir": "creatures",
        "target_size": (96, 96),
        "resize_mode": "LANCZOS",
        "require_integer_scale": False,
        "min_input_size": (16, 16),
    },
    "characters": {
        "input_dir": "characters",
        "output_dir": "characters",
        "target_size": (16, 24),
        "resize_mode": "NEAREST",
        "require_integer_scale": True,
        "min_input_size": (16, 24),
    },
    "tilesets": {
        "input_dir": "tilesets",
        "output_dir": "tilesets",
        "target_size": None,
        "resize_mode": "NEAREST",
        "require_integer_scale": False,
        "min_input_size": (16, 16),
    },
}


def load_palette(path: Path) -> list[tuple[int, int, int]]:
    data = json.loads(path.read_text())
    result = []
    for hex_color in data["colors"]:
        h = hex_color.lstrip("#")
        result.append((int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)))
    return result


def nearest_color(r: int, g: int, b: int, palette: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    best = palette[0]
    best_dist = math.inf
    for pr, pg, pb in palette:
        dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
        if dist < best_dist:
            best_dist = dist
            best = (pr, pg, pb)
    return best


def quantize_image(img: Image.Image, palette: list[tuple[int, int, int]]) -> Image.Image:
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            nr, ng, nb = nearest_color(r, g, b, palette)
            pixels[x, y] = (nr, ng, nb, a)

    return img


def validate_integer_scale(
    src_name: str, w: int, h: int, tw: int, th: int, asset_type: str
) -> bool:
    if w % tw != 0 or h % th != 0 or (w // tw) != (h // th):
        print(
            f"ERROR: {src_name} tiene {w}×{h} px. Para tipo '{asset_type}' las "
            f"dimensiones deben dividir exactamente al target {tw}×{th}. "
            f"Tamaños válidos sugeridos: {tw}×{th}, {2*tw}×{2*th}, {4*tw}×{4*th}.",
            file=sys.stderr,
        )
        return False
    return True


def process_sprite(
    src: Path,
    dst: Path,
    palette: list[tuple[int, int, int]],
    config: dict,
    asset_type: str,
) -> bool:
    img = Image.open(src)
    w, h = img.size
    min_w, min_h = config["min_input_size"]

    if w < min_w or h < min_h:
        print(
            f"ERROR: {src.name} tiene {w}×{h} px. Mínimo requerido para tipo "
            f"'{asset_type}': {min_w}×{min_h} px.",
            file=sys.stderr,
        )
        return False

    target_size: tuple[int, int] | None = config["target_size"]

    if config["require_integer_scale"] and target_size is not None:
        tw, th = target_size
        if not validate_integer_scale(src.name, w, h, tw, th, asset_type):
            return False

    quantized = quantize_image(img, palette)

    if target_size is None:
        result = quantized
    elif config["resize_mode"] == "LANCZOS":
        result = quantized.resize(target_size, Image.LANCZOS)
    else:
        result = quantized.resize(target_size, Image.NEAREST)

    result.save(dst, "PNG")
    return True


def process_type(asset_type: str, palette: list[tuple[int, int, int]]) -> tuple[int, int]:
    config = ASSET_CONFIGS[asset_type]
    input_dir = RAW_BASE / config["input_dir"]
    output_dir = OUT_BASE / config["output_dir"]

    if not input_dir.exists():
        print(
            f"ERROR: carpeta public/assets/raw_sprites/{config['input_dir']} no encontrada. "
            f"Crear la carpeta y agregar sprites antes de procesar.",
            file=sys.stderr,
        )
        return 0, 1

    pngs = sorted(input_dir.glob("*.png"))
    if not pngs:
        print(f"WARNING: no se encontraron PNGs en raw_sprites/{config['input_dir']}/. Saltando.")
        return 0, 0

    output_dir.mkdir(parents=True, exist_ok=True)
    ok = 0
    errors = 0

    for src in pngs:
        dst = output_dir / src.name
        if process_sprite(src, dst, palette, config, asset_type):
            print(f"  {src.name} → processed_sprites/{config['output_dir']}/{src.name}")
            ok += 1
        else:
            errors += 1

    return ok, errors


def main() -> None:
    valid_args = (*ASSET_CONFIGS, "all")
    if len(sys.argv) < 2 or sys.argv[1] not in valid_args:
        types = ", ".join(ASSET_CONFIGS.keys())
        print(f"Uso: python scripts/process_sprites.py [{types}, all]", file=sys.stderr)
        sys.exit(1)

    arg = sys.argv[1]
    types_to_process = list(ASSET_CONFIGS.keys()) if arg == "all" else [arg]

    palette = load_palette(PALETTE_FILE)

    total_ok = 0
    total_errors = 0

    for asset_type in types_to_process:
        print(f"\n[{asset_type}]")
        ok, errors = process_type(asset_type, palette)
        total_ok += ok
        total_errors += errors

    print(f"\nListo: {total_ok} sprites procesados, {total_errors} errores.")
    if total_errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
