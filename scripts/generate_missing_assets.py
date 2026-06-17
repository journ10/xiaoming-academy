#!/usr/bin/env python3
"""Legacy placeholder generator for grouped UI asset PNGs.

This script uses PIL drawing and is not an accepted source for final visual
assets. Keep it only for temporary placeholders or audit comparisons; run it
with --allow-procedural-placeholders only when overwriting placeholder files is
intentional. Final mockup implementation assets should come from image_gen
sources, with chroma-key cleanup or crop extraction as post-processing.
"""

from __future__ import annotations

import json
import math
import random
import sys
from datetime import date
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "generated"
SOURCE_DOC = "docs/missing-assets-inventory.md"

random.seed(42)


COLORS = {
    "paper": "#f2dfb8",
    "paper_light": "#fff2cf",
    "paper_shadow": "#c59a62",
    "gold": "#c68b37",
    "gold_light": "#f1d28a",
    "gold_dark": "#7a4c21",
    "ink": "#26313a",
    "ink_soft": "#4c5661",
    "jade": "#62a997",
    "jade_light": "#a7dfc9",
    "teal": "#1f5f68",
    "cyan": "#6ed4d2",
    "red": "#a84e43",
    "red_light": "#e09a84",
    "violet": "#6a4f95",
    "violet_light": "#b49bdc",
    "blue": "#4f79a8",
    "blue_light": "#a9caec",
    "green": "#4f8d57",
    "green_light": "#a9d88e",
    "cream": "#f9ebcd",
    "dark": "#172229",
    "dark_2": "#26343c",
    "disabled": "#8f8b82",
}


manifest: list[dict[str, str]] = []


def hex_to_rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def rgba(name: str, alpha: int = 255) -> tuple[int, int, int, int]:
    return hex_to_rgba(COLORS[name], alpha)


def canvas(size: tuple[int, int]) -> Image.Image:
    return Image.new("RGBA", size, (0, 0, 0, 0))


def save_asset(
    asset_id: str,
    group: str,
    filename: str,
    img: Image.Image,
    priority: str,
    role: str,
) -> None:
    path = OUT / group / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    img.save(path)
    manifest.append(
        {
            "id": asset_id,
            "group": group,
            "priority": priority,
            "role": role,
            "path": str(path.relative_to(ROOT)),
            "size": f"{img.width}x{img.height}",
        }
    )


def mask_round(size: tuple[int, int], box: tuple[int, int, int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(box, radius=radius, fill=255)
    return mask


def texture_fill(
    size: tuple[int, int],
    base: tuple[int, int, int, int],
    accent: tuple[int, int, int, int],
    strength: int = 28,
) -> Image.Image:
    fill = Image.new("RGBA", size, base)
    noise = Image.effect_noise(size, 88).convert("L")
    speckle_alpha = noise.point(lambda p: max(0, min(72, int((p - 120) * strength / 120))))
    speckles = Image.new("RGBA", size, accent)
    speckles.putalpha(speckle_alpha)
    fill.alpha_composite(speckles)
    return fill


def add_shadow(
    img: Image.Image,
    box: tuple[int, int, int, int],
    radius: int,
    alpha: int = 90,
    blur: int = 18,
    offset: tuple[int, int] = (0, 8),
) -> None:
    layer = canvas(img.size)
    draw = ImageDraw.Draw(layer)
    shifted = (box[0] + offset[0], box[1] + offset[1], box[2] + offset[0], box[3] + offset[1])
    draw.rounded_rectangle(shifted, radius=radius, fill=(0, 0, 0, alpha))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def add_corner_flourish(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    color: tuple[int, int, int, int],
    scale: int,
) -> None:
    x1, y1, x2, y2 = box
    w = scale
    corners = [
        (x1, y1, 1, 1),
        (x2, y1, -1, 1),
        (x1, y2, 1, -1),
        (x2, y2, -1, -1),
    ]
    for cx, cy, sx, sy in corners:
        draw.line((cx, cy + sy * w, cx, cy + sy * (w // 3), cx + sx * (w // 3), cy), fill=color, width=max(2, w // 12))
        draw.arc(
            (
                cx + sx * (w // 3),
                cy + sy * (w // 3),
                cx + sx * w,
                cy + sy * w,
            )
            if sx > 0 and sy > 0
            else normalize_box(cx + sx * w, cy + sy * w, cx + sx * (w // 3), cy + sy * (w // 3)),
            0,
            360,
            fill=color,
            width=max(2, w // 16),
        )
        draw.ellipse(
            normalize_box(cx + sx * (w + 5), cy + sy * (w // 2), cx + sx * (w + 18), cy + sy * (w // 2 + 13)),
            fill=color,
        )


def normalize_box(x1: int, y1: int, x2: int, y2: int) -> tuple[int, int, int, int]:
    return min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2)


def make_panel(
    size: tuple[int, int],
    fill: tuple[int, int, int, int] | None = None,
    outline: tuple[int, int, int, int] | None = None,
    radius: int = 34,
    border: int = 8,
    style: str = "paper",
    glow: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    w, h = size
    img = canvas(size)
    pad = max(16, border * 2)
    box = (pad, pad, w - pad - 1, h - pad - 1)
    fill = fill or rgba("paper")
    outline = outline or rgba("gold")
    add_shadow(img, box, radius, alpha=70, blur=18, offset=(0, max(5, h // 64)))

    if glow:
        glow_layer = canvas(size)
        gd = ImageDraw.Draw(glow_layer)
        gd.rounded_rectangle(box, radius=radius, outline=glow, width=border * 4)
        img.alpha_composite(glow_layer.filter(ImageFilter.GaussianBlur(border * 2)))

    mask = mask_round(size, box, radius)
    texture = texture_fill(size, fill, rgba("paper_shadow", 54) if style == "paper" else rgba("cyan", 32), 32)
    texture.putalpha(mask)
    img.alpha_composite(texture)

    draw = ImageDraw.Draw(img)
    for i in range(border):
        alpha = int(210 - i * 10)
        draw.rounded_rectangle(
            (box[0] + i, box[1] + i, box[2] - i, box[3] - i),
            radius=max(1, radius - i),
            outline=(outline[0], outline[1], outline[2], max(80, alpha)),
            width=1,
        )
    draw.rounded_rectangle(
        (box[0] + border + 5, box[1] + border + 5, box[2] - border - 5, box[3] - border - 5),
        radius=max(1, radius - border - 5),
        outline=rgba("gold_light", 95) if style == "paper" else rgba("cyan", 88),
        width=max(2, border // 3),
    )
    add_corner_flourish(draw, box, rgba("gold_dark", 145) if style == "paper" else rgba("cyan", 170), min(w, h) // 6)
    return img


def make_button(size: tuple[int, int], variant: str, family: str = "primary") -> Image.Image:
    palette = {
        "normal": ("gold", "paper_light", "gold_dark"),
        "pressed": ("gold_dark", "paper", "gold_light"),
        "disabled": ("disabled", "paper", "ink_soft"),
        "glow": ("gold_light", "paper_light", "gold"),
        "ready": ("jade", "paper_light", "teal"),
        "active": ("cyan", "paper_light", "teal"),
        "cooldown": ("ink_soft", "paper", "disabled"),
    }
    outer, inner, stroke = palette.get(variant, palette["normal"])
    if family == "secondary":
        outer, inner, stroke = ("teal", "paper", "gold") if variant != "disabled" else ("disabled", "paper", "ink_soft")
    glow = rgba("gold_light", 150) if variant in {"glow", "ready", "active"} else None
    img = make_panel(size, fill=rgba(inner, 235), outline=rgba(outer, 240), radius=size[1] // 4, border=max(5, size[1] // 20), glow=glow)
    draw = ImageDraw.Draw(img)
    w, h = size
    draw.line((w * 0.16, h * 0.54, w * 0.84, h * 0.54), fill=rgba(stroke, 80), width=max(2, h // 40))
    draw.ellipse((w * 0.08, h * 0.35, w * 0.14, h * 0.65), fill=rgba(stroke, 130))
    draw.ellipse((w * 0.86, h * 0.35, w * 0.92, h * 0.65), fill=rgba(stroke, 130))
    return img


def make_badge(size: tuple[int, int], color: str, symbol: str, state: str = "normal") -> Image.Image:
    img = canvas(size)
    w, h = size
    cx, cy = w // 2, h // 2
    r = min(w, h) // 2 - 18
    if state in {"active", "selected", "current", "new"}:
        add_glow(img, (cx, cy), [r + 24, r + 8], rgba(color, 120))
    draw = ImageDraw.Draw(img)
    points = []
    for i in range(12):
        angle = -math.pi / 2 + i * math.pi / 6
        rr = r if i % 2 == 0 else int(r * 0.82)
        points.append((cx + math.cos(angle) * rr, cy + math.sin(angle) * rr))
    draw.polygon(points, fill=rgba(color, 225), outline=rgba("gold_light", 220))
    draw.ellipse((cx - r * 0.68, cy - r * 0.68, cx + r * 0.68, cy + r * 0.68), fill=rgba("paper_light", 235), outline=rgba("gold_dark", 170), width=4)
    draw_symbol(draw, symbol, (int(cx - r * 0.48), int(cy - r * 0.48), int(cx + r * 0.48), int(cy + r * 0.48)), rgba("ink", 225), max(5, r // 9))
    return img


def add_glow(img: Image.Image, center: tuple[int, int], radii: list[int], color: tuple[int, int, int, int]) -> None:
    layer = canvas(img.size)
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    for idx, r in enumerate(sorted(radii, reverse=True)):
        a = max(8, int(color[3] / (idx + 1.7)))
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(color[0], color[1], color[2], a))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(max(8, max(radii) // 5))))


def draw_symbol(
    draw: ImageDraw.ImageDraw,
    kind: str,
    box: tuple[int, int, int, int],
    color: tuple[int, int, int, int],
    width: int = 8,
) -> None:
    x1, y1, x2, y2 = box
    w = x2 - x1
    h = y2 - y1
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    def p(px: float, py: float) -> tuple[float, float]:
        return x1 + px * w, y1 + py * h

    if kind in {"map", "scroll"}:
        draw.line([p(0.12, 0.25), p(0.34, 0.15), p(0.62, 0.28), p(0.88, 0.18)], fill=color, width=width)
        draw.line([p(0.12, 0.25), p(0.12, 0.82), p(0.35, 0.70), p(0.62, 0.84), p(0.88, 0.72), p(0.88, 0.18)], fill=color, width=width)
        draw.line([p(0.35, 0.15), p(0.35, 0.70)], fill=color, width=max(3, width - 2))
        draw.line([p(0.62, 0.28), p(0.62, 0.84)], fill=color, width=max(3, width - 2))
    elif kind == "training":
        draw.arc((x1 + w * 0.08, y1 + h * 0.28, x1 + w * 0.50, y1 + h * 0.88), 250, 105, fill=color, width=width)
        draw.arc((x1 + w * 0.50, y1 + h * 0.28, x1 + w * 0.92, y1 + h * 0.88), 75, 290, fill=color, width=width)
        draw.line([p(0.50, 0.28), p(0.50, 0.86)], fill=color, width=width)
        draw.ellipse((cx - w * 0.08, y1 + h * 0.08, cx + w * 0.08, y1 + h * 0.24), outline=color, width=width)
    elif kind == "battle":
        draw.line([p(0.18, 0.16), p(0.82, 0.84)], fill=color, width=width)
        draw.line([p(0.82, 0.16), p(0.18, 0.84)], fill=color, width=width)
        draw.line([p(0.28, 0.72), p(0.16, 0.90)], fill=color, width=width)
        draw.line([p(0.72, 0.72), p(0.84, 0.90)], fill=color, width=width)
        draw.polygon([p(0.10, 0.08), p(0.25, 0.17), p(0.16, 0.25)], fill=color)
        draw.polygon([p(0.90, 0.08), p(0.75, 0.17), p(0.84, 0.25)], fill=color)
    elif kind in {"mind", "flame"}:
        draw.pieslice((x1 + w * 0.24, y1 + h * 0.20, x1 + w * 0.76, y1 + h * 0.94), 190, -10, fill=color)
        draw.pieslice((x1 + w * 0.40, y1 + h * 0.05, x1 + w * 0.78, y1 + h * 0.70), 105, 285, fill=color)
        draw.ellipse((x1 + w * 0.38, y1 + h * 0.48, x1 + w * 0.62, y1 + h * 0.72), fill=(255, 255, 255, 150))
    elif kind == "roster":
        for px, py, rr in [(0.35, 0.34, 0.13), (0.65, 0.34, 0.13), (0.50, 0.52, 0.15)]:
            draw.ellipse((x1 + (px - rr) * w, y1 + (py - rr) * h, x1 + (px + rr) * w, y1 + (py + rr) * h), outline=color, width=width)
        draw.arc((x1 + w * 0.12, y1 + h * 0.54, x1 + w * 0.88, y1 + h * 1.10), 200, 340, fill=color, width=width)
    elif kind == "daily":
        draw.rounded_rectangle((x1 + w * 0.20, y1 + h * 0.12, x1 + w * 0.82, y1 + h * 0.88), radius=width, outline=color, width=width)
        for yy in [0.32, 0.52, 0.72]:
            draw.line([p(0.34, yy), p(0.72, yy)], fill=color, width=max(3, width - 2))
            draw.line([p(0.22, yy), p(0.28, yy + 0.05), p(0.34, yy - 0.07)], fill=color, width=max(3, width - 2))
    elif kind == "back":
        draw.line([p(0.70, 0.18), p(0.28, 0.50), p(0.70, 0.82)], fill=color, width=width)
    elif kind == "close":
        draw.line([p(0.22, 0.22), p(0.78, 0.78)], fill=color, width=width)
        draw.line([p(0.78, 0.22), p(0.22, 0.78)], fill=color, width=width)
    elif kind == "settings":
        draw.ellipse((x1 + w * 0.34, y1 + h * 0.34, x1 + w * 0.66, y1 + h * 0.66), outline=color, width=width)
        for i in range(8):
            a = i * math.pi / 4
            draw.line((cx + math.cos(a) * w * 0.22, cy + math.sin(a) * h * 0.22, cx + math.cos(a) * w * 0.42, cy + math.sin(a) * h * 0.42), fill=color, width=max(3, width - 2))
    elif kind == "mail":
        draw.rectangle((x1 + w * 0.14, y1 + h * 0.24, x1 + w * 0.86, y1 + h * 0.76), outline=color, width=width)
        draw.line([p(0.14, 0.25), p(0.50, 0.55), p(0.86, 0.25)], fill=color, width=width)
    elif kind == "exit":
        draw.rectangle((x1 + w * 0.18, y1 + h * 0.18, x1 + w * 0.56, y1 + h * 0.82), outline=color, width=width)
        draw.line([p(0.48, 0.50), p(0.86, 0.50), p(0.74, 0.36)], fill=color, width=width)
        draw.line([p(0.86, 0.50), p(0.74, 0.64)], fill=color, width=width)
    elif kind == "plus":
        draw.line([p(0.50, 0.18), p(0.50, 0.82)], fill=color, width=width)
        draw.line([p(0.18, 0.50), p(0.82, 0.50)], fill=color, width=width)
    elif kind == "help":
        draw.arc((x1 + w * 0.28, y1 + h * 0.16, x1 + w * 0.72, y1 + h * 0.55), 190, 25, fill=color, width=width)
        draw.line([p(0.56, 0.52), p(0.48, 0.64)], fill=color, width=width)
        draw.ellipse((x1 + w * 0.45, y1 + h * 0.75, x1 + w * 0.55, y1 + h * 0.85), fill=color)
    elif kind == "refresh":
        draw.arc((x1 + w * 0.20, y1 + h * 0.20, x1 + w * 0.80, y1 + h * 0.80), 30, 330, fill=color, width=width)
        draw.line([p(0.78, 0.22), p(0.78, 0.42), p(0.93, 0.32)], fill=color, width=width)
    elif kind == "law":
        draw.line([p(0.50, 0.15), p(0.50, 0.82)], fill=color, width=width)
        draw.line([p(0.25, 0.28), p(0.75, 0.28)], fill=color, width=width)
        for px in [0.28, 0.72]:
            draw.line([p(px, 0.28), p(px - 0.12, 0.55), p(px + 0.12, 0.55), p(px, 0.28)], fill=color, width=max(3, width - 2))
        draw.line([p(0.34, 0.85), p(0.66, 0.85)], fill=color, width=width)
    elif kind == "psychology":
        pts = []
        for i in range(54):
            t = i / 8
            r = 0.04 + i * 0.006
            pts.append((cx + math.cos(t) * r * w, cy + math.sin(t) * r * h))
        draw.line(pts, fill=color, width=width)
    elif kind == "design":
        draw.arc((x1 + w * 0.20, y1 + h * 0.20, x1 + w * 0.80, y1 + h * 0.80), 205, 335, fill=color, width=width)
        draw.line([p(0.50, 0.18), p(0.22, 0.84)], fill=color, width=width)
        draw.line([p(0.50, 0.18), p(0.78, 0.84)], fill=color, width=width)
    elif kind == "ethics":
        draw.polygon([p(0.50, 0.12), p(0.82, 0.26), p(0.76, 0.66), p(0.50, 0.90), p(0.24, 0.66), p(0.18, 0.26)], outline=color, fill=None)
        draw.line([p(0.34, 0.52), p(0.46, 0.66), p(0.70, 0.38)], fill=color, width=width)
    elif kind == "classroom":
        draw.rectangle((x1 + w * 0.14, y1 + h * 0.20, x1 + w * 0.86, y1 + h * 0.68), outline=color, width=width)
        draw.line([p(0.30, 0.84), p(0.50, 0.68), p(0.70, 0.84)], fill=color, width=width)
    elif kind == "child":
        pts = []
        for i in range(5):
            a = -math.pi / 2 + i * 2 * math.pi / 5
            pts.append((cx + math.cos(a) * w * 0.34, cy + math.sin(a) * h * 0.34))
            a2 = a + math.pi / 5
            pts.append((cx + math.cos(a2) * w * 0.14, cy + math.sin(a2) * h * 0.14))
        draw.polygon(pts, outline=color, fill=None)
    elif kind == "target":
        for r in [0.34, 0.23, 0.10]:
            draw.ellipse((cx - w * r, cy - h * r, cx + w * r, cy + h * r), outline=color, width=width)
    elif kind == "eye":
        draw.arc((x1 + w * 0.12, y1 + h * 0.28, x1 + w * 0.88, y1 + h * 0.72), 180, 360, fill=color, width=width)
        draw.arc((x1 + w * 0.12, y1 + h * 0.28, x1 + w * 0.88, y1 + h * 0.72), 0, 180, fill=color, width=width)
        draw.ellipse((cx - w * 0.09, cy - h * 0.09, cx + w * 0.09, cy + h * 0.09), fill=color)
    elif kind == "heart":
        draw.pieslice((x1 + w * 0.22, y1 + h * 0.20, x1 + w * 0.54, y1 + h * 0.55), 180, 360, fill=color)
        draw.pieslice((x1 + w * 0.46, y1 + h * 0.20, x1 + w * 0.78, y1 + h * 0.55), 180, 360, fill=color)
        draw.polygon([p(0.22, 0.40), p(0.78, 0.40), p(0.50, 0.86)], fill=color)
    elif kind == "shield":
        draw.polygon([p(0.50, 0.10), p(0.84, 0.24), p(0.76, 0.70), p(0.50, 0.92), p(0.24, 0.70), p(0.16, 0.24)], fill=color)
    elif kind == "star":
        pts = []
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5
            rr = 0.36 if i % 2 == 0 else 0.16
            pts.append((cx + math.cos(a) * w * rr, cy + math.sin(a) * h * rr))
        draw.polygon(pts, fill=color)
    elif kind == "mountain":
        draw.line([p(0.12, 0.82), p(0.38, 0.36), p(0.50, 0.56), p(0.68, 0.24), p(0.90, 0.82)], fill=color, width=width)
    elif kind == "rotate":
        draw.arc((x1 + w * 0.20, y1 + h * 0.22, x1 + w * 0.80, y1 + h * 0.82), 20, 290, fill=color, width=width)
        draw.line([p(0.26, 0.28), p(0.20, 0.50), p(0.42, 0.45)], fill=color, width=width)
    elif kind == "chest":
        draw.rectangle((x1 + w * 0.18, y1 + h * 0.40, x1 + w * 0.82, y1 + h * 0.80), outline=color, width=width)
        draw.arc((x1 + w * 0.18, y1 + h * 0.18, x1 + w * 0.82, y1 + h * 0.62), 180, 360, fill=color, width=width)
        draw.rectangle((x1 + w * 0.44, y1 + h * 0.48, x1 + w * 0.56, y1 + h * 0.62), outline=color, width=max(3, width - 2))
    else:
        draw.ellipse((x1 + w * 0.22, y1 + h * 0.22, x1 + w * 0.78, y1 + h * 0.78), outline=color, width=width)


def make_icon(kind: str, accent: str = "gold", bg: str = "paper_light") -> Image.Image:
    img = canvas((256, 256))
    add_glow(img, (128, 128), [102, 78], rgba(accent, 70))
    draw = ImageDraw.Draw(img)
    draw.ellipse((28, 28, 228, 228), fill=rgba(bg, 225), outline=rgba(accent, 230), width=8)
    draw.ellipse((46, 46, 210, 210), outline=rgba("gold_light", 125), width=4)
    draw_symbol(draw, kind, (62, 62, 194, 194), rgba("ink", 230), 12)
    return img


def make_option_card(size: tuple[int, int], state: str, dark: bool = False) -> Image.Image:
    palette = {
        "normal": ("paper", "gold"),
        "selected": ("paper_light", "jade"),
        "correct": ("paper_light", "green"),
        "wrong": ("paper", "red"),
        "disabled": ("paper", "disabled"),
    }
    fill_name, outline_name = palette[state]
    style = "dark" if dark else "paper"
    fill = rgba("dark_2", 214) if dark else rgba(fill_name, 236)
    outline = rgba(outline_name, 236)
    glow = rgba(outline_name, 120) if state in {"selected", "correct", "wrong"} else None
    img = make_panel(size, fill=fill, outline=outline, radius=size[1] // 5, border=max(5, size[1] // 24), style=style, glow=glow)
    draw = ImageDraw.Draw(img)
    w, h = size
    draw.ellipse((w * 0.06, h * 0.30, w * 0.16, h * 0.70), fill=outline)
    draw.line((w * 0.22, h * 0.50, w * 0.90, h * 0.50), fill=rgba("ink", 60) if not dark else rgba("cyan", 55), width=max(2, h // 26))
    return img


def make_route_segment(kind: str) -> Image.Image:
    img = canvas((512, 160))
    draw = ImageDraw.Draw(img)
    color = rgba("gold_light", 210)
    shadow = rgba("teal", 90)
    if kind == "straight":
        pts = [(40, 80), (472, 80)]
    elif kind == "curve":
        pts = [(40, 118), (160, 30), (330, 130), (472, 48)]
    elif kind == "bridge":
        pts = [(50, 110), (160, 48), (250, 50), (350, 50), (462, 110)]
    elif kind == "dashed":
        for x in range(42, 448, 72):
            draw.line((x, 80, x + 44, 80), fill=shadow, width=18)
            draw.line((x, 80, x + 44, 80), fill=color, width=10)
        return img
    elif kind == "glow":
        pts = [(40, 80), (472, 80)]
        draw.line(pts, fill=rgba("cyan", 80), width=34, joint="curve")
    else:
        pts = [(40, 80), (170, 80), (240, 80), (340, 80), (472, 80)]
        draw.line((172, 80, 236, 80), fill=rgba("red", 90), width=20)
    draw.line(pts, fill=shadow, width=22, joint="curve")
    draw.line(pts, fill=color, width=10, joint="curve")
    for x, y in [pts[0], pts[-1]]:
        draw.ellipse((x - 15, y - 15, x + 15, y + 15), fill=rgba("paper_light", 230), outline=rgba("gold", 220), width=4)
    return img


def make_portal(theme: str, color: str, symbol: str) -> Image.Image:
    img = canvas((1024, 1280))
    draw = ImageDraw.Draw(img)
    add_glow(img, (512, 610), [430, 320, 220], rgba(color, 120))
    # Energy core.
    core = canvas(img.size)
    cd = ImageDraw.Draw(core)
    cd.ellipse((240, 210, 784, 910), fill=rgba(color, 72), outline=rgba("gold_light", 170), width=12)
    cd.ellipse((306, 285, 718, 860), fill=rgba("paper_light", 72), outline=rgba(color, 190), width=10)
    img.alpha_composite(core.filter(ImageFilter.GaussianBlur(2)))
    # Gate arch and pillars.
    draw.arc((160, 120, 864, 980), 180, 360, fill=rgba("gold", 245), width=44)
    draw.arc((218, 190, 806, 955), 180, 360, fill=rgba("paper_light", 185), width=18)
    for x in [210, 724]:
        draw.rounded_rectangle((x, 520, x + 92, 1035), radius=34, fill=rgba("paper", 235), outline=rgba("gold_dark", 220), width=12)
        draw.rounded_rectangle((x - 28, 470, x + 120, 560), radius=24, fill=rgba("gold", 230), outline=rgba("gold_light", 235), width=8)
    draw.rounded_rectangle((260, 990, 764, 1106), radius=38, fill=rgba("paper", 240), outline=rgba("gold_dark", 230), width=12)
    draw.rounded_rectangle((310, 1048, 714, 1150), radius=34, fill=rgba("gold", 235), outline=rgba("gold_light", 220), width=8)
    draw_symbol(draw, symbol, (412, 462, 612, 662), rgba("ink", 215), 18)
    for i in range(34):
        a = random.random() * math.tau
        r = random.randint(160, 410)
        x = int(512 + math.cos(a) * r)
        y = int(590 + math.sin(a) * r * 0.9)
        rr = random.randint(4, 12)
        draw.ellipse((x - rr, y - rr, x + rr, y + rr), fill=rgba(color, random.randint(70, 160)))
    return img


def make_portal_overlay(state: str) -> Image.Image:
    img = canvas((1024, 1280))
    draw = ImageDraw.Draw(img)
    if state == "locked":
        draw.rectangle((0, 0, 1024, 1280), fill=(24, 28, 31, 78))
        draw.line((340, 600, 684, 600), fill=rgba("disabled", 210), width=36)
        draw.arc((400, 430, 624, 680), 180, 360, fill=rgba("disabled", 230), width=32)
    elif state == "available":
        add_glow(img, (512, 650), [420, 300], rgba("gold_light", 130))
    elif state == "current":
        add_glow(img, (512, 650), [470, 350, 220], rgba("cyan", 170))
        draw.polygon([(512, 145), (570, 250), (512, 220), (454, 250)], fill=rgba("cyan", 220))
    elif state == "cleared":
        draw.ellipse((380, 500, 644, 764), fill=rgba("green", 210), outline=rgba("gold_light", 230), width=16)
        draw.line((430, 632, 500, 704, 610, 560), fill=rgba("paper_light", 245), width=36)
    return img


def make_fx(kind: str, color: str = "gold") -> Image.Image:
    img = canvas((512, 512))
    draw = ImageDraw.Draw(img)
    if kind in {"ring", "purify-ring", "selection"}:
        add_glow(img, (256, 256), [220, 150], rgba(color, 140))
        for r, a, w in [(190, 210, 12), (135, 150, 8), (82, 100, 5)]:
            draw.ellipse((256 - r, 256 - r, 256 + r, 256 + r), outline=rgba(color, a), width=w)
    elif kind in {"starburst", "reward", "upgrade"}:
        add_glow(img, (256, 256), [180, 120], rgba(color, 130))
        for i in range(24):
            a = i * math.tau / 24
            r1 = 32 + (i % 3) * 8
            r2 = 180 + (i % 5) * 12
            draw.line((256 + math.cos(a) * r1, 256 + math.sin(a) * r1, 256 + math.cos(a) * r2, 256 + math.sin(a) * r2), fill=rgba(color, 160), width=5)
        draw.ellipse((210, 210, 302, 302), fill=rgba("paper_light", 210))
    elif kind in {"ink", "wrong", "lock"}:
        for i in range(30):
            x = random.randint(105, 407)
            y = random.randint(105, 407)
            r = random.randint(18, 64)
            draw.ellipse((x - r, y - r, x + r, y + r), fill=rgba(color, random.randint(70, 170)))
        for i in range(10):
            draw.line((random.randint(80, 430), random.randint(90, 430), random.randint(80, 430), random.randint(90, 430)), fill=rgba(color, 160), width=random.randint(6, 16))
        img = img.filter(ImageFilter.GaussianBlur(1))
    elif kind == "spinner":
        for i in range(12):
            a = i * math.tau / 12
            alpha = int(35 + i * 18)
            draw.line((256 + math.cos(a) * 85, 256 + math.sin(a) * 85, 256 + math.cos(a) * 150, 256 + math.sin(a) * 150), fill=rgba(color, alpha), width=16)
    else:
        add_glow(img, (256, 256), [170, 110], rgba(color, 110))
        draw.ellipse((120, 120, 392, 392), outline=rgba(color, 180), width=20)
    return img


def make_ring_asset(size: tuple[int, int], color: str, variant: str) -> Image.Image:
    img = canvas(size)
    w, h = size
    r = min(w, h) // 2 - 28
    cx, cy = w // 2, h // 2
    draw = ImageDraw.Draw(img)
    if variant == "track":
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=rgba("ink_soft", 92), width=max(12, r // 8))
    elif variant == "fill":
        draw.arc((cx - r, cy - r, cx + r, cy + r), -90, 230, fill=rgba(color, 230), width=max(14, r // 7))
        add_glow(img, (cx, cy), [r + 28], rgba(color, 70))
    else:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=rgba("gold_light", 210), width=max(8, r // 12))
        draw.arc((cx - r, cy - r, cx + r, cy + r), -80, 20, fill=rgba("paper_light", 240), width=max(8, r // 12))
    return img


def make_status_overlay(kind: str, size: tuple[int, int] = (512, 512)) -> Image.Image:
    img = canvas(size)
    w, h = size
    draw = ImageDraw.Draw(img)
    if kind == "active-glow":
        add_glow(img, (w // 2, h // 2), [min(w, h) // 2 - 20, min(w, h) // 3], rgba("cyan", 150))
    elif kind == "inactive-wash":
        draw.rounded_rectangle((20, 20, w - 20, h - 20), radius=42, fill=(20, 24, 28, 84))
    elif kind == "notice-dot":
        draw.ellipse((w * 0.56, h * 0.12, w * 0.88, h * 0.44), fill=rgba("red", 235), outline=rgba("paper_light", 235), width=8)
    elif kind == "locked-overlay":
        draw.rounded_rectangle((24, 24, w - 24, h - 24), radius=40, fill=(22, 24, 28, 100))
        draw.line((w * 0.32, h * 0.55, w * 0.68, h * 0.55), fill=rgba("gold_light", 210), width=max(12, w // 25))
        draw.arc((w * 0.38, h * 0.34, w * 0.62, h * 0.62), 180, 360, fill=rgba("gold_light", 220), width=max(10, w // 28))
    elif kind == "check":
        draw.ellipse((w * 0.16, h * 0.16, w * 0.84, h * 0.84), fill=rgba("green", 215), outline=rgba("paper_light", 230), width=8)
        draw.line((w * 0.30, h * 0.52, w * 0.45, h * 0.68, w * 0.72, h * 0.36), fill=rgba("paper_light", 245), width=22)
    return img


def generate_global_ui() -> None:
    save_asset("ui.shell.top-hud-frame", "ui/shell", "top-hud-frame.png", make_panel((1920, 220), radius=48, border=10), "P0", "top HUD frame")
    save_asset("ui.shell.avatar-chip-frame", "ui/shell", "avatar-chip-frame.png", make_panel((520, 160), radius=56, border=8), "P0", "player avatar chip")
    save_asset("ui.shell.resource-chip-frame", "ui/shell", "resource-chip-frame.png", make_panel((360, 116), radius=50, border=6), "P0", "resource value chip")
    for name, color in [("track", "ink_soft"), ("fill-gold", "gold"), ("fill-jade", "jade"), ("endcap", "paper_light")]:
        img = canvas((720, 92))
        draw = ImageDraw.Draw(img)
        if name == "track":
            draw.rounded_rectangle((18, 26, 702, 66), radius=20, fill=rgba("ink_soft", 110), outline=rgba("gold_dark", 160), width=4)
        elif name == "endcap":
            draw.ellipse((12, 12, 80, 80), fill=rgba(color, 230), outline=rgba("gold", 220), width=5)
            draw.ellipse((640, 12, 708, 80), fill=rgba(color, 230), outline=rgba("gold", 220), width=5)
        else:
            draw.rounded_rectangle((18, 28, 702, 64), radius=18, fill=rgba(color, 220))
            draw.rounded_rectangle((28, 34, 692, 44), radius=5, fill=rgba("paper_light", 80))
        save_asset(f"ui.shell.progress-bar.{name}", "ui/shell", f"progress-bar-{name}.png", img, "P0", "progress bar part")

    save_asset("ui.shell.bottom-nav-frame", "ui/nav", "bottom-nav-frame.png", make_panel((1400, 210), fill=rgba("dark_2", 222), outline=rgba("gold", 230), radius=58, border=8, style="dark", glow=rgba("cyan", 60)), "P0", "bottom navigation base")
    for kind, color in [
        ("map", "jade"),
        ("training", "gold"),
        ("battle", "red"),
        ("mind", "violet"),
        ("roster", "blue"),
        ("daily", "green"),
    ]:
        save_asset(f"ui.nav.icon-{kind}", "ui/nav/icons", f"icon-{kind}.png", make_icon(kind, color), "P0", "navigation icon")
    for state in ["active-glow", "inactive-wash", "notice-dot", "locked-overlay"]:
        save_asset(f"ui.nav.state.{state}", "ui/nav/states", f"{state}.png", make_status_overlay(state), "P0", "navigation state overlay")

    for kind in ["back", "close", "settings", "mail", "exit", "plus", "help", "refresh"]:
        save_asset(f"ui.icon.system-actions.{kind}", "ui/icons/system", f"{kind}.png", make_icon(kind, "gold"), "P0", "system action icon")

    for name, size in [("large", (1280, 860)), ("medium", (900, 560)), ("small", (560, 320)), ("modal-report", (1080, 1180))]:
        save_asset(f"ui.panel.parchment.{name}", "ui/panels/parchment", f"{name}.png", make_panel(size), "P0", "parchment panel")
    for name, size in [("large", (980, 700)), ("compact", (620, 300))]:
        save_asset(f"ui.panel.dark-glass.{name}", "ui/panels/dark-glass", f"{name}.png", make_panel(size, fill=rgba("dark_2", 220), outline=rgba("cyan", 210), radius=36, border=7, style="dark", glow=rgba("cyan", 55)), "P0", "dark glass panel")
    for name, size in [("wide", (720, 176)), ("compact", (420, 136))]:
        save_asset(f"ui.panel.title-plaque.{name}", "ui/panels/title-plaque", f"{name}.png", make_button(size, "glow", "secondary"), "P0", "title plaque")

    for state in ["normal", "pressed", "disabled", "glow"]:
        save_asset(f"ui.button.primary.{state}", "ui/buttons/primary", f"{state}.png", make_button((768, 192), state, "primary"), "P0", "primary button state")
    for state in ["normal", "pressed", "disabled"]:
        save_asset(f"ui.button.secondary.{state}", "ui/buttons/secondary", f"{state}.png", make_button((640, 168), state, "secondary"), "P0", "secondary button state")
    for state in ["normal", "selected", "correct", "wrong", "disabled"]:
        save_asset(f"ui.choice.option-card.{state}", "ui/choice", f"option-card-{state}.png", make_option_card((920, 180), state), "P0", "choice option state")
    badge_defs = [
        ("current", "cyan", "star"),
        ("completed", "green", "check"),
        ("locked", "disabled", "shield"),
        ("reward", "gold", "chest"),
        ("new", "red", "star"),
        ("elite", "violet", "battle"),
        ("danger", "red", "flame"),
        ("recommended", "jade", "map"),
    ]
    for name, color, symbol in badge_defs:
        save_asset(f"ui.badge.common-states.{name}", "ui/badges", f"{name}.png", make_badge((256, 256), color, symbol, name), "P0", "common state badge")
    for i, kind in enumerate(["corner-a", "corner-b", "divider-short", "divider-long", "cloud-left", "cloud-right", "ink-line", "dot-chain"]):
        img = canvas((512, 128))
        draw = ImageDraw.Draw(img)
        if "corner" in kind:
            add_corner_flourish(draw, (34, 34, 478, 94), rgba("gold", 220), 76)
        elif "divider" in kind:
            draw.line((42, 64, 470 if "long" in kind else 320, 64), fill=rgba("gold", 210), width=8)
            draw.ellipse((32, 54, 52, 74), fill=rgba("gold_light", 220))
        elif "cloud" in kind:
            for x in range(70, 430, 80):
                draw.arc((x - 60, 28, x + 60, 100), 180, 360, fill=rgba("jade", 190), width=6)
        elif "ink" in kind:
            draw.line((38, 70, 470, 54), fill=rgba("ink", 160), width=7)
            draw.line((42, 77, 460, 62), fill=rgba("ink", 70), width=3)
        else:
            for x in range(50, 470, 52):
                draw.ellipse((x - 7, 57, x + 7, 71), fill=rgba("gold", 180))
        save_asset(f"ui.decor.corners-dividers.{kind}", "ui/decor", f"{kind}.png", img, "P0", "corner or divider decoration")


def generate_map() -> None:
    themes = [
        ("law", "gold", "law"),
        ("psychology", "violet", "psychology"),
        ("design", "blue", "design"),
        ("ethics", "green", "ethics"),
        ("classroom", "jade", "classroom"),
        ("child", "red", "child"),
    ]
    for theme, color, symbol in themes:
        save_asset(f"map.chapter-portal.{theme}", "map/portals", f"chapter-portal-{theme}.png", make_portal(theme, color, symbol), "P0", "chapter portal")
    for state in ["locked", "available", "current", "cleared"]:
        save_asset(f"map.chapter-portal.state-overlays.{state}", "map/portal-states", f"{state}.png", make_portal_overlay(state), "P0", "chapter portal state overlay")
    for kind in ["straight", "curve", "bridge", "dashed", "glow", "broken"]:
        save_asset(f"map.route-path-segments.{kind}", "map/routes", f"{kind}.png", make_route_segment(kind), "P0", "map route segment")
    marker = make_badge((320, 320), "cyan", "map", "current")
    save_asset("map.current-marker", "map", "current-marker.png", marker, "P0", "current map marker")
    save_asset("map.chapter-label-plaque", "map", "chapter-label-plaque.png", make_button((560, 150), "normal", "secondary"), "P0", "chapter label plaque")
    save_asset("map.fortune-card-frame", "map", "fortune-card-frame.png", make_panel((520, 680), radius=40, border=8), "P0", "daily fortune card")
    save_asset("map.quest-tracker-frame", "map", "quest-tracker-frame.png", make_panel((720, 420), radius=36, border=8), "P0", "map quest tracker")
    ribbon = canvas((720, 170))
    draw = ImageDraw.Draw(ribbon)
    draw.polygon([(50, 34), (670, 34), (620, 85), (670, 136), (50, 136), (100, 85)], fill=rgba("gold", 225), outline=rgba("gold_dark", 230))
    draw.rounded_rectangle((110, 52, 610, 118), radius=28, fill=rgba("paper_light", 230), outline=rgba("gold_light", 210), width=5)
    save_asset("map.progress-ribbon", "map", "progress-ribbon.png", ribbon, "P0", "map progress ribbon")


def generate_story() -> None:
    save_asset("story.dialogue-dock-frame", "story", "dialogue-dock-frame.png", make_panel((1500, 420), radius=42, border=9), "P0", "story dialogue dock")
    save_asset("story.speaker-nameplate", "story", "speaker-nameplate.png", make_button((420, 120), "normal", "secondary"), "P0", "speaker nameplate")
    ring = canvas((300, 300))
    draw = ImageDraw.Draw(ring)
    add_glow(ring, (150, 150), [132, 102], rgba("gold_light", 80))
    draw.ellipse((38, 38, 262, 262), fill=rgba("paper_light", 225), outline=rgba("gold", 230), width=16)
    draw.ellipse((66, 66, 234, 234), outline=rgba("gold_dark", 150), width=6)
    save_asset("story.avatar-ring", "story", "avatar-ring.png", ring, "P0", "story avatar ring")
    save_asset("story.choice-stack-frame", "story", "choice-stack-frame.png", make_panel((980, 560), radius=36, border=8), "P0", "story choice stack frame")
    for name in ["dot", "dot-read", "line"]:
        img = canvas((180, 80))
        draw = ImageDraw.Draw(img)
        if name == "line":
            draw.line((18, 40, 162, 40), fill=rgba("gold", 210), width=8)
        else:
            color = "green" if name.endswith("read") else "gold"
            draw.ellipse((58, 18, 122, 62), fill=rgba(color, 220), outline=rgba("paper_light", 230), width=5)
        save_asset(f"story.progress-step.{name}", "story/progress", f"{name}.png", img, "P0", "story progress step")
    for kind in ["skip", "auto", "backlog"]:
        icon_kind = "exit" if kind == "skip" else "refresh" if kind == "auto" else "scroll"
        save_asset(f"story.skip-auto-icons.{kind}", "story/icons", f"{kind}.png", make_icon(icon_kind, "jade"), "P0", "story control icon")


def generate_training() -> None:
    save_asset("training.lesson-board-frame", "training", "lesson-board-frame.png", make_panel((1120, 760), radius=40, border=9), "P0", "training lesson board")
    for state in ["normal", "active", "completed"]:
        variant = "normal" if state == "normal" else "glow" if state == "active" else "ready"
        save_asset(f"training.lesson-card-frame.{state}", "training/lesson-cards", f"{state}.png", make_button((760, 160), variant, "secondary"), "P0", "training lesson card")
    topics = [("law", "gold"), ("psychology", "violet"), ("design", "blue"), ("ethics", "green"), ("classroom", "jade"), ("child", "red")]
    for kind, color in topics:
        save_asset(f"training.topic-badges.{kind}", "training/topic-badges", f"{kind}.png", make_badge((256, 256), color, kind), "P0", "training topic badge")
    methods = [("memory", "scroll", "gold"), ("understand", "star", "jade"), ("practice", "target", "red"), ("review", "rotate", "blue"), ("focus", "eye", "violet"), ("breakthrough", "mountain", "green")]
    for name, symbol, color in methods:
        save_asset(f"training.method-icons.{name}", "training/method-icons", f"{name}.png", make_icon(symbol, color), "P0", "training method icon")
    for state, color, symbol in [("normal", "gold", "star"), ("current", "cyan", "map"), ("done", "green", "check"), ("locked", "disabled", "shield")]:
        save_asset(f"training.route-pip.{state}", "training/route-pips", f"{state}.png", make_badge((180, 180), color, symbol, state), "P0", "training route pip")
    save_asset("training.exp-reward-slot", "training", "exp-reward-slot.png", make_panel((320, 320), radius=42, border=7), "P0", "training reward slot")
    for state, color in [("passed", "green"), ("perfect", "gold")]:
        save_asset(f"training.practice-seal.{state}", "training/practice-seal", f"{state}.png", make_badge((300, 300), color, "star", "completed"), "P0", "training completion seal")
    save_asset("training.start-cta-emblem", "training", "start-cta-emblem.png", make_badge((260, 260), "jade", "training", "active"), "P0", "training start CTA emblem")


def generate_battle() -> None:
    save_asset("battle.enemy-hp-frame", "battle", "enemy-hp-frame.png", make_panel((860, 190), fill=rgba("dark_2", 222), outline=rgba("red", 230), radius=46, border=8, style="dark", glow=rgba("red", 70)), "P0", "enemy HP frame")
    save_asset("battle.player-status-frame", "battle", "player-status-frame.png", make_panel((620, 240), fill=rgba("dark_2", 216), outline=rgba("gold", 220), radius=40, border=7, style="dark"), "P0", "player battle status frame")
    save_asset("battle.question-panel-frame", "battle", "question-panel-frame.png", make_panel((1120, 520), radius=42, border=9), "P0", "battle question panel")
    for state in ["normal", "selected", "correct", "wrong", "disabled"]:
        save_asset(f"battle.answer-option-rune.{state}", "battle/answer-options", f"{state}.png", make_option_card((880, 160), state, dark=True), "P0", "battle answer option rune")
    for name, symbol, color in [("steady", "shield", "jade"), ("assault", "battle", "red"), ("observe", "eye", "blue")]:
        save_asset(f"battle.stance-icons.{name}", "battle/stance-icons", f"{name}.png", make_icon(symbol, color), "P0", "battle stance icon")
    for state in ["normal", "active", "disabled"]:
        variant = "normal" if state == "normal" else "active" if state == "active" else "disabled"
        save_asset(f"battle.stance-button-frame.{state}", "battle/stance-buttons", f"{state}.png", make_button((420, 150), variant, "secondary"), "P0", "battle stance button frame")
    for state, color in [("ready", "cyan"), ("cooldown", "disabled")]:
        save_asset(f"battle.release-sigil-button.{state}", "battle/release-sigil", f"{state}.png", make_badge((360, 360), color, "flame", "active"), "P0", "release sigil button")
    save_asset("battle.reward-condition-card", "battle", "reward-condition-card.png", make_panel((520, 420), radius=38, border=8), "P0", "battle reward condition card")
    for kind, color in [("hit", "gold"), ("critical", "red"), ("purify", "cyan")]:
        save_asset(f"battle.hit-fx.{kind}", "battle/fx/hit", f"{kind}.png", make_fx("starburst", color), "P0", "battle hit effect")
    for kind, color in [("ink-break", "ink"), ("dark-shock", "red")]:
        save_asset(f"battle.wrong-fx.{kind}", "battle/fx/wrong", f"{kind}.png", make_fx("ink", color), "P0", "battle wrong effect")
    save_asset("battle.combo-badge", "battle", "combo-badge.png", make_badge((300, 300), "red", "star", "active"), "P0", "battle combo badge")
    for state, color in [("damage", "red"), ("penalty", "violet")]:
        save_asset(f"battle.damage-number-style.{state}", "battle", f"damage-number-{state}.png", make_button((380, 128), "glow" if state == "damage" else "pressed", "primary"), "P0", "battle damage number backing")


def generate_mind_demon() -> None:
    for state in ["normal", "selected", "cleared"]:
        variant = "normal" if state == "normal" else "active" if state == "selected" else "ready"
        save_asset(f"mind-demon.list-item-frame.{state}", "mind-demon/list-items", f"{state}.png", make_button((560, 148), variant, "secondary"), "P0", "mind demon list item")
    for variant, color in [("track", "ink_soft"), ("fill", "violet"), ("danger-glow", "red")]:
        save_asset(f"mind-demon.pressure-gauge.{variant}", "mind-demon/pressure-gauge", f"{variant}.png", make_ring_asset((360, 360), color, "highlight" if "glow" in variant else variant), "P0", "mind demon pressure gauge")
    save_asset("mind-demon.contract-panel", "mind-demon", "contract-panel.png", make_panel((980, 620), fill=rgba("dark_2", 218), outline=rgba("violet", 220), radius=42, border=8, style="dark", glow=rgba("violet", 68)), "P0", "purification contract panel")
    for state in ["normal", "selected", "correct", "wrong", "disabled"]:
        save_asset(f"mind-demon.answer-card.{state}", "mind-demon/answer-cards", f"{state}.png", make_option_card((820, 170), state, dark=True), "P0", "mind demon answer card")
    save_asset("mind-demon.xiaomo-advice-frame", "mind-demon", "xiaomo-advice-frame.png", make_panel((960, 260), radius=38, border=8), "P0", "Xiaomo advice frame")
    for state in ["ready", "disabled"]:
        save_asset(f"mind-demon.purify-button-sigil.{state}", "mind-demon/purify-button", f"{state}.png", make_badge((340, 340), "cyan" if state == "ready" else "disabled", "mind", "active"), "P0", "purify button sigil")
    for kind, color in [("halo", "cyan"), ("ink-shatter", "ink"), ("seal-light", "gold")]:
        save_asset(f"mind-demon.purify-fx.{kind}", "mind-demon/fx/purify", f"{kind}.png", make_fx("purify-ring" if kind != "ink-shatter" else "ink", color), "P0", "purification success effect")
    for level, alpha in [("light", 55), ("heavy", 105)]:
        img = canvas((1024, 768))
        draw = ImageDraw.Draw(img)
        for i in range(36 if level == "heavy" else 18):
            x = random.randint(0, 1024)
            y = random.randint(0, 768)
            r = random.randint(50, 180)
            draw.ellipse((x - r, y - r, x + r, y + r), fill=rgba("violet", alpha))
        save_asset(f"mind-demon.corruption-overlay.{level}", "mind-demon/overlays", f"{level}.png", img.filter(ImageFilter.GaussianBlur(18)), "P0", "corruption overlay")


def generate_report_daily_roster() -> None:
    save_asset("report.paper-frame", "report", "paper-frame.png", make_panel((1120, 1340), radius=46, border=10), "P0", "report paper frame")
    save_asset("report.result-title-plaque", "report", "result-title-plaque.png", make_button((700, 160), "glow", "secondary"), "P0", "report result title plaque")
    for variant in ["track", "fill", "highlight"]:
        save_asset(f"report.score-ring.{variant}", "report/score-ring", f"{variant}.png", make_ring_asset((380, 380), "gold", variant), "P0", "report score ring")
    radar = canvas((520, 520))
    draw = ImageDraw.Draw(radar)
    for r in [80, 145, 210]:
        pts = []
        for i in range(6):
            a = -math.pi / 2 + i * math.tau / 6
            pts.append((260 + math.cos(a) * r, 260 + math.sin(a) * r))
        draw.polygon(pts, outline=rgba("gold", 150))
    for i in range(6):
        a = -math.pi / 2 + i * math.tau / 6
        draw.line((260, 260, 260 + math.cos(a) * 230, 260 + math.sin(a) * 230), fill=rgba("gold", 105), width=3)
    save_asset("report.radar-chart-frame", "report", "radar-chart-frame.png", radar, "P0", "report radar chart frame")
    for state in ["normal", "highlight"]:
        save_asset(f"report.reward-slot.{state}", "report/reward-slots", f"{state}.png", make_panel((300, 300), radius=40, border=7, glow=rgba("gold_light", 90) if state == "highlight" else None), "P0", "report reward slot")
    save_asset("report.next-route-card", "report", "next-route-card.png", make_panel((620, 360), radius=36, border=8), "P0", "next route card")
    for state, color in [("passed", "green"), ("excellent", "gold"), ("review", "red")]:
        save_asset(f"report.stamp-seal.{state}", "report/stamps", f"{state}.png", make_badge((320, 320), color, "star" if state != "review" else "rotate", "completed"), "P0", "report stamp seal")
    save_asset("report.companion-comment-frame", "report", "companion-comment-frame.png", make_panel((780, 260), radius=40, border=8), "P0", "report companion comment frame")

    save_asset("daily.board-frame", "daily", "board-frame.png", make_panel((980, 940), radius=44, border=9), "P0", "daily board frame")
    for state in ["normal", "active", "done", "locked"]:
        variant = "normal" if state == "normal" else "active" if state == "active" else "ready" if state == "done" else "disabled"
        save_asset(f"daily.task-row-frame.{state}", "daily/task-rows", f"{state}.png", make_button((820, 150), variant, "secondary"), "P0", "daily task row frame")
    for variant in ["track", "fill", "highlight"]:
        save_asset(f"daily.progress-ring.{variant}", "daily/progress-ring", f"{variant}.png", make_ring_asset((300, 300), "jade", variant), "P0", "daily progress ring")
    save_asset("daily.weekly-trial-board", "daily", "weekly-trial-board.png", make_panel((820, 500), radius=40, border=8), "P0", "weekly trial board")
    for state, color, symbol in [("normal", "gold", "star"), ("current", "cyan", "map"), ("done", "green", "check"), ("boss", "red", "battle")]:
        save_asset(f"daily.weekly-path-node.{state}", "daily/weekly-path-nodes", f"{state}.png", make_badge((210, 210), color, symbol, state), "P0", "daily weekly path node")
    for kind, icon_kind in [("calendar", "daily"), ("clock", "refresh"), ("refresh", "refresh")]:
        save_asset(f"daily.calendar-clock-icons.{kind}", "daily/icons", f"{kind}.png", make_icon(icon_kind, "jade"), "P0", "daily calendar or clock icon")
    for state, color in [("closed", "gold"), ("open", "green")]:
        save_asset(f"daily.reward-chest-slot.{state}", "daily/reward-chest", f"{state}.png", make_badge((280, 280), color, "chest", state), "P0", "daily reward chest slot")
    save_asset("daily.claim-button-emblem", "daily", "claim-button-emblem.png", make_badge((260, 260), "gold", "chest", "active"), "P0", "daily claim button emblem")
    save_asset("daily.streak-badge", "daily", "streak-badge.png", make_badge((260, 260), "red", "flame", "active"), "P0", "daily streak badge")

    for state in ["normal", "selected", "locked", "upgrade-ready"]:
        variant = "normal" if state == "normal" else "active" if state == "selected" else "disabled" if state == "locked" else "ready"
        save_asset(f"roster.companion-card-frame.{state}", "roster/companion-cards", f"{state}.png", make_panel((420, 620), radius=42, border=8, glow=rgba("cyan", 90) if state in {"selected", "upgrade-ready"} else None), "P0", "roster companion card frame")
    for role, symbol, color in [("guide", "map", "jade"), ("training", "training", "gold"), ("battle", "battle", "red"), ("mind-demon", "mind", "violet")]:
        save_asset(f"roster.companion-role-badges.{role}", "roster/role-badges", f"{role}.png", make_badge((230, 230), color, symbol), "P0", "companion role badge")
    for variant in ["track", "fill", "highlight"]:
        img = canvas((520, 80))
        draw = ImageDraw.Draw(img)
        if variant == "track":
            draw.rounded_rectangle((18, 24, 502, 56), radius=16, fill=rgba("ink_soft", 100), outline=rgba("gold_dark", 150), width=4)
        elif variant == "fill":
            draw.rounded_rectangle((18, 24, 502, 56), radius=16, fill=rgba("jade", 220))
        else:
            draw.rounded_rectangle((18, 20, 502, 60), radius=20, outline=rgba("gold_light", 215), width=8)
        save_asset(f"roster.bond-bar.{variant}", "roster/bond-bar", f"{variant}.png", img, "P0", "roster bond bar")
    save_asset("roster.stat-pill", "roster", "stat-pill.png", make_button((300, 92), "normal", "secondary"), "P0", "roster stat pill")

    for state in ["normal", "selected", "locked", "max"]:
        save_asset(f"artifact.card-frame.{state}", "artifact-ui/cards", f"{state}.png", make_panel((360, 500), radius=38, border=7, glow=rgba("gold_light", 100) if state in {"selected", "max"} else None), "P0", "artifact card frame")
    for rarity, color in [("common", "jade"), ("rare", "blue"), ("epic", "violet"), ("legendary", "gold")]:
        save_asset(f"artifact.rarity-gems.{rarity}", "artifact-ui/rarity-gems", f"{rarity}.png", make_badge((190, 190), color, "star", "active" if rarity == "legendary" else "normal"), "P0", "artifact rarity gem")
    save_asset("artifact.material-cost-chip", "artifact-ui", "material-cost-chip.png", make_button((360, 108), "normal", "secondary"), "P0", "artifact material cost chip")
    for state in ["normal", "ready", "disabled"]:
        save_asset(f"artifact.upgrade-button-frame.{state}", "artifact-ui/upgrade-buttons", f"{state}.png", make_button((420, 140), state, "primary"), "P0", "artifact upgrade button")
    for kind, color in [("spark", "gold"), ("ring", "cyan"), ("stars", "violet")]:
        save_asset(f"artifact.upgrade-fx.{kind}", "artifact-ui/fx/upgrade", f"{kind}.png", make_fx("upgrade", color), "P0", "artifact upgrade effect")
    save_asset("artifact.lock-overlay", "artifact-ui", "lock-overlay.png", make_status_overlay("locked-overlay", (360, 500)), "P0", "artifact lock overlay")


def generate_p1() -> None:
    for name, kind, color in [
        ("page-transition-ink-open", "ink", "ink"),
        ("page-transition-ink-expand", "ink", "violet"),
        ("page-transition-ink-close", "ink", "dark"),
        ("selection-glow-small", "selection", "cyan"),
        ("selection-glow-medium", "selection", "gold"),
        ("selection-glow-large", "selection", "jade"),
        ("reward-pop-star", "reward", "gold"),
        ("reward-pop-coin", "reward", "green"),
        ("reward-pop-material", "reward", "violet"),
        ("lock-shake-lines", "lock", "disabled"),
        ("lock-dark纹", "lock", "ink"),
        ("correct-answer-glow", "selection", "green"),
        ("correct-answer-spark", "starburst", "gold"),
        ("wrong-answer-ink", "wrong", "ink"),
        ("wrong-answer-red", "wrong", "red"),
        ("loading-spinner", "spinner", "jade"),
    ]:
        safe_name = name.replace("纹", "pattern")
        save_asset(f"fx.{safe_name}", "fx", f"{safe_name}.png", make_fx(kind, color), "P1", "feedback or transition effect")
    save_asset("ui.tooltip-frame", "ui/tooltip", "tooltip-frame.png", make_panel((480, 220), radius=28, border=6), "P1", "tooltip frame")
    for size_name, size in [("small", (640, 420)), ("large", (1040, 720))]:
        save_asset(f"ui.modal-frame.{size_name}", "ui/modal", f"{size_name}.png", make_panel(size, radius=42, border=9), "P1", "modal frame")
    for part in ["track", "thumb"]:
        img = canvas((80, 520))
        draw = ImageDraw.Draw(img)
        if part == "track":
            draw.rounded_rectangle((28, 18, 52, 502), radius=12, fill=rgba("ink_soft", 90), outline=rgba("gold", 120), width=3)
        else:
            draw.rounded_rectangle((18, 150, 62, 340), radius=22, fill=rgba("gold", 220), outline=rgba("gold_light", 230), width=4)
        save_asset(f"ui.scrollbar-themed.{part}", "ui/scrollbar", f"{part}.png", img, "P1", "themed scrollbar")
    for kind in ["search", "code"]:
        save_asset(f"ui.input-frame.{kind}", "ui/input", f"{kind}.png", make_button((720, 120), "normal", "secondary"), "P1", "input frame")
    for name, symbol, color in [("no-task", "daily", "jade"), ("no-reward", "chest", "gold"), ("locked", "shield", "disabled")]:
        save_asset(f"ui.empty-state-illustration.{name}", "ui/empty-state", f"{name}.png", make_badge((360, 360), color, symbol), "P1", "empty state illustration")


def derive_character_variant(src: Path, character: str, expression: str, color: str) -> Image.Image:
    base = Image.open(src).convert("RGBA")
    base.thumbnail((780, 1180), Image.Resampling.LANCZOS)
    img = canvas((1024, 1536))
    add_glow(img, (512, 790), [470, 330], rgba(color, 72))
    img.alpha_composite(base, ((1024 - base.width) // 2, 250))
    seal = make_badge((260, 260), color, "star" if expression in {"happy", "victory", "relief"} else "eye" if expression in {"thinking", "focused", "whisper"} else "shield", "active")
    img.alpha_composite(seal, (700, 1110))
    # Warm top light keeps the derived variant visually distinct without changing identity.
    glaze = canvas(img.size)
    draw = ImageDraw.Draw(glaze)
    draw.ellipse((230, 180, 794, 580), fill=rgba("paper_light", 34))
    img.alpha_composite(glaze.filter(ImageFilter.GaussianBlur(40)))
    return img


def generate_character_variants() -> None:
    specs = {
        "mingche": (["calm", "encourage", "serious"], "jade"),
        "azhi": (["teach", "happy", "thinking"], "gold"),
        "qinglan": (["battle-ready", "focused", "victory"], "red"),
        "xiaomo": (["whisper", "worry", "relief"], "violet"),
    }
    for character, (expressions, color) in specs.items():
        src = OUT / "characters" / "standees" / "cutouts" / f"standee-{character}-cutout.png"
        if not src.exists():
            src = OUT / "characters" / "standees" / "raw" / f"standee-{character}.png"
        for expression in expressions:
            img = derive_character_variant(src, character, expression, color) if src.exists() else make_badge((1024, 1536), color, "roster")
            save_asset(f"character.{character}.expression-set.{expression}", f"characters/variants/{character}", f"{expression}.png", img, "P2", "identity-preserving character expression derivative")


def write_index() -> None:
    index = {
        "generatedAt": date.today().isoformat(),
        "source": SOURCE_DOC,
        "count": len(manifest),
        "groups": {},
        "assets": manifest,
    }
    for item in manifest:
        index["groups"].setdefault(item["group"], 0)
        index["groups"][item["group"]] += 1
    index_path = OUT / "missing-assets-index.json"
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    readme_lines = [
        "# Generated Missing Assets",
        "",
        f"Generated from `{SOURCE_DOC}` on {index['generatedAt']}.",
        "",
        "The assets are grouped by functional area. Text is intentionally not baked into UI frames.",
        "",
        f"Total assets: {len(manifest)}",
        "",
        "See `missing-assets-index.json` for asset IDs, priorities, roles, paths, and dimensions.",
        "",
    ]
    (OUT / "README-missing-assets.md").write_text("\n".join(readme_lines), encoding="utf-8")


def main() -> None:
    if "--allow-procedural-placeholders" not in sys.argv:
        print(
            "This script generates procedural placeholder PNGs and can overwrite image_gen assets. "
            "Re-run with --allow-procedural-placeholders only when placeholder regeneration is intentional.",
            file=sys.stderr,
        )
        raise SystemExit(2)
    generate_global_ui()
    generate_map()
    generate_story()
    generate_training()
    generate_battle()
    generate_mind_demon()
    generate_report_daily_roster()
    generate_p1()
    generate_character_variants()
    write_index()
    print(f"Generated {len(manifest)} assets under {OUT}")


if __name__ == "__main__":
    main()
