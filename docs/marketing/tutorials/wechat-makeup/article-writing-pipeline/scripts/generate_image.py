#!/usr/bin/env python3
"""通过 LLM-Link 的 chat completions 接口调用 gpt-image-2 生成单张图片。

LLM-Link 把 gpt-image-2 包装成 chat completions 风格：
请求 messages，响应 choices[0].message.content 中含 markdown ![image](url) 链接。
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request


UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")


def extract_prompt(file_path: str, section: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
    pattern = rf"##\s*#{re.escape(section)}\b.*?完整提示词[:：]\s*\n+```\n(.*?)\n```"
    m = re.search(pattern, text, re.DOTALL)
    if not m:
        raise ValueError(f"未能从 {file_path} 提取 #{section} 的提示词")
    return m.group(1).strip()


def call_chat_image(base_url: str, api_key: str, model: str, prompt: str,
                    retries: int = 3, interval: int = 5) -> str:
    """返回图片 URL。"""
    url = base_url.rstrip("/") + "/v1/chat/completions"
    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": UA,
        "Accept": "application/json",
    }

    for attempt in range(1, retries + 1):
        print(f"[INFO] 第 {attempt}/{retries} 次请求 {model} (chat)...", file=sys.stderr)
        try:
            req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=600) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data["choices"][0]["message"]["content"]
                m = re.search(r"!\[[^\]]*\]\((https?://[^)\s]+)\)", content)
                if m:
                    return m.group(1)
                m2 = re.search(r"https?://\S+\.(?:png|jpg|jpeg|webp)", content)
                if m2:
                    return m2.group(0)
                raise RuntimeError(f"响应中未找到图片 URL，原文: {content[:300]}")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            print(f"[WARN] HTTP {e.code}: {body[:300]}", file=sys.stderr)
        except Exception as e:
            print(f"[WARN] {type(e).__name__}: {e}", file=sys.stderr)
        if attempt < retries:
            time.sleep(interval)
    raise RuntimeError(f"已重试 {retries} 次仍失败")


def download(img_url: str, output: str) -> int:
    req = urllib.request.Request(img_url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    with open(output, "wb") as f:
        f.write(data)
    return len(data)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--prompt-file", required=True)
    p.add_argument("--section", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--size", default="")
    p.add_argument("--quality", default="")
    args = p.parse_args()

    api_key = os.environ.get("LLM_LINK_API_KEY")
    if not api_key:
        print("LLM_LINK_API_KEY 未设置", file=sys.stderr)
        sys.exit(3)
    base_url = os.environ.get("LLM_LINK_BASE_URL", "https://www.llm-link.top")
    model = os.environ.get("LLM_LINK_MODEL", "gpt-image-2")

    prompt = extract_prompt(args.prompt_file, args.section)
    if args.size:
        prompt += f"\n\n输出尺寸：{args.size}"
    print(f"[INFO] 提示词长度: {len(prompt)} 字节", file=sys.stderr)

    img_url = call_chat_image(base_url, api_key, model, prompt)
    print(f"[INFO] 图片 URL: {img_url}", file=sys.stderr)
    n = download(img_url, args.output)
    print(f"[OK] 已写入 {args.output} ({n} bytes)", file=sys.stderr)


if __name__ == "__main__":
    main()
