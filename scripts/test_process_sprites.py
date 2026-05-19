#!/usr/bin/env python3
"""
Tests unitarios para process_sprites.py.

Ejecutar con:
  python scripts/test_process_sprites.py
  python -m pytest scripts/test_process_sprites.py
"""

import sys
from pathlib import Path
from unittest.mock import patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from process_sprites import (
    ASSET_CONFIGS,
    nearest_color,
    process_sprite,
    quantize_image,
    validate_integer_scale,
)


def test_nearest_color_exact_match() -> None:
    palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
    assert nearest_color(0, 255, 0, palette) == (0, 255, 0)


def test_nearest_color_arbitrary_input() -> None:
    palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
    # (200, 10, 10) is closest to red
    assert nearest_color(200, 10, 10, palette) == (255, 0, 0)


def test_quantize_image_preserves_transparency() -> None:
    palette = [(255, 0, 0), (0, 0, 0)]
    img = Image.new("RGBA", (2, 2), (100, 100, 100, 255))
    pixels = img.load()
    pixels[0, 0] = (50, 50, 50, 0)  # fully transparent

    result = quantize_image(img, palette)
    result_pixels = result.load()

    assert result_pixels[0, 0][3] == 0


def test_validate_integer_scale_accepts_same_size() -> None:
    # 16×24 → 16×24: factor 1
    assert validate_integer_scale("test.png", 16, 24, 16, 24, "characters") is True


def test_validate_integer_scale_accepts_integer_multiple() -> None:
    # 32×48 → 16×24: factor 2
    assert validate_integer_scale("test.png", 32, 48, 16, 24, "characters") is True


def test_validate_integer_scale_rejects_non_integer() -> None:
    # 73×91 → 16×24: not divisible
    assert validate_integer_scale("test.png", 73, 91, 16, 24, "characters") is False


def test_creatures_pipeline_uses_lanczos() -> None:
    config = ASSET_CONFIGS["creatures"]
    palette = [(0, 0, 0)]
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 255))
    resized = Image.new("RGBA", (96, 96), (0, 0, 0, 255))

    with patch("process_sprites.Image.open", return_value=img), \
         patch.object(Image.Image, "resize", return_value=resized) as mock_resize, \
         patch.object(Image.Image, "save"):
        process_sprite(Path("fake.png"), Path("out.png"), palette, config, "creatures")

    assert mock_resize.call_args[0][1] == Image.LANCZOS


def test_characters_pipeline_uses_nearest() -> None:
    config = ASSET_CONFIGS["characters"]
    palette = [(0, 0, 0)]
    img = Image.new("RGBA", (16, 24), (0, 0, 0, 255))
    resized = Image.new("RGBA", (16, 24), (0, 0, 0, 255))

    with patch("process_sprites.Image.open", return_value=img), \
         patch.object(Image.Image, "resize", return_value=resized) as mock_resize, \
         patch.object(Image.Image, "save"):
        process_sprite(Path("fake.png"), Path("out.png"), palette, config, "characters")

    assert mock_resize.call_args[0][1] == Image.NEAREST


def test_tilesets_pipeline_skips_resize() -> None:
    # tilesets tiene target_size=None → el output es la imagen cuantizada sin resize
    config = ASSET_CONFIGS["tilesets"]
    assert config["target_size"] is None

    palette = [(0, 0, 0)]
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 255))

    with patch("process_sprites.Image.open", return_value=img), \
         patch.object(Image.Image, "resize") as mock_resize, \
         patch.object(Image.Image, "save") as mock_save:
        ok = process_sprite(Path("fake.png"), Path("out.png"), palette, config, "tilesets")

    assert ok is True
    mock_resize.assert_not_called()
    mock_save.assert_called_once()


if __name__ == "__main__":
    tests = [
        test_nearest_color_exact_match,
        test_nearest_color_arbitrary_input,
        test_quantize_image_preserves_transparency,
        test_validate_integer_scale_accepts_same_size,
        test_validate_integer_scale_accepts_integer_multiple,
        test_validate_integer_scale_rejects_non_integer,
        test_creatures_pipeline_uses_lanczos,
        test_characters_pipeline_uses_nearest,
        test_tilesets_pipeline_skips_resize,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            print(f"  PASS  {test.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  FAIL  {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR {test.__name__}: {type(e).__name__}: {e}")
            failed += 1

    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
