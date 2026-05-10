# 创建 API 令牌

API 令牌是调用 LLM-Link 接口的凭证，请在控制台完成创建。

## 创建步骤

1. 登录 [LLM-Link 控制台](https://www.llm-link.top)
2. 点击左侧菜单「令牌管理」
3. 点击右上角「添加令牌」按钮
4. 填写以下配置项，完成后点击右下角提交

![令牌管理页面](/images/guide/token-list.png)

## 配置说明

| 配置项 | 说明 |
|--------|------|
| **令牌名称** | 便于识别的名称，如「生产环境」或「测试项目」 |
| **令牌分组** | **极为重要**，必须选择正确的分组，否则将无法正常使用 |
| **过期时间** | 留空表示永不过期 |
| **额度限制** | 限制该令牌的最大消费额度，0 表示不限制 |
| **模型限制列表** | 限制可调用的模型范围，留空表示不限制 |

![创建令牌表单](/images/guide/token-create-form.png)

## 分组选择指南

创建令牌时**必须**选择对应用途的分组：

| 分组 | 适用工具 | 倍率 | 说明 |
|------|---------|------|------|
| **cc** | Claude Code | 2.5x | 高质量 CC 分组，智商在线，高效稳定 |
| **cc-sale** | Claude Code | 0.9x | CC 特价分组，性价比首选 |
| **codex** | OpenAI Codex | 1x | Codex 专用分组 |
| **codex-sale** | OpenAI Codex / CC | 0.8x | GPT 特价分组，支持 Codex、CC 和工具调用 |
| **default** | 通用 | 1x | 默认分组，可用部分免费模型 |
| **doubao-seed** | 视频生成 | 1x | 视频生成，高清无水印 |
| **vip** | 企业 | 1x | 企业客户专属分组 |

![创建令牌 - 分组选择](/images/guide/token-create-group.png)

::: danger 令牌分组非常关键
令牌分组直接决定你能调用哪些模型和渠道，**请务必选择正确的分组**。
如不清楚各分组的用途，请先阅读 [令牌分组介绍](/models/2-group)。
:::

## 使用令牌

创建后你将获得一个以 `sk-` 开头的令牌字符串。调用 API 时将其作为 `Authorization` 请求头传入：

```
Authorization: Bearer sk-xxxxxxxxxxxxxxxx
```

API Base URL：
```
https://www.llm-link.top
```

## 下一步

获得令牌后，继续 [配置 CLI 工具](./5-cli)。
