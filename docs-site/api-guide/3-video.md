# 视频生成指南

视频生成采用**异步任务**模式：先提交任务获取 `task_id`，再轮询状态，完成后取结果。

::: warning 仅支持异步接口
视频生成**不支持同步返回**，必须通过创建任务 → 查询状态 → 获取结果三步完成。
:::

## 接口路由一览

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/v1/videos` | 创建视频生成任务，返回 `task_id` |
| `GET` | `/v1/videos/{task_id}` | 查询任务状态、进度、错误信息 |
| `GET` | `/v1/videos/{task_id}/content` | 获取已完成任务的视频 URL |

---

## 第一步：创建任务

```bash
curl https://www.llm-link.top/v1/videos \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seedance-1-5-pro-251215",
    "prompt": "一只猫在草地上追蝴蝶，阳光明媚 -ratio=16:9 -resolution=720p",
    "seconds": "5"
  }'
```

**返回示例：**

```json
{
  "id": "cgt-20251226230516-jqlrf::seedance-1-5-pro-251215",
  "object": "video",
  "model": "seedance-1-5-pro-251215",
  "status": "queued",
  "progress": 0,
  "created_at": 1766761516,
  "seconds": "5"
}
```

记录返回的 `id` 字段，后续查询需要用到。

---

## 第二步：查询任务状态

```bash
curl https://www.llm-link.top/v1/videos/{task_id} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**状态值说明：**

| status | 含义 |
|--------|------|
| `queued` | 排队等待中 |
| `processing` | 生成中 |
| `completed` | 已完成，可取视频 |
| `failed` | 生成失败，见 `error` 字段 |

**completed 状态返回示例：**

```json
{
  "id": "cgt-20251226230516-jqlrf::seedance-1-5-pro-251215",
  "object": "video",
  "model": "seedance-1-5-pro-251215",
  "status": "completed",
  "content": {
    "video_url": "https://example.com/video.mp4"
  },
  "progress": 100,
  "created_at": 1766761516,
  "completed_at": 1766761583
}
```

---

## 第三步：获取视频内容

任务状态为 `completed` 后调用，返回视频 URL 或视频流：

```bash
curl https://www.llm-link.top/v1/videos/{task_id}/content \
  -H "Authorization: Bearer YOUR_API_KEY"
```

::: warning 视频 URL 有效期
返回的视频链接有效期约为 **7 天**，请及时下载保存，过期后无法再次访问。
:::

---

## 支持的模型

| 模型名 | 时长范围 | 底图数量 | 备注 |
|--------|---------|---------|------|
| `doubao-seedance-1-5-pro-251215` | 4–12s | 最多 2 张 | 支持音频生成 |
| `doubao-seedance-1-0-pro-250528` | 2–12s | 最多 2 张 | 通常作为首帧/尾帧 |
| `doubao-seedance-1-0-pro-fast-251015` | 2–12s | 最多 1 张 | 速度更快 |

---

## prompt 高级参数

通过在 `prompt` 末尾追加参数控制视频属性，格式为 `-参数名=值`：

| 参数 | 示例 | 说明 |
|------|------|------|
| `-ratio` | `-ratio=16:9` | 视频比例，支持：`21:9`、`16:9`、`4:3`、`1:1`、`3:4`、`9:16` |
| `-resolution` | `-resolution=720p` | 分辨率，支持 `480p`、`720p`；`doubao-seedance-1-5-pro-251215` 仅支持 `480p`/`720p`，其他模型还支持 `1080p` |
| `-watermark` | `-watermark=false` | 水印，默认 `false` |
| `-generate_audio` | `-generate_audio=true` | 生成音频，**仅 doubao-seedance-1-5-pro-251215 支持** |

**完整 prompt 示例：**

```
一只猫在海边追海浪，夕阳西下，慢动作效果 -ratio=16:9 -resolution=720p -watermark=false
```

---

## 传入底图（首帧/尾帧）

使用 `input_reference` 字段传入参考图，支持 URL 或 base64：

```json
{
  "model": "doubao-seedance-1-5-pro-251215",
  "prompt": "从这只猫开始，让它慢慢走向远方 -ratio=16:9",
  "seconds": "5",
  "input_reference": [
    { "type": "image_url", "image_url": { "url": "https://example.com/cat.jpg" } }
  ]
}
```

::: tip 两张图作为首尾帧
传入两张图时，第一张作为首帧，第二张作为尾帧，模型会生成两帧之间的过渡视频。
:::

---

## 视频续写（Sora 扩展视频）

使用 Sora 系列模型可对已有视频进行续写：

```json
{
  "model": "sora",
  "prompt": "继续让场景变得更壮观",
  "generate_audio": true,
  "video": "https://example.com/existing-video.mp4"
}
```

::: info
`video` 字段只支持传入一个视频（URL 或 base64），且 `generate_audio` 必须设为 `true`。
:::

---

## Python 完整示例

```python
import time
import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://www.llm-link.top/v1"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# 第一步：创建任务
resp = requests.post(f"{BASE_URL}/videos", headers=HEADERS, json={
    "model": "doubao-seedance-1-5-pro-251215",
    "prompt": "一只猫在草地上追蝴蝶 -ratio=16:9 -resolution=720p",
    "seconds": "5",
})
task_id = resp.json()["id"]
print(f"任务已提交，ID: {task_id}")

# 第二步：轮询状态
while True:
    status_resp = requests.get(f"{BASE_URL}/videos/{task_id}", headers=HEADERS)
    data = status_resp.json()
    status = data["status"]
    progress = data.get("progress", 0)
    print(f"状态: {status} | 进度: {progress}%")

    if status == "completed":
        video_url = data["content"]["video_url"]
        print(f"生成完成！视频链接：{video_url}")
        break
    elif status == "failed":
        print(f"生成失败：{data.get('error')}")
        break

    time.sleep(5)  # 每 5 秒轮询一次
```

---

## 中转接入说明（Sora 渠道）

如需通过其他工具中转调用 Sora，渠道类型选择 **sora 渠道**，URL 直接填写本站地址即可，无需额外配置。
