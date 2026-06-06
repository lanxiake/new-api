"""
MT图解百科 · 初始化配置向导
引导用户填写公众号信息、作者名称、LLM-Link 生图配置。
结果保存到技能包根目录的 .kg-config.json。

用法：
  python setup_config.py
"""

import json
import os
import sys


CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".kg-config.json")
CONFIG_FILE = os.path.normpath(CONFIG_FILE)


def ask(prompt: str, default: str = "") -> str:
    if default:
        val = input(f"{prompt} [{default}]: ").strip()
        return val if val else default
    else:
        return input(f"{prompt}: ").strip()


def load_existing() -> dict:
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def main():
    print("=" * 55)
    print("  MT图解百科 · 初始化配置向导")
    print("=" * 55)
    print("配置将保存到：", CONFIG_FILE)
    print("直接回车保留现有值，输入新值则覆盖。\n")

    cfg = load_existing()

    # ── 1. 作者 / 公众号信息 ──────────────────────────────
    print("【1/3】作者与公众号信息")
    print("  作者名称显示在文章署名处；不填则使用公众号名称。")
    cfg["mp_name"]  = ask("  公众号名称", cfg.get("mp_name", ""))
    cfg["author"]   = ask("  作者名称（留空则使用公众号名称）", cfg.get("author", ""))
    if not cfg["author"]:
        cfg["author"] = cfg["mp_name"]
        print(f"  -> 作者将使用公众号名称：{cfg['author']}")

    # ── 2. 微信公众号 API ─────────────────────────────────
    print("\n【2/3】微信公众号 API 配置")
    print("  在 mp.weixin.qq.com -> 设置 -> 开发者工具 -> 开发者ID 中获取。")
    cfg["wechat_app_id"]     = ask("  AppID (wx...)", cfg.get("wechat_app_id", ""))
    cfg["wechat_app_secret"] = ask("  AppSecret", cfg.get("wechat_app_secret", ""))

    # ── 3. LLM-Link 生图配置 ──────────────────────────────
    print("\n【3/3】LLM-Link 生图配置")
    print("  用于调用 gpt-image-2 生成科普图解图片。")
    cfg["llm_link_base_url"] = ask("  API Base URL", cfg.get("llm_link_base_url", "https://www.llm-link.top"))
    cfg["llm_link_api_key"]  = ask("  API Key (sk-...)", cfg.get("llm_link_api_key", ""))
    cfg["llm_link_model"]    = ask("  模型名称", cfg.get("llm_link_model", "gpt-image-2"))

    # ── 保存 ──────────────────────────────────────────────
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 55)
    print("  配置已保存！")
    print("=" * 55)
    print(f"  公众号名称 : {cfg['mp_name']}")
    print(f"  作者名称   : {cfg['author']}")
    print(f"  AppID      : {cfg['wechat_app_id'][:8]}..." if cfg['wechat_app_id'] else "  AppID      : 未填写")
    print(f"  API Key    : {cfg['llm_link_api_key'][:10]}..." if cfg['llm_link_api_key'] else "  API Key    : 未填写")
    print(f"  模型        : {cfg['llm_link_model']}")
    print("\n后续生图命令可省略环境变量，直接运行：")
    print("  python sub-skills/kg-image-generator/scripts/generate_kg_image.py --batch ...")
    print("后续发布命令：")
    print("  python sub-skills/kg-publisher/scripts/publish_wechat.py <wechat.md>")
    print("\n建议下一步：")
    print("  1. python doctor.py        # 验证配置可用性（含 API key 探测）")
    print("  2. 阅读 START-HERE.md     # 一站式 AI 操作入口")


if __name__ == "__main__":
    main()
