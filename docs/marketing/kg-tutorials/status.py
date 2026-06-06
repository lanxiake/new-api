#!/usr/bin/env python3
"""MT图解百科 · 系列进度查看脚本

用法：
  python status.py                  # 列出 data/ 下所有系列
  python status.py data/<主题>/     # 查看某个系列的详细进度
"""
import json
import os
import re
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

MIN_VALID_KB = 200


def fmt_size(path: str) -> str:
    if not os.path.exists(path):
        return "missing"
    kb = os.path.getsize(path) // 1024
    return f"{kb}KB"


def parse_prompts_slugs(path: str) -> list:
    if not os.path.exists(path):
        return []
    text = open(path, encoding="utf-8").read()
    return re.findall(r"^## #([\w\-]+)", text, re.MULTILINE)


def check_series(series_dir: str):
    name = os.path.basename(series_dir.rstrip("/\\"))
    print(f"\n[{series_dir}] 系列：{name}")
    print("-" * 60)

    files = {
        "00-series-outline.md": "系列大纲",
        "brief.md": "简介+科学参考",
        "outline.md": "分镜大纲",
        "prompts.md": "英文 Prompt",
    }

    next_action = None

    for fname, desc in files.items():
        path = os.path.join(series_dir, fname)
        if os.path.exists(path):
            print(f"  ✓ {fname} ({fmt_size(path)}) — {desc}")
        else:
            print(f"  ✗ {fname} — {desc}（缺失）")
            if next_action is None:
                next_action = f"产出 {fname}（参考 sub-skills/kg-{'outline-planner' if 'outline' in fname or 'brief' in fname or 'series' in fname else 'image-generator'}/SKILL.md）"

    # 图片状态
    raw_dir = os.path.join(series_dir, "images", "raw")
    prompts_path = os.path.join(series_dir, "prompts.md")
    slugs = parse_prompts_slugs(prompts_path)

    if slugs:
        print(f"  images/raw/: ", end="")
        done, failed = [], []
        for slug in slugs:
            img = os.path.join(raw_dir, f"{slug}.png")
            if os.path.exists(img):
                kb = os.path.getsize(img) // 1024
                if kb >= MIN_VALID_KB:
                    done.append(slug)
                else:
                    failed.append((slug, f"too small {kb}KB"))
            else:
                failed.append((slug, "missing"))
        print(f"{len(done)}/{len(slugs)} done")
        for slug in slugs:
            img = os.path.join(raw_dir, f"{slug}.png")
            if os.path.exists(img):
                kb = os.path.getsize(img) // 1024
                mark = "✓" if kb >= MIN_VALID_KB else "⚠"
                print(f"    {mark} {slug}.png ({kb}KB)")
            else:
                print(f"    ✗ {slug}.png (missing)")
        if failed and next_action is None:
            next_slugs = [s for s, _ in failed]
            cmd = (f"python sub-skills/kg-image-generator/scripts/generate_kg_image.py \\\n"
                   f"  --prompt-file {prompts_path} \\\n"
                   f"  --retry-failed --output-dir {raw_dir}/")
            next_action = f"重试缺失的图（{next_slugs}）:\n  {cmd}"

    # 发布文件
    pub_dir = os.path.join(series_dir, "publish")
    for fname in ["wechat.md", "caption.md"]:
        path = os.path.join(pub_dir, fname)
        if os.path.exists(path):
            print(f"  ✓ publish/{fname} ({fmt_size(path)})")
        else:
            print(f"  ✗ publish/{fname} (missing)")
            if next_action is None and slugs:
                next_action = f"撰写 publish/{fname}（参考 sub-skills/kg-publisher/SKILL.md）"

    # 失败日志
    fail_log = os.path.join(series_dir, ".last-failed.json")
    if os.path.exists(fail_log):
        with open(fail_log, encoding="utf-8") as f:
            data = json.load(f)
            failed_slugs = data.get("failed", [])
            if failed_slugs:
                print(f"  ⚠ 上次失败: {failed_slugs}")

    print()
    if next_action:
        print(f"➡ 下一步：{next_action}")
    else:
        print("✓ 全部就绪，可以发布：")
        print(f"  python sub-skills/kg-publisher/scripts/publish_wechat.py {pub_dir}/wechat.md")
    print()


def list_all_series(root: str):
    data_dir = os.path.join(root, "data")
    if not os.path.exists(data_dir):
        print(f"[ERROR] {data_dir} 不存在")
        sys.exit(1)
    print(f"\n所有系列（{data_dir}）：")
    print("-" * 60)
    for entry in sorted(os.listdir(data_dir)):
        sub = os.path.join(data_dir, entry)
        if not os.path.isdir(sub):
            continue
        if entry == "参考图片":
            print(f"  📌 {entry}/ (视觉标杆参考)")
            continue
        outline = os.path.join(sub, "00-series-outline.md")
        has_outline = "✓" if os.path.exists(outline) else "✗"
        raw_dir = os.path.join(sub, "images", "raw")
        imgs = len([f for f in os.listdir(raw_dir) if f.endswith(".png")]) if os.path.isdir(raw_dir) else 0
        pub = os.path.join(sub, "publish", "wechat.md")
        has_pub = "✓" if os.path.exists(pub) else "✗"
        print(f"  • {entry}/  大纲:{has_outline}  图片:{imgs}  文案:{has_pub}")
    print("\n查看详情：python status.py data/<主题>/")
    print()


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    if len(sys.argv) < 2:
        list_all_series(root)
        return
    target = sys.argv[1].rstrip("/\\")
    if not os.path.isdir(target):
        # 兼容 "data/j20" 写法
        alt = os.path.join(root, target)
        if os.path.isdir(alt):
            target = alt
        else:
            print(f"[ERROR] 目录不存在: {target}")
            sys.exit(1)
    check_series(target)


if __name__ == "__main__":
    main()
