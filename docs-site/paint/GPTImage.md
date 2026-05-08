# GPT-Image-2 绘图教程

`gpt-image-2` 模型属于 **Sora 分组**，使用前需创建 `sora` 分组的令牌。

## 调用方式

### 方式一：Images API（推荐）

使用 OpenAI 标准 `/v1/images/generations` 端点。

**请求示例：**

```bash
curl https://www.llm-link.top/v1/images/generations \
  -H "Authorization: Bearer sk-xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "一只在草地上奔跑的柴犬",
    "n": 1,
    "size": "1024x1024"
  }'
```

**主要参数：**

| 参数 | 说明 |
|------|------|
| `model` | 固定为 `gpt-image-2` |
| `prompt` | 图片描述提示词 |
| `n` | 生成数量，默认 1 |
| `size` | 图片尺寸 |
| `quality` | 质量：`low` / `medium` / `high` / `auto`（默认） |

**支持的尺寸：**

- 常用：`1024×1024`、`1536×1024`、`1024×1536`、`2048×2048`
- 宽屏：`2048×1152`、`3840×2160`
- 约束：最大边长 ≤ 3840px，尺寸须为 16 的倍数，宽高比 ≤ 3:1

### 方式二：Chat Completions API

使用 `/v1/chat/completions` 端点，适用于仅支持 Chat 格式的客户端，返回结果为 Markdown 格式的图片 URL。

## 在 Cherry Studio 中使用

1. 创建 **sora 分组**令牌并复制 ApiKey

2. 打开 Cherry Studio → 设置 → 模型服务 → 添加供应商

3. 填写供应商名称，类型选择「New API」

![Cherry Studio 添加供应商](/images/paint/gptimage-step3-provider.png)

4. 填写 ApiKey 和地址 `https://www.llm-link.top`

5. 管理模型，搜索并添加 `gpt-image-2`

![搜索并添加 gpt-image-2](/images/paint/gptimage-step5-addmodel.png)

6. 编辑模型，将端点类型设置为「图像生成（OpenAI）」

![设置端点类型](/images/paint/gptimage-step6-endpoint.png)

7. 返回首页，新建「绘画」应用

![新建绘画应用](/images/paint/gptimage-step7-newapp.png)

8. 选择配置好的供应商和模型，模式选「绘图」

9. 输入提示词开始生成

![生成效果示例](/images/paint/gptimage-result.png)

::: tip 使用建议
- API 地址不要加 `/v1`
- 在聊天中直接调用时建议关闭流式输出
- 使用专用「绘画」应用效果更佳
- 初次使用建议将尺寸/质量/灵敏度均设置为「自动」
:::
