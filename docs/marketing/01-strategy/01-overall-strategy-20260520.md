# LLM-Link 拉新方案

> 官方地址：https://www.llm-link.top
> 邀请链接：https://www.llm-link.top/register?aff=3Us3
> QQ 群：1102925294

---

## 一、活动概览

| 项目 | 内容 |
|------|------|
| 核心钩子 | **充值5折**（充多少到账双倍额度，简单直白） |
| 单笔充值 | **¥10 起充，每笔最高 ¥500**（全系活动与设计须遵守） |
| 邀请返利 | 被邀请人充值后，邀请人获 10% 返利，30 天后到账 |
| 计费基准 | 1 元 = 1 美元额度，支付宝 / 微信直充 |
| 话术与合规 | 对外说明**简单直白**；优惠与到账以控制台为准；**真实宣传**、守法（详见 playbook） |
| 主推工具 | Claude Code、Codex CLI |

---

## 二、价格定位（统一口径）

| 分组 | 倍率 | 用途 |
|------|------|------|
| `cc` | 2.0x | Claude Code 高质量专线（稳定优先） |
| `cc-sale` | 低至 0.8x | Claude 性价比版（日常开发首选） |
| `codex` | 0.6x | Codex CLI 专用，OpenAI 全系列 |
| `codex-sale` | 低至 0.4x | GPT 极致低价，批量调用首选 |
| `default` | 1x | DeepSeek / Mistral / Moonshot / 智谱等，含免费模型 |
| `doubao-seed` | 1x | 豆包 wan2.6 视频生成，高清无水印 |

**实测代表价格**（cc-sale 分组，claude-opus-4-7）：
- 输入 ¥4 / 1M tokens，输出 ¥20 / 1M tokens
- 充值5折后等效折算（以充 ¥200 为例，到账 $400）：输入约 ¥2.0 / 1M，输出约 ¥10 / 1M

**对比参考**：官方 Max 20x 订阅约 ¥1,450/月（重度用户仍超额）；走 cc-sale + 充值5折（充 ¥200 到账 $400）后，中度用户实测约 ¥260/月。

> ⚠️ 文案中所有定价、活动表述务必与本节一致。如有调整，先改这里再同步到 [articles.md](./articles.md) 和 [social-copy.md](./social-copy.md)。

> 若评估「更低充值折算 + 分组倍率」的组合促销、阶梯加赠或强数字投流钩子，请先读 [03-pricing-promotion-playbook-20260520.md](./03-pricing-promotion-playbook-20260520.md)，避免口径漂移与信任成本失控。

---

## 三、目标人群与痛点

| 人群 | 痛点 | LLM-Link 解法 |
|------|------|--------------|
| Claude Code 重度用户 | 官方 Max 不够用、汇率手续费高 | cc-sale + Prompt Caching，月成本压到 ¥260 起 |
| Codex CLI 用户 | 国内访问不稳定 | codex-sale 0.4x，按量计费 |
| 多模型 AI 开发者 | 多家账号 / 密钥管理混乱 | 一个 Key 接 40+ 模型 |
| 独立开发者 / 接外包 | 项目波动大，订阅浪费 | 按用量付费，无包月 |
| Cherry Studio / Cline 用户 | 找统一入口 | default 分组兼容 OpenAI / Anthropic 协议 |

**差异化卖点**：邀请制注册 → 用户规模可控 → 渠道带宽有保障，高峰期不易 502。

---

## 四、内容发布时间表

| 周次 | 平台 | 内容类型 | 关键动作 |
|------|------|---------|---------|
| 第 1 周 | V2EX | 长帖 | 文章一/三（踩坑 / 横评），重点讲分组与价格 |
| 第 1 周 | 即刻 | 动态 ×2 | 短文案（晒账单、工具分享） |
| 第 1 周 | Twitter / X | 推文 ×3 | 英文，挂 #ClaudeCode #LLM #AITools |
| 第 2 周 | Reddit | 长帖 | r/ClaudeAI、r/ChatGPT 各一帖（含 referral 披露） |
| 第 2 周 | 掘金 / CSDN | 教程文章 | 文章四（接入教程） |
| 第 2 周 | Discord | 5–10 个 AI 群 | 短消息分享 |
| 第 3 周 | 知乎 | 回答 ×5 | 自然植入到相关问题 |
| 第 3 周 | GitHub | Discussions | 在 Claude Code / Codex 等仓库自然评论 |
| 第 4 周 | 小红书 / B 站 | 笔记 / 动态 | 文章二（省钱攻略） |
| 持续 | 全平台 | 互动 | 跟进评论，提升帖子热度 |

文案素材：长文见 [articles.md](./articles.md)，短文案见 [social-copy.md](./social-copy.md)。

---

## 五、SEO 关键词

**中文**：Claude API 国内代理、Claude Code 中转、Claude Code 省钱、ChatGPT API 便宜替代、AI API 聚合、DeepSeek API、人民币充值 API、大模型 API 网关

**英文**：Claude API proxy、OpenAI API alternative、LLM API gateway、Claude Code cheap API、GPT-5 API access、AI API aggregator

---

## 六、邀请裂变机制

```
用户A 分享链接 → 用户B 注册 → 用户B 充值 ¥100
                                    ↓
                          用户A 获得 ¥5 返利（5%）
                          30 天后自动到账，可转余额
```

**KOL 合作思路**：
- 用返利激励技术博主以自己的邀请链接推广
- 优先定向：Claude Code 经验分享者、AI 工具测评博主、独立开发者博主
- 博主收益持续累积，形成被动收入

---

## 七、风险与执行注意

1. **不在无关帖 / 群 Spam**：精准投放，避免被封禁
2. **透明披露**：Reddit / GitHub 等需声明是推荐链接
3. **小额充值话术**：始终建议读者每次充 ¥100–200，不一次充太多——防跑路顾虑要主动接住
4. **真实性原则**：负面信息（行业有跑路、新号 karma 限制等）保留，提升可信度
5. **回复响应**：发帖后 24h 内积极回评，提升排名

---

## 八、快速启动 Checklist

- [ ] 各平台账号注册完成（见 [channels.md](./channels.md)）
- [ ] 后台「充值5折」活动开启（全档位统一双倍到账）
- [ ] 即刻发第一条短文案（[social-copy.md](./social-copy.md) #4 或 #22）
- [ ] Twitter 发英文推文 ×3
- [ ] V2EX 发文章三（横评）
- [ ] Reddit r/ClaudeAI 发英文帖
- [ ] 掘金 / CSDN 发文章四（接入教程）
- [ ] 加入 Discord 相关社群并参与
- [ ] 知乎找 5 个相关问题回答
- [ ] 联系 1–2 位 AI 工具博主合作

---

## 九、数据追踪

| 指标 | 目标 | 来源 |
|------|------|------|
| 新注册用户数 | 月增 100+ | 控制台用户统计 |
| 邀请链接转化率 | > 20% | 邀请关系统计 |
| 首充用户比例 | > 30% | 控制台账单 |
| 平均首充金额 | ≥ ¥100（阶梯赠送主推 ¥100-200 档） | 控制台账单 |
| 邀请裂变系数 | > 1.2 | 二级邀请关系 |
