#!/usr/bin/env python3
"""
Cuantiza sprites PNG a la paleta master de Argenmon y los escala a 96×96.

Uso: python scripts/process_sprites.py
  - Lee raw_sprites/*.png
  - Aplica palette.json (distancia euclidiana RGB, transparencia preservada)
  - Escala a 96×96 con LANCZOS
  - Guarda en processed_sprites/
"""

import json
import math
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent.parent
RAW_DIR = ROOT / "public/assets/raw_sprites"
OUT_DIR = ROOT / "processed_sprites"
PALETTE_FILE = ROOT / "public" / "palette.json"
TARGET_SIZE = (96, 96)


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


def process_sprite(src: Path, dst: Path, palette: list[tuple[int, int, int]]) -> None:
    img = Image.open(src)
    quantized = quantize_image(img, palette)
    scaled = quantized.resize(TARGET_SIZE, Image.LANCZOS)
    scaled.save(dst, "PNG")


def main() -> None:
    if not RAW_DIR.exists():
        print(f"Error: carpeta {RAW_DIR} no encontrada.", file=sys.stderr)
        sys.exit(1)

    palette = load_palette(PALETTE_FILE)
    OUT_DIR.mkdir(exist_ok=True)

    pngs = sorted(RAW_DIR.glob("*.png"))
    if not pngs:
        print(f"No se encontraron PNGs en {RAW_DIR}.", file=sys.stderr)
        sys.exit(1)

    for src in pngs:
        dst = OUT_DIR / src.name
        process_sprite(src, dst, palette)
        print(f"  {src.name} → {dst.relative_to(ROOT)}")

    print(f"\nListo: {len(pngs)} sprites procesados en {OUT_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
