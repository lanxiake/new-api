# API 快速上手

本页面帮助你在 5 分钟内完成第一次 API 调用，无论你是开发者还是新手用户都可以跟着步骤操作。

## 1. 接口地址

所有请求统一发送至以下地址（完全兼容 OpenAI 格式）：

```
https://www.llm-link.top/v1
```

::: tip 已有 OpenAI 代码？
只需把 `base_url` 替换为上方地址，`api_key` 替换为你在 LLM-Link 创建的令牌，其余代码**一行不用改**。
:::

## 2. 第一个请求（cURL）

将 `YOUR_API_KEY` 替换为你的令牌后直接运行：

```bash
curl https://www.llm-link.top/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "你好，请介绍一下你自己" }
    ]
  }'
```

成功后你会收到类似如下的 JSON 响应：

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "你好！我是一个大语言模型..."
    }
  }]
}
```

## 3. 开启流式输出（Streaming）

加上 `"stream": true` 即可实时输出，适合聊天界面场景：

```bash
curl https://www.llm-link.top/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{ "role": "user", "content": "写一首关于夏天的诗" }],
    "stream": true
  }'
```

响应格式为 `text/event-stream`，每行以 `data: ` 开头，最后以 `data: [DONE]` 结束。

## 4. Python 示例

::: code-group

```python [openai SDK]
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://www.llm-link.top/v1"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "你好！"}]
)
print(response.choices[0].message.content)
```

```python [流式输出]
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://www.llm-link.top/v1"
)

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "写一首关于夏天的诗"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

:::

## 5. Node.js / TypeScript 示例

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "YOUR_API_KEY",
  baseURL: "https://www.llm-link.top/v1",
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "你好！" }],
});

console.log(response.choices[0].message.content);
```

## 6. 常用模型参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `model` | string | 模型名称，如 `gpt-4o`、`claude-opus-4-5`、`gemini-3-pro` |
| `messages` | array | 对话历史，包含 `role`（user/assistant/system）和 `content` |
| `stream` | boolean | 是否开启流式输出，默认 `false` |
| `temperature` | float | 随机性，0~2，越高越有创意，默认 `1` |
| `max_tokens` | integer | 最大输出 token 数 |

## 7. 获取可用模型列表

```bash
curl https://www.llm-link.top/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

返回平台支持的所有模型 ID，可用于 `model` 参数。

## 接下来

- [图片生成指南 →](/api-guide/2-image)
- [视频生成指南 →](/api-guide/3-video)
- [创建 API 令牌 →](/guide/4-token)
