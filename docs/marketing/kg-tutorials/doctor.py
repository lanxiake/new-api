#!/usr/bin/env python3
"""MT图解百科 · 环境自检脚本

一键检查：依赖、配置、API 连通性、微信凭证。
任一项失败给出具体修复建议。
"""
import json
import os
import sys
import urllib.request
import urllib.error

# Windows GBK 终端兼容
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
_NO_PROXY = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def check_python():
    v = sys.version_info
    if v.major == 3 and v.minor >= 8:
        return True, f"Python {v.major}.{v.minor}.{v.micro}"
    return False, f"Python {v.major}.{v.minor} 太旧，需要 3.8+"


def check_pillow():
    try:
        from PIL import Image
        return True, f"pillow {Image.__version__ if hasattr(Image, '__version__') else 'OK'}"
    except ImportError:
        return False, "未安装 pillow，运行: python -m pip install pillow"


def check_config(root: str):
    cfg_path = os.path.join(root, ".kg-config.json")
    if not os.path.exists(cfg_path):
        return False, None, f".kg-config.json 不存在，运行: python setup_config.py"
    try:
        with open(cfg_path, encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception as e:
        return False, None, f".kg-config.json 解析失败: {e}"
    required = ["mp_name", "wechat_app_id", "wechat_app_secret", "llm_link_api_key"]
    missing = [k for k in required if not cfg.get(k)]
    if missing:
        return False, cfg, f"配置缺少字段: {missing}，运行: python setup_config.py"
    return True, cfg, f"所有字段齐全（公众号: {cfg['mp_name']}）"


def check_llm_link(cfg: dict):
    """探测 LLM-Link：只调用 /v1/models 列表接口，不消耗生图配额。"""
    base = cfg.get("llm_link_base_url", "https://www.llm-link.top").rstrip("/")
    key  = cfg.get("llm_link_api_key", "")
    url  = base + "/v1/models"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {key}",
        "User-Agent": UA,
    })
    try:
        with _NO_PROXY.open(req, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))
            n = len(data.get("data", []))
            return True, f"LLM-Link 可达，{n} 个模型可用"
    except urllib.error.HTTPError as e:
        return False, f"LLM-Link HTTP {e.code}（key 可能无效）"
    except Exception as e:
        return False, f"LLM-Link 连接失败: {type(e).__name__}"


def check_wechat(cfg: dict):
    """获取 access_token 测试微信 AppID/Secret。"""
    appid  = cfg.get("wechat_app_id", "")
    secret = cfg.get("wechat_app_secret", "")
    url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}"
    try:
        with _NO_PROXY.open(url, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))
            if "access_token" in data:
                return True, f"微信 token 获取成功（有效期 {data.get('expires_in', '?')}s）"
            errcode = data.get("errcode")
            errmsg  = data.get("errmsg", "")
            if errcode == 40164:
                return False, f"40164 IP 白名单未配置: {errmsg}，把报错中的 IP 加到公众号后台白名单"
            return False, f"errcode={errcode} {errmsg}"
    except Exception as e:
        return False, f"微信 API 连接失败: {type(e).__name__}"


def main():
    print("=" * 60)
    print("MT图解百科 · 环境自检")
    print("=" * 60)

    root = os.path.dirname(os.path.abspath(__file__))
    checks = []

    # 1. Python
    ok, msg = check_python()
    checks.append(("Python 版本", ok, msg))

    # 2. pillow
    ok, msg = check_pillow()
    checks.append(("pillow 依赖", ok, msg))

    # 3. 配置
    ok, cfg, msg = check_config(root)
    checks.append((".kg-config.json", ok, msg))

    if ok and cfg:
        # 4. LLM-Link
        ok2, msg2 = check_llm_link(cfg)
        checks.append(("LLM-Link API 连通性", ok2, msg2))

        # 5. 微信
        ok3, msg3 = check_wechat(cfg)
        checks.append(("微信公众平台凭证", ok3, msg3))

    print()
    all_ok = True
    for name, ok, msg in checks:
        mark = "✓" if ok else "✗"
        print(f"  [{mark}] {name}: {msg}")
        if not ok:
            all_ok = False

    print()
    print("=" * 60)
    if all_ok:
        print("✓ 所有检查通过，可以开始制作系列。")
        print("  推荐入口：阅读 START-HERE.md")
    else:
        print("✗ 有检查未通过，按上述提示修复后再试。")
    print("=" * 60)
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
