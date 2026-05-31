#!/usr/bin/env python3
"""MT图解百科 · 批量生图脚本
通过 LLM-Link 的 images/generations 接口调用 gpt-image-2 生成3:4竖版科普图底图。

用法：
  # 单张
  python generate_kg_image.py --prompt-file series/typhoon/prompts.md \\
    --section 01-cover --output series/typhoon/images/raw/01-cover.png

  # 批量（自动跳过已存在文件，中断后可续跑）
  python generate_kg_image.py --prompt-file series/typhoon/prompts.md \\
    --batch --output-dir series/typhoon/images/raw/
"""

import argparse
import http.client
import json
import os
import re
import ssl
import sys
import time
import urllib.request
import urllib.error

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

# 绕过系统代理直连（代理可能导致 RemoteDisconnected）
_NO_PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def parse_prompts_file(path: str):
    """
    解析 prompts.md，返回有序列表 [(slug, size, prompt), ...]。
    识别格式：
      ## #01-cover（xxx）
      - 尺寸：1024x1365
      - 完整Prompt：
        ...（缩进文本，直到下一个 ## # 或文件结束）
    """
    text = open(path, "r", encoding="utf-8").read()
    sections = []
    pattern = re.compile(
        r"^## #([\w\-]+)[^\n]*\n(.*?)(?=^## #|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    for m in pattern.finditer(text):
        slug = m.group(1)
        body = m.group(2)
        size_m = re.search(r"-\s*尺寸[：:]\s*(\d+x\d+)", body)
        size = size_m.group(1).strip() if size_m else "1024x1024"
        prompt_m = re.search(r"完整Prompt[：:]\s*\n([\s\S]+)", body)
        if prompt_m:
            raw = prompt_m.group(1)
            lines = raw.splitlines()
            indents = [len(l) - len(l.lstrip()) for l in lines if l.strip()]
            min_indent = min(indents) if indents else 0
            prompt = "\n".join(
                l[min_indent:] if len(l) >= min_indent else l
                for l in lines
            ).strip()
        else:
            prompt = body.strip()
        sections.append((slug, size, prompt))
    return sections


def call_image_api(base_url: str, api_key: str, model: str, prompt: str,
                   size: str, retries: int = 4, interval: int = 6) -> str:
    """调用 images/generations，返回图片 URL。"""
    url = base_url.rstrip("/") + "/v1/images/generations"
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "n": 1,
        "size": size,
        "response_format": "url",
    }).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": UA,
    }

    for attempt in range(1, retries + 1):
        print(f"  [attempt {attempt}/{retries}] requesting {model}...", file=sys.stderr)
        try:
            req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
            with _NO_PROXY_OPENER.open(req, timeout=180) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                img_url = data["data"][0]["url"]
                return img_url
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            print(f"  [warn] HTTP {e.code}: {body[:300]}", file=sys.stderr)
        except Exception as e:
            print(f"  [warn] {type(e).__name__}: {e}", file=sys.stderr)
        if attempt < retries:
            time.sleep(interval)
    raise RuntimeError(f"all {retries} retries failed")


def download(img_url: str, output: str) -> int:
    req = urllib.request.Request(img_url, headers={"User-Agent": UA})
    with _NO_PROXY_OPENER.open(req, timeout=120) as r:
        data = r.read()
    os.makedirs(os.path.dirname(os.path.abspath(output)), exist_ok=True)
    with open(output, "wb") as f:
        f.write(data)
    return len(data)


def load_config() -> dict:
    """从技能包根目录读取 .kg-config.json，不存在则返回空字典。"""
    script_dir  = os.path.dirname(os.path.abspath(__file__))
    root_dir    = os.path.normpath(os.path.join(script_dir, "..", ".."))
    config_path = os.path.join(root_dir, ".kg-config.json")
    if os.path.exists(config_path):
        with open(config_path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def main():
    p = argparse.ArgumentParser(description="kg-image-generator: batch image generation via LLM-Link")
    p.add_argument("--prompt-file", required=True, help="path to prompts.md")
    p.add_argument("--section",    help="single mode: section slug, e.g. 01-cover")
    p.add_argument("--output",     help="single mode: output file path")
    p.add_argument("--batch",      action="store_true", help="batch mode: generate all sections")
    p.add_argument("--output-dir", help="batch mode: output directory (default: images/raw)")
    p.add_argument("--retries",    type=int, default=4, help="max retries per image (default 4)")
    args = p.parse_args()

    # 优先使用环境变量，其次读取 .kg-config.json
    cfg      = load_config()
    api_key  = os.environ.get("LLM_LINK_API_KEY") or cfg.get("llm_link_api_key", "")
    base_url = os.environ.get("LLM_LINK_BASE_URL") or cfg.get("llm_link_base_url", "https://www.llm-link.top")
    model    = os.environ.get("LLM_LINK_MODEL")    or cfg.get("llm_link_model", "gpt-image-2")

    if not api_key:
        print("[ERROR] LLM_LINK_API_KEY not set — 请先运行 python setup_config.py", file=sys.stderr)
        sys.exit(3)

    key_preview = api_key[:8] + "..."
    print(f"[config] base={base_url} model={model} key={key_preview}", file=sys.stderr)

    sections = parse_prompts_file(args.prompt_file)
    if not sections:
        print("[ERROR] no ## #xxx sections found in prompts.md", file=sys.stderr)
        sys.exit(1)

    if args.batch:
        out_dir = args.output_dir or "images/raw"
        print(f"[batch] {len(sections)} sections -> {out_dir}", file=sys.stderr)
        for slug, size, prompt in sections:
            out_path = os.path.join(out_dir, f"{slug}.png")
            if os.path.exists(out_path):
                print(f"  [skip] {slug} already exists", file=sys.stderr)
                continue
            print(f"  [gen]  {slug} ({size}) prompt={len(prompt)} chars", file=sys.stderr)
            try:
                img_url = call_image_api(base_url, api_key, model, prompt, size, args.retries)
                print(f"  [url]  {img_url[:80]}...", file=sys.stderr)
                n = download(img_url, out_path)
                print(f"  [done] {out_path} ({n//1024} KB)", file=sys.stderr)
            except Exception as e:
                print(f"  [FAIL] {slug}: {e}", file=sys.stderr)
            time.sleep(3)
        print("[batch complete]", file=sys.stderr)

    else:
        if not args.section:
            print("[ERROR] single mode requires --section", file=sys.stderr)
            sys.exit(1)
        hit = [(sl, sz, pr) for sl, sz, pr in sections if sl == args.section]
        if not hit:
            slugs = [sl for sl, _, _ in sections]
            print(f"[ERROR] section '{args.section}' not found. available: {slugs}", file=sys.stderr)
            sys.exit(1)
        slug, size, prompt = hit[0]
        out_path = args.output or f"{slug}.png"
        print(f"[gen] {slug} ({size}) prompt={len(prompt)} chars -> {out_path}", file=sys.stderr)
        img_url = call_image_api(base_url, api_key, model, prompt, size, args.retries)
        print(f"[url] {img_url[:80]}...", file=sys.stderr)
        n = download(img_url, out_path)
        print(f"[OK]  {out_path} ({n//1024} KB)", file=sys.stderr)


if __name__ == "__main__":
    main()
