#!/usr/bin/env python3
"""MT图解百科 · 批量生图脚本（v2.1）
通过 LLM-Link 的 images/generations 接口调用 gpt-image-2 生成3:4竖版科普图底图。

特性：
  - 自动向上递归查找 .kg-config.json（不依赖固定层级）
  - 批量模式自动跳过已存在文件、记录失败列表、结束输出汇总报告
  - --retry-failed 只重试上次失败的图（读取 .last-failed.json）
  - 生成后自动质检文件大小（小于 200KB 视为可疑）

用法：
  # 单张
  python generate_kg_image.py --prompt-file data/<主题>/prompts.md \\
    --section 01-cover --output data/<主题>/images/raw/01-cover.png

  # 批量（自动跳过已存在文件，中断后可续跑）
  python generate_kg_image.py --prompt-file data/<主题>/prompts.md \\
    --batch --output-dir data/<主题>/images/raw/

  # 只重试上次失败的图
  python generate_kg_image.py --prompt-file data/<主题>/prompts.md \\
    --retry-failed --output-dir data/<主题>/images/raw/
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time

# Windows GBK 终端兼容
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")


def _curl_bin() -> str:
    """返回 curl 路径。必须用 curl 而非 urllib：llm-link.top 前置 WAF 按 TLS
    指纹(JA3)拦截 Python 客户端(表现为 403/RemoteDisconnected)，curl 指纹可放行。"""
    exe = shutil.which("curl")
    if not exe:
        raise RuntimeError("未找到 curl，请确保系统已安装 curl 并在 PATH 中")
    return exe

# 质检阈值：成图至少 200KB（gpt-image-2 1024x1365 正常应在 1-3MB）
MIN_VALID_KB = 200


def parse_prompts_file(path: str):
    """解析 prompts.md，返回有序列表 [(slug, size, prompt), ...]。"""
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
        size = size_m.group(1).strip() if size_m else "768x1024"  # 默认 3:4 竖版小尺寸（最稳）
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
    """调用 images/generations，返回图片 URL。通过 curl 绕过 WAF 指纹拦截。"""
    url = base_url.rstrip("/") + "/v1/images/generations"
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "n": 1,
        "size": size,
        "response_format": "url",
    })
    curl = _curl_bin()
    cmd = [
        curl, "-sS", "--max-time", "180", "-X", "POST", url,
        "-H", f"Authorization: Bearer {api_key}",
        "-H", "Content-Type: application/json",
        "-A", UA,
        "--data-binary", "@-",
        "-w", "\n__HTTP_CODE__%{http_code}",
    ]

    for attempt in range(1, retries + 1):
        print(f"  [attempt {attempt}/{retries}] requesting {model} (via curl)...", file=sys.stderr)
        try:
            proc = subprocess.run(
                cmd, input=payload.encode("utf-8"),
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=200,
            )
            out = proc.stdout.decode("utf-8", errors="replace")
            code = ""
            mcode = re.search(r"__HTTP_CODE__(\d{3})\s*$", out)
            if mcode:
                code = mcode.group(1)
                out = out[:mcode.start()]
            if proc.returncode != 0:
                err = proc.stderr.decode("utf-8", errors="replace")
                raise RuntimeError(f"curl exit {proc.returncode}: {err[:200]}")
            if code and code != "200":
                raise RuntimeError(f"HTTP {code}: {out[:200]}")
            data = json.loads(out)
            return data["data"][0]["url"]
        except Exception as e:
            print(f"  [warn] {type(e).__name__}: {e}", file=sys.stderr)
        if attempt < retries:
            time.sleep(interval)
    raise RuntimeError(f"all {retries} retries failed")


def download(img_url: str, output: str) -> int:
    curl = _curl_bin()
    os.makedirs(os.path.dirname(os.path.abspath(output)), exist_ok=True)
    cmd = [curl, "-sS", "--max-time", "120", "-A", UA, "-o", output, img_url]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=140)
    if proc.returncode != 0:
        err = proc.stderr.decode("utf-8", errors="replace")
        raise RuntimeError(f"download curl exit {proc.returncode}: {err[:200]}")
    return os.path.getsize(output)


def find_config_path() -> str:
    """向上递归查找 .kg-config.json，最多向上 6 层。
    比固定层级更健壮，目录调整时不会失效。"""
    cur = os.path.dirname(os.path.abspath(__file__))
    for _ in range(6):
        candidate = os.path.join(cur, ".kg-config.json")
        if os.path.exists(candidate):
            return candidate
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return ""


def load_config() -> dict:
    config_path = find_config_path()
    if config_path:
        with open(config_path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def qc_image(path: str) -> tuple:
    """返回 (is_ok, message)。"""
    if not os.path.exists(path):
        return False, "file missing"
    size_kb = os.path.getsize(path) // 1024
    if size_kb < MIN_VALID_KB:
        return False, f"too small ({size_kb}KB < {MIN_VALID_KB}KB)"
    return True, f"{size_kb}KB"


def main():
    p = argparse.ArgumentParser(description="kg-image-generator: batch image generation via LLM-Link")
    p.add_argument("--prompt-file", required=True, help="path to prompts.md")
    p.add_argument("--section",    help="single mode: section slug, e.g. 01-cover")
    p.add_argument("--output",     help="single mode: output file path")
    p.add_argument("--batch",      action="store_true", help="batch mode: generate all sections")
    p.add_argument("--retry-failed", action="store_true", help="batch mode: only retry sections in last failed list")
    p.add_argument("--output-dir", help="batch mode: output directory")
    p.add_argument("--retries",    type=int, default=4, help="max retries per image (default 4)")
    args = p.parse_args()

    cfg      = load_config()
    api_key  = cfg.get("llm_link_api_key") or cfg.get("key") or cfg.get("api_key", "")
    base_url = (cfg.get("llm_link_base_url") or cfg.get("url")
                or cfg.get("base_url") or "https://www.llm-link.top")
    model    = cfg.get("llm_link_model") or cfg.get("model") or "gpt-image-2"

    if not api_key:
        cwd = os.getcwd()
        print(f"[ERROR] 未找到 api_key（只读配置文件，不读环境变量）。\n"
              f"  hint: 在技能包根目录 (kg-tutorials/) 下运行: python setup_config.py\n"
              f"  当前工作目录: {cwd}\n"
              f"  检测到的配置文件: {find_config_path() or '(未找到)'}", file=sys.stderr)
        sys.exit(3)

    key_preview = api_key[:8] + "..."
    print(f"[config] base={base_url} model={model} key={key_preview}", file=sys.stderr)

    sections = parse_prompts_file(args.prompt_file)
    if not sections:
        print("[ERROR] no ## #xxx sections found in prompts.md", file=sys.stderr)
        sys.exit(1)

    if args.batch or args.retry_failed:
        out_dir = args.output_dir or "images/raw"
        prompts_dir = os.path.dirname(os.path.abspath(args.prompt_file))
        failed_log = os.path.join(prompts_dir, ".last-failed.json")

        # 决定要跑哪些 section
        if args.retry_failed:
            if os.path.exists(failed_log):
                with open(failed_log, encoding="utf-8") as f:
                    failed_slugs = set(json.load(f).get("failed", []))
                # 兜底：若失败日志为空，扫描 out_dir 找缺失/异常文件
                if not failed_slugs:
                    for s, _, _ in sections:
                        img = os.path.join(out_dir, f"{s}.png")
                        if not os.path.exists(img) or os.path.getsize(img) // 1024 < MIN_VALID_KB:
                            failed_slugs.add(s)
            else:
                # 无失败日志：扫描 out_dir 自动发现缺失/异常
                failed_slugs = set()
                for s, _, _ in sections:
                    img = os.path.join(out_dir, f"{s}.png")
                    if not os.path.exists(img) or os.path.getsize(img) // 1024 < MIN_VALID_KB:
                        failed_slugs.add(s)
                print(f"[retry-failed] 无失败日志，自动扫描 {out_dir} 发现缺失/异常文件", file=sys.stderr)
            targets = [(s, sz, pr) for s, sz, pr in sections if s in failed_slugs]
            if not targets:
                print("[retry-failed] 没有需要重试的图", file=sys.stderr)
                sys.exit(0)
            print(f"[retry-failed] {len(targets)} sections to retry: {sorted(failed_slugs)}", file=sys.stderr)
        else:
            targets = sections
            print(f"[batch] {len(targets)} sections -> {out_dir}", file=sys.stderr)

        success_list, failed_list, skip_list, qc_warn_list = [], [], [], []

        for slug, size, prompt in targets:
            out_path = os.path.join(out_dir, f"{slug}.png")
            if os.path.exists(out_path) and not args.retry_failed:
                ok, msg = qc_image(out_path)
                if ok:
                    print(f"  [skip] {slug} already exists ({msg})", file=sys.stderr)
                    skip_list.append(slug)
                    continue
                else:
                    print(f"  [redo] {slug} exists but QC failed: {msg}", file=sys.stderr)
                    os.remove(out_path)
            print(f"  [gen]  {slug} ({size}) prompt={len(prompt)} chars", file=sys.stderr)
            try:
                img_url = call_image_api(base_url, api_key, model, prompt, size, args.retries)
                print(f"  [url]  {img_url[:80]}...", file=sys.stderr)
                n = download(img_url, out_path)
                ok, msg = qc_image(out_path)
                if ok:
                    print(f"  [done] {out_path} ({msg})", file=sys.stderr)
                    success_list.append(slug)
                else:
                    print(f"  [WARN] {slug} QC failed: {msg}", file=sys.stderr)
                    qc_warn_list.append((slug, msg))
                    success_list.append(slug)  # 文件已下载，但需人工核验
            except Exception as e:
                print(f"  [FAIL] {slug}: {e}", file=sys.stderr)
                failed_list.append(slug)
            time.sleep(3)

        # 汇总报告
        print("", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        print(f"[summary] success: {len(success_list)} | failed: {len(failed_list)} | skipped: {len(skip_list)}", file=sys.stderr)
        if success_list:
            print(f"  ✓ success: {success_list}", file=sys.stderr)
        if skip_list:
            print(f"  ↷ skipped: {skip_list}", file=sys.stderr)
        if qc_warn_list:
            print(f"  ⚠ QC warnings (人工核验): {qc_warn_list}", file=sys.stderr)
        if failed_list:
            print(f"  ✗ failed:  {failed_list}", file=sys.stderr)
            print(f"  hint: 等待 30s 后运行 --retry-failed 重试", file=sys.stderr)
        print("=" * 60, file=sys.stderr)

        # 记录失败列表（即使全成功也写一次，覆盖旧的）
        with open(failed_log, "w", encoding="utf-8") as f:
            json.dump({"failed": failed_list, "ts": int(time.time())}, f, ensure_ascii=False, indent=2)

        sys.exit(0 if not failed_list else 2)

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
        ok, msg = qc_image(out_path)
        if ok:
            print(f"[OK]  {out_path} ({msg})", file=sys.stderr)
        else:
            print(f"[WARN] {out_path} QC failed: {msg} — 人工核验", file=sys.stderr)


if __name__ == "__main__":
    main()
