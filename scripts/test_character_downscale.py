#!/usr/bin/env python3
"""
Script de prueba ad-hoc: downscale de sprite de personaje a 32x48 + cuantizacion a paleta master.

Probador, NO es el pipeline final. Genera multiples variantes para comparar
visualmente cual se ve mejor antes de comprometer el pipeline definitivo.

Uso:
  python scripts/test_character_downscale.py <ruta_al_sprite_raw.png>

Salida:
  Crea carpeta test_output/ con multiples variantes:
    - 01_crop.png           : bounding box recortado, tamano original
    - 02_nearest.png        : downscale con NEAREST puro
    - 03_bilinear.png       : downscale con BILINEAR
    - 04_lanczos.png        : downscale con LANCZOS
    - 05_avgpool.png        : downscale con average pooling custom
    - 06_nearest_quant.png  : NEAREST + cuantizado a paleta master
    - 07_bilinear_quant.png : BILINEAR + cuantizado a paleta master
    - 08_lanczos_quant.png  : LANCZOS + cuantizado a paleta master
    - 09_avgpool_quant.png  : avgpool + cuantizado a paleta master
    - *_x6.png              : version escalada 6x con NEAREST para ver detalle

Comparar visualmente las 4 variantes cuantizadas finales (06, 07, 08, 09)
escaladas (los archivos _x6) y elegir la que mejor preserve identidad visual.
"""

import json
import math
import sys
from pathlib import Path
from PIL import Image

# Configuracion
TARGET_SIZE = (32, 32)
PREVIEW_SCALE = 10  # escalado para preview (32x32 -> 320x320)

# Paleta master (hardcodeada para no depender de path del proyecto)
PALETTE_HEX = [
    "#1a1410", "#2d2419", "#f5e6c8", "#ffffff",
    "#4a3520", "#7a5a3a", "#a87b4f", "#c9a576",
    "#2d3d1f", "#4a6b3a", "#7a9b5a", "#b8c97a",
    "#8a6a2a", "#c9a23a", "#e8c870",
    "#a8442a", "#3d5a7a", "#6a4a7a",
    "#5a5a55", "#8a8a85",
]


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


PALETTE = [hex_to_rgb(c) for c in PALETTE_HEX]


def nearest_color(r: int, g: int, b: int) -> tuple[int, int, int]:
    """Distancia euclidiana RGB. Mismo algoritmo que el script oficial."""
    best = PALETTE[0]
    best_dist = math.inf
    for pr, pg, pb in PALETTE:
        dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
        if dist < best_dist:
            best_dist = dist
            best = (pr, pg, pb)
    return best


def quantize_image(img: Image.Image) -> Image.Image:
    """Aplica paleta master pixel a pixel. Preserva alpha=0."""
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            nr, ng, nb = nearest_color(r, g, b)
            pixels[x, y] = (nr, ng, nb, a)
    return img


def auto_crop_transparent(img: Image.Image) -> Image.Image:
    """Recorta bordes totalmente transparentes para ajustar bounding box."""
    img = img.convert("RGBA")
    bbox = img.getbbox()  # encuentra el rectangulo no transparente
    if bbox is None:
        return img
    return img.crop(bbox)


def average_pool_downscale(img: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    """
    Downscale custom por average pooling.
    Para cada pixel del output, promedia el bloque correspondiente del input.
    Pixeles transparentes se ignoran en el promedio para no contaminar bordes.
    """
    img = img.convert("RGBA")
    src_w, src_h = img.size
    tgt_w, tgt_h = target_size
    src_pixels = img.load()

    output = Image.new("RGBA", target_size, (0, 0, 0, 0))
    out_pixels = output.load()

    # Tamano del bloque en el input que corresponde a cada pixel del output
    block_w = src_w / tgt_w
    block_h = src_h / tgt_h

    for y in range(tgt_h):
        for x in range(tgt_w):
            x0 = int(x * block_w)
            x1 = int((x + 1) * block_w)
            y0 = int(y * block_h)
            y1 = int((y + 1) * block_h)
            x1 = max(x1, x0 + 1)
            y1 = max(y1, y0 + 1)

            r_sum, g_sum, b_sum, a_sum, count = 0, 0, 0, 0, 0
            opaque_count = 0
            for sy in range(y0, min(y1, src_h)):
                for sx in range(x0, min(x1, src_w)):
                    r, g, b, a = src_pixels[sx, sy]
                    a_sum += a
                    count += 1
                    if a > 0:
                        r_sum += r * a
                        g_sum += g * a
                        b_sum += b * a
                        opaque_count += a

            if count == 0:
                continue

            avg_a = a_sum // count
            # Si el bloque es mayoritariamente transparente, el pixel queda transparente
            if avg_a < 128:
                out_pixels[x, y] = (0, 0, 0, 0)
                continue

            if opaque_count > 0:
                avg_r = r_sum // opaque_count
                avg_g = g_sum // opaque_count
                avg_b = b_sum // opaque_count
                out_pixels[x, y] = (avg_r, avg_g, avg_b, 255)
            else:
                out_pixels[x, y] = (0, 0, 0, 0)

    return output


def upscale_preview(img: Image.Image, scale: int) -> Image.Image:
    """Escala con NEAREST para preview legible."""
    w, h = img.size
    return img.resize((w * scale, h * scale), Image.NEAREST)


def main() -> None:
    if len(sys.argv) != 2:
        print("Uso: python scripts/test_character_downscale.py <sprite.png>", file=sys.stderr)
        sys.exit(1)

    src_path = Path(sys.argv[1])
    if not src_path.exists():
        print(f"ERROR: archivo {src_path} no existe.", file=sys.stderr)
        sys.exit(1)

    out_dir = Path("test_output")
    out_dir.mkdir(exist_ok=True)

    print(f"Procesando: {src_path}")
    raw = Image.open(src_path).convert("RGBA")
    print(f"  Tamano raw: {raw.size[0]}x{raw.size[1]}")

    # Paso 1: auto-crop
    cropped = auto_crop_transparent(raw)
    cropped.save(out_dir / "01_crop.png")
    print(f"  Tamano post-crop: {cropped.size[0]}x{cropped.size[1]}")

    # Paso 2: downscale con 4 algoritmos
    nearest = cropped.resize(TARGET_SIZE, Image.NEAREST)
    bilinear = cropped.resize(TARGET_SIZE, Image.BILINEAR)
    lanczos = cropped.resize(TARGET_SIZE, Image.LANCZOS)
    avgpool = average_pool_downscale(cropped, TARGET_SIZE)

    nearest.save(out_dir / "02_nearest.png")
    bilinear.save(out_dir / "03_bilinear.png")
    lanczos.save(out_dir / "04_lanczos.png")
    avgpool.save(out_dir / "05_avgpool.png")

    # Paso 3: cuantizar cada uno a paleta master
    nearest_q = quantize_image(nearest.copy())
    bilinear_q = quantize_image(bilinear.copy())
    lanczos_q = quantize_image(lanczos.copy())
    avgpool_q = quantize_image(avgpool.copy())

    nearest_q.save(out_dir / "06_nearest_quant.png")
    bilinear_q.save(out_dir / "07_bilinear_quant.png")
    lanczos_q.save(out_dir / "08_lanczos_quant.png")
    avgpool_q.save(out_dir / "09_avgpool_quant.png")

    # Paso 4: generar previews escalados para inspeccion visual
    for name, img in [
        ("06_nearest_quant", nearest_q),
        ("07_bilinear_quant", bilinear_q),
        ("08_lanczos_quant", lanczos_q),
        ("09_avgpool_quant", avgpool_q),
    ]:
        preview = upscale_preview(img, PREVIEW_SCALE)
        preview.save(out_dir / f"{name}_x{PREVIEW_SCALE}.png")

    print()
    print(f"Listo. Resultados en {out_dir}/")
    print()
    print("Para comparar, abri los archivos *_x6.png. Esos son las 4 variantes")
    print("cuantizadas escaladas 6x (32x48 -> 192x288) para ver detalle.")
    print()
    print("Mi expectativa:")
    print("  - 06_nearest_quant_x6 : duro, pixeles aislados, probablemente feo")
    print("  - 07_bilinear_quant_x6: suave, puede perder definicion de bordes")
    print("  - 08_lanczos_quant_x6: similar a bilinear, bordes mas definidos")
    print("  - 09_avgpool_quant_x6: balance, conserva forma general")
    print()
    print("Elegir la que mejor preserve identidad visual del personaje.")


if __name__ == "__main__":
    main()
