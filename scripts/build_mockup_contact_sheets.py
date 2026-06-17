#!/usr/bin/env python3
"""Build contact sheets from existing mockup PNGs without regenerating pages."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MOCKUPS = ROOT / "docs" / "mockups"

DESKTOP = [
    "final-world-map.png",
    "final-story-dialogue.png",
    "final-training.png",
    "final-battle.png",
    "final-mind-demon.png",
    "final-report-growth.png",
    "final-daily.png",
    "final-roster-artifacts.png",
]

MOBILE = [
    "mobile-world-map-ai-generated.png",
    "mobile-story-dialogue-ai-generated.png",
    "mobile-training-ai-generated.png",
    "mobile-battle-ai-generated.png",
    "mobile-mind-demon-ai-generated.png",
    "mobile-report-growth-ai-generated.png",
    "mobile-daily-ai-generated.png",
    "mobile-roster-artifacts-ai-generated.png",
]


def font(size: int) -> ImageFont.ImageFont:
    for path in [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size)
            except OSError:
                pass
    return ImageFont.load_default()


def contact_sheet(paths: list[Path], out: Path, thumb_w: int, cols: int) -> None:
    label_font = font(18)
    imgs = []
    for path in paths:
        image = Image.open(path).convert("RGB")
        scale = thumb_w / image.width
        thumb = image.resize((thumb_w, int(image.height * scale)), Image.Resampling.LANCZOS)
        imgs.append((path.name, thumb))

    pad = 18
    label_h = 32
    cell_h = max(image.height for _, image in imgs) + label_h + pad
    rows = math.ceil(len(imgs) / cols)
    sheet = Image.new("RGB", (cols * (thumb_w + pad) + pad, rows * cell_h + pad), (232, 222, 200))
    draw = ImageDraw.Draw(sheet)

    for index, (name, image) in enumerate(imgs):
        x = pad + (index % cols) * (thumb_w + pad)
        y = pad + (index // cols) * cell_h
        sheet.paste(image, (x, y))
        draw.text((x, y + image.height + 6), name, fill=(40, 36, 30), font=label_font)

    sheet.save(out, quality=95)


def main() -> None:
    contact_sheet([MOCKUPS / name for name in DESKTOP], MOCKUPS / "desktop-current-assets-contact-sheet.png", 340, 2)
    contact_sheet([MOCKUPS / name for name in MOBILE], MOCKUPS / "mobile-ai-generated-contact-sheet.png", 200, 4)
    print("wrote contact sheets")


if __name__ == "__main__":
    main()
