#!/usr/bin/env python3
"""MT图解百科 · 排版组装脚本
在原始底图上叠加中文标题、反直觉副标题、底部总结栏，输出最终发布图。

用法：
  python compose_image.py --config series/20260531-typhoon/layout.json \
    --input-dir series/20260531-typhoon/images/raw/ \
    --output-dir series/20260531-typhoon/images/final/
"""

import argparse
import json
import os
import sys
import textwrap

from PIL import Image, ImageDraw, ImageFont

# 字体路径（微软雅黑，Windows系统自带）
FONT_BOLD   = "C:/Windows/Fonts/msyh.ttc"   # 微软雅黑
FONT_REGULAR = "C:/Windows/Fonts/msyh.ttc"

TITLE_BAR_HEIGHT_RATIO  = 0.22   # 顶部标题区占图高的22%
SUMMARY_BAR_HEIGHT_RATIO = 0.08  # 底部总结栏占图高的8%


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    """按像素宽度自动换行。"""
    lines = []
    for para in text.split("\n"):
        words = list(para)  # 中文逐字分割
        current = ""
        for ch in words:
            test = current + ch
            bbox = draw.textbbox((0, 0), test, font=font)
            if bbox[2] - bbox[0] > max_width and current:
                lines.append(current)
                current = ch
            else:
                current = test
        if current:
            lines.append(current)
    return lines


def compose(img_path: str, meta: dict, output_path: str) -> None:
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    draw = ImageDraw.Draw(img)

    title_bar_h  = int(h * TITLE_BAR_HEIGHT_RATIO)
    summary_bar_h = int(h * SUMMARY_BAR_HEIGHT_RATIO)

    # ── 顶部标题区：半透明深蓝遮罩 ──────────────────────────────
    overlay_top = Image.new("RGBA", (w, title_bar_h), (10, 20, 50, 195))
    img.paste(overlay_top, (0, 0), overlay_top)

    # 系列标识（小字）
    series_font = load_font(FONT_REGULAR, max(14, w // 55))
    draw.text((w // 2, int(title_bar_h * 0.12)), "MT图解百科",
              font=series_font, fill=(180, 200, 255, 220), anchor="mm")

    # 大标题
    title_font_size = max(36, w // 14)
    title_font = load_font(FONT_BOLD, title_font_size)
    draw.text((w // 2, int(title_bar_h * 0.42)), meta["title"],
              font=title_font, fill=(255, 255, 255, 255), anchor="mm")

    # 反直觉副标题（自动换行）
    sub_font_size = max(18, w // 30)
    sub_font = load_font(FONT_REGULAR, sub_font_size)
    subtitle = meta.get("subtitle", "")
    max_sub_w = int(w * 0.88)
    sub_lines = wrap_text(subtitle, sub_font, max_sub_w, draw)
    sub_y_start = int(title_bar_h * 0.65)
    line_h = sub_font_size + 6
    for i, line in enumerate(sub_lines[:2]):   # 最多显示2行
        draw.text((w // 2, sub_y_start + i * line_h), line,
                  font=sub_font, fill=(200, 230, 255, 220), anchor="mm")

    # ── 底部总结栏 ────────────────────────────────────────────────
    summary_y = h - summary_bar_h
    overlay_bot = Image.new("RGBA", (w, summary_bar_h), (10, 20, 50, 210))
    img.paste(overlay_bot, (0, summary_y), overlay_bot)

    summary_font_size = max(14, w // 42)
    summary_font = load_font(FONT_REGULAR, summary_font_size)
    summary = meta.get("summary", "")
    max_sum_w = int(w * 0.90)
    sum_lines = wrap_text(summary, summary_font, max_sum_w, draw)
    sum_line_h = summary_font_size + 4
    total_sum_h = sum_line_h * min(len(sum_lines), 2)
    sum_y_start = summary_y + (summary_bar_h - total_sum_h) // 2
    for i, line in enumerate(sum_lines[:2]):
        draw.text((w // 2, sum_y_start + i * sum_line_h), line,
                  font=summary_font, fill=(220, 235, 255, 230), anchor="mm")

    # 保存
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    img.convert("RGB").save(output_path, "PNG", optimize=True)
    size_kb = os.path.getsize(output_path) // 1024
    print(f"  [done] {output_path} ({size_kb} KB)", file=sys.stderr)


def main():
    p = argparse.ArgumentParser(description="kg-publisher compose: overlay titles on raw images")
    p.add_argument("--config",     required=True, help="path to layout.json")
    p.add_argument("--input-dir",  required=True, help="directory of raw PNGs")
    p.add_argument("--output-dir", required=True, help="output directory for final PNGs")
    args = p.parse_args()

    with open(args.config, encoding="utf-8") as f:
        config = json.load(f)

    print(f"[compose] {len(config['images'])} images -> {args.output_dir}", file=sys.stderr)
    for entry in config["images"]:
        slug   = entry["slug"]
        in_path  = os.path.join(args.input_dir, f"{slug}.png")
        out_path = os.path.join(args.output_dir, f"{slug}.png")
        if not os.path.exists(in_path):
            print(f"  [skip] {slug}: raw image not found at {in_path}", file=sys.stderr)
            continue
        if os.path.exists(out_path):
            print(f"  [skip] {slug}: final already exists", file=sys.stderr)
            continue
        print(f"  [compose] {slug}", file=sys.stderr)
        compose(in_path, entry, out_path)

    print("[compose complete]", file=sys.stderr)


if __name__ == "__main__":
    main()
