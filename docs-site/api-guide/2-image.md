# 图片生成指南

平台支持三种图片生成方式，适用于不同模型和场景。所有接口均在标准 OpenAI 格式基础上兼容扩展。

## 方式一：对话格式生成图片（v1/chat/completions）

直接在对话消息里描述图片，最简单的方式，支持图生图（传入底图）。

```bash
curl https://www.llm-link.top/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "messages": [
      { "role": "user", "content": "帮我画一只宇航猫在月球漫步[1024:1024]" }
    ]
  }'
```

::: tip 指定尺寸
在提示词末尾用英文方括号指定宽高像素，例如 `[1024:1024]`、`[1920:1080]`。使用英文 prompt 效果更好。
:::

### 图生图（传入底图）

格式与 OpenAI 官方视觉接口完全一致：

```json
{
  "model": "gpt-image-2",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "将图中的猫替换为一只狗" },
        { "type": "image_url", "image_url": { "url": "https://example.com/cat.jpg" } }
      ]
    }
  ]
}
```

---

## 方式二：专业文生图（v1/images/generations）

标准 DALL-E 格式，支持更多参数控制。

```bash
curl https://www.llm-link.top/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "flux.1-kontext-dev",
    "prompt": "a futuristic city at night, cyberpunk style",
    "size": "1024x1024",
    "n": 1,
    "response_format": "url"
  }'
```

| 参数 | 说明 |
|------|------|
| `model` | 模型名称，如 `flux.1-kontext-dev`、`gpt-image-2`、`doubao-seedream-4-0` |
| `prompt` | 描述图片内容的提示词 |
| `size` | 图片尺寸，如 `1024x1024`；不同模型支持的格式见下方各节 |
| `n` | 生成数量，默认 1 |
| `response_format` | `url`（返回图片链接）或 `b64_json`（返回 base64） |

---

## 方式三：图片编辑（v1/images/edits）

对已有图片进行局部修改，使用 `multipart/form-data` 格式上传。

```bash
curl https://www.llm-link.top/v1/images/edits \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "model=flux.1-kontext-dev" \
  -F "image=@/path/to/image.png" \
  -F "prompt=move the cat to a beach background" \
  -F "size=1024x1024" \
  -F "response_format=url"
```

---

## 各模型参数说明

### Qwen 系列绘图模型

> 模型名：`qwen-image-max`、`qwen-image-max-2025-12-30`、`qwen-image-plus`

- **只支持按比例输入 size**，不支持像素形式
- 支持的比例：`1:1`、`3:4`、`4:3`、`16:9`、`9:16`
- Chat 格式示例：在提示词中加入参数

```json
{
  "model": "qwen-image-max",
  "messages": [{ "role": "user", "content": "画一只小猫 -size=16:9" }]
}
```

- 编辑图片时不支持设置比例，输出尺寸与底图保持一致
- 单次最多支持 **3 张**底图

---

### 豆包绘图模型（doubao-seedream）

> 模型名：`doubao-seedream-4-0-250828`、`doubao-seedream-3-0-t2i-250415`

支持 chat 格式和 dalle 格式，参数通过 `-key=value` 方式在提示词或字段中传入。

**支持的 size 形式：**

| 输入形式 | 示例 | 说明 |
|----------|------|------|
| 档位 | `1k`、`2k`、`4k` | 原样返回对应分辨率 |
| 像素 | `1280x720` | 宽 1280~4096，高 720~4096，宽高比 1/16~16 |
| 比例 | `16:9` | 自动映射到推荐像素 |

**比例映射表：**

| 比例 | 推荐像素 |
|------|---------|
| `1:1` | 2048×2048 |
| `4:3` | 2304×1728 |
| `3:4` | 1728×2304 |
| `16:9` | 2560×1440 |
| `9:16` | 1440×2560 |
| `3:2` | 2496×1664 |
| `2:3` | 1664×2496 |
| `21:9` | 3024×1296 |

**Chat 格式完整示例（推荐）：**

```json
{
  "model": "doubao-seedream-4-0-250828",
  "messages": [
    {
      "role": "user",
      "content": "画一只猫在草原上奔跑 -size=2k -n=2 -type=normal -watermark=false"
    }
  ],
  "stream": false
}
```

**Chat 格式参数说明：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-type=normal` | 出图类型：`normal`（最多4张）或 `group`（最多10张，分镜一致性更强） | `normal` |
| `-n=1` | 出图数量 | `1` |
| `-size=1k` | 图片大小，支持档位/像素/比例三种形式 | `1k` |
| `-watermark=false` | 是否添加水印，`true` 表示右下角显示"AI生成" | `false` |

::: warning 注意
参数之间必须有空格，否则会解析失败。例如 `-size=2k -n=2` 正确，`-size=2k-n=2` 错误。
:::

**DALL-E 格式完整示例：**

```bash
curl https://www.llm-link.top/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seedream-4-0-250828",
    "prompt": "画一只猫在草原上奔跑",
    "size": "2k",
    "n": 1,
    "watermark": false,
    "type": "normal",
    "response_format": "url"
  }'
```

**group 模式示例（多分镜一致性）：**

```
生成 6 张 3:4 比例的分镜图，整体画风为 Q 版治愈风，内容讲述王子与公主的故事，
每张图作为一个分镜，画风统一，人物形象保持一致，连贯成小故事。
-size=3:4 -n=6 -type=group
```

---

### Grok 绘图模型

> 模型名：`grok-4.2-image`

- 支持 chat 格式和 dalle 格式
- 单次最多生成 **8 张**图片
- size 仅支持比例形式

**支持的比例：**
`auto`、`1:1`、`3:4`、`4:3`、`9:16`、`16:9`、`2:3`、`3:2`、`9:19.5`、`19.5:9`、`9:20`、`20:9`、`1:2`、`2:1`

**generations 接口示例：**

```json
{
  "model": "grok-4.2-image",
  "prompt": "a cat sitting on the moon",
  "size": "1:1",
  "n": 1,
  "response_format": "url"
}
```

**传入底图（URL 或 base64，多图用数组）：**

```json
{
  "model": "grok-4.2-image",
  "image": "https://example.com/photo.jpg",
  "prompt": "将背景替换为海边",
  "size": "1:1",
  "response_format": "url"
}
```

**edits 接口（二进制上传）：**

```bash
curl https://www.llm-link.top/v1/images/edits \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "model=grok-4.2-image" \
  -F "image=@/path/to/image.png" \
  -F "prompt=move to water" \
  -F "size=1:1" \
  -F "n=1" \
  -F "response_format=url"
```

---

## 返回结果处理

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://www.llm-link.top/v1"
)

response = client.images.generate(
    model="flux.1-kontext-dev",
    prompt="a futuristic city at night",
    size="1024x1024",
    response_format="url",
)

# 获取图片 URL
image_url = response.data[0].url
print(image_url)
```
