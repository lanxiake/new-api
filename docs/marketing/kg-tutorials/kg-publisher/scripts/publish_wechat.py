"""
MT图解百科 · 公众号草稿发布脚本
将 wechat.md（含 frontmatter）发布到微信公众号草稿箱。
脚本只存草稿，不群发，人工在后台审核后再推送。

用法：
  WECHAT_APP_ID="wx..." WECHAT_APP_SECRET="..." python publish_wechat.py wechat.md

图片说明：
  - 封面图：上传为永久素材（add_material），取 media_id 作为 thumb_media_id
  - 正文图：上传为临时可引用素材（media/uploadimg），直接取返回的 url 嵌入 HTML
"""

import json
import os
import re
import sys
import urllib.request

APP_ID     = os.environ.get("WECHAT_APP_ID", "")
APP_SECRET = os.environ.get("WECHAT_APP_SECRET", "")
UA         = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
API_BASE   = "https://api.weixin.qq.com/cgi-bin"


def log(msg):
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode("ascii", "replace").decode())


def http_get(url):
    req  = urllib.request.Request(url, headers={"User-Agent": UA})
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read())


def http_post(url, data: dict):
    payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
    req     = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": UA},
        method="POST",
    )
    resp = urllib.request.urlopen(req, timeout=60)
    return json.loads(resp.read())


def http_multipart(url: str, img_path: str) -> dict:
    """multipart/form-data 上传图片，返回解析后的 JSON。"""
    boundary = "----kg_boundary_20260601"
    img_data = open(img_path, "rb").read()
    fname    = os.path.basename(img_path)
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="media"; filename="{fname}"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode() + img_data + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}", "User-Agent": UA},
        method="POST",
    )
    resp = urllib.request.urlopen(req, timeout=60)
    return json.loads(resp.read())


def get_access_token() -> str:
    if not APP_ID or not APP_SECRET:
        sys.exit("[ERROR] WECHAT_APP_ID / WECHAT_APP_SECRET not set\n"
                 "请先运行 python setup_config.py 完成初始化配置")
    url  = f"{API_BASE}/token?grant_type=client_credential&appid={APP_ID}&secret={APP_SECRET}"
    data = http_get(url)
    if "access_token" not in data:
        sys.exit(f"[ERROR] get token failed: {data}")
    return data["access_token"]


def upload_cover(token: str, img_path: str) -> str:
    """封面图：上传永久图片素材，返回 media_id（用于 thumb_media_id）。"""
    url  = f"{API_BASE}/material/add_material?access_token={token}&type=image"
    data = http_multipart(url, img_path)
    if "media_id" not in data:
        sys.exit(f"[ERROR] upload cover failed: {data}")
    return data["media_id"]


def upload_body_image(token: str, img_path: str) -> str:
    """正文图：上传到素材库（uploadimg），返回可直接嵌入文章的永久 URL。"""
    url  = f"{API_BASE}/media/uploadimg?access_token={token}"
    data = http_multipart(url, img_path)
    if "url" not in data:
        sys.exit(f"[ERROR] upload body image failed ({os.path.basename(img_path)}): {data}")
    return data["url"]


def load_config(config_path: str) -> dict:
    """读取 .kg-config.json，返回配置字典；不存在则返回空字典。"""
    if os.path.exists(config_path):
        with open(config_path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def parse_wechat_md(path: str, config: dict) -> dict:
    """解析 wechat.md，返回 {title, author, summary, cover_path, html_raw, base_dir}。"""
    text = open(path, encoding="utf-8").read()
    base = os.path.dirname(os.path.abspath(path))

    fm_m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.DOTALL)
    if not fm_m:
        sys.exit("[ERROR] wechat.md missing frontmatter (--- block)")
    fm_raw, body = fm_m.group(1), fm_m.group(2).strip()

    def fm_val(key):
        m = re.search(rf"^{key}:\s*(.+)$", fm_raw, re.MULTILINE)
        return m.group(1).strip() if m else ""

    title   = fm_val("title")
    # 优先级：frontmatter author > config author > 公众号名称(config mp_name) > 默认
    author  = (fm_val("author")
               or config.get("author")
               or config.get("mp_name")
               or "MT图解百科")
    summary = fm_val("summary")
    cover   = fm_val("cover")
    cover_path = os.path.normpath(os.path.join(base, cover)) if cover else None

    # md → html：图片先占位
    html = body
    html = re.sub(r"^#{1,3}\s+(.+)$", r"<h3>\1</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    # 图片路径解析为绝对路径后写占位符
    html = re.sub(
        r"!\[([^\]]*)\]\(([^)]+)\)",
        lambda m: f'<!-- IMG:{os.path.normpath(os.path.join(base, m.group(2)))} -->',
        html,
    )
    paragraphs = []
    for line in html.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("<h3>") or line.startswith("<!--"):
            paragraphs.append(line)
        else:
            paragraphs.append(f"<p>{line}</p>")
    html = "\n".join(paragraphs)

    return {
        "title":      title,
        "author":     author,
        "summary":    summary,
        "cover_path": cover_path,
        "html_raw":   html,
        "base_dir":   base,
    }


def create_draft(token: str, article: dict) -> str:
    url  = f"{API_BASE}/draft/add?access_token={token}"
    data = {
        "articles": [{
            "title":                 article["title"],
            "author":                article["author"],
            "digest":                article["summary"][:120],
            "content":               article["content_html"],
            "thumb_media_id":        article["thumb_media_id"],
            "need_open_comment":     1,
            "only_fans_can_comment": 0,
        }]
    }
    result = http_post(url, data)
    if "media_id" not in result:
        sys.exit(f"[ERROR] create draft failed: {result}")
    return result["media_id"]


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python publish_wechat.py <wechat.md>")
    md_path = sys.argv[1]
    if not os.path.exists(md_path):
        sys.exit(f"[ERROR] file not found: {md_path}")

    # 读取配置（从技能包根目录的 .kg-config.json）
    script_dir  = os.path.dirname(os.path.abspath(__file__))
    root_dir    = os.path.normpath(os.path.join(script_dir, "..", ".."))
    config_path = os.path.join(root_dir, ".kg-config.json")
    config      = load_config(config_path)

    log("[step 1] parsing wechat.md ...")
    info = parse_wechat_md(md_path, config)
    log(f"  title:  {info['title']}")
    log(f"  author: {info['author']}")

    log("[step 2] getting access token ...")
    token = get_access_token()

    log("[step 3] uploading cover image (permanent material) ...")
    if not info["cover_path"] or not os.path.exists(info["cover_path"]):
        sys.exit(f"[ERROR] cover image not found: {info['cover_path']}")
    thumb_id = upload_cover(token, info["cover_path"])
    log(f"  cover media_id={thumb_id[:20]}...")

    log("[step 4] uploading body images (uploadimg -> url) ...")
    html = info["html_raw"]
    for m in re.finditer(r"<!-- IMG:([^>]+) -->", html):
        img_path = m.group(1).strip()
        if os.path.exists(img_path):
            img_url = upload_body_image(token, img_path)
            html = html.replace(
                m.group(0),
                f'<img src="{img_url}" style="max-width:100%;display:block;margin:0 auto"/>',
            )
            log(f"  [ok] {os.path.basename(img_path)} -> {img_url[:60]}...")
        else:
            log(f"  [warn] not found, skip: {img_path}")
            html = html.replace(m.group(0), "")

    log("[step 5] creating draft ...")
    media_id = create_draft(token, {
        "title":          info["title"],
        "author":         info["author"],
        "summary":        info["summary"],
        "content_html":   html,
        "thumb_media_id": thumb_id,
    })
    log(f"[OK] draft saved! media_id={media_id}")
    log("前往 mp.weixin.qq.com -> 内容管理 -> 草稿箱 审核后发布")


if __name__ == "__main__":
    main()
