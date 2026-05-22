---
layout: home

hero:
  name: LLM-Link
  text: 新一代大模型 API 网关
  tagline: 统一接入 40+ AI 服务商，一个密钥调用所有模型
  image:
    src: /logo.png
    alt: LLM-Link
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/1-register
    - theme: alt
      text: 前往控制台
      link: https://www.llm-link.top

features:
  - icon: 🔑
    title: 统一 API 密钥
    details: 单一域名和密钥接入 OpenAI、Claude、Gemini、DeepSeek 等 40+ 主流大模型服务商，无缝切换模型。
  - icon: 💰
    title: 灵活计费策略
    details: 支持按 Token 计费、按次计费、固定价格。模型倍率可自定义，充值即用，余额实时可查。
  - icon: 🔄
    title: 智能路由与重试
    details: 渠道加权随机分发，失败自动切换备用渠道，保障业务高可用，无需关心上游稳定性。
  - icon: 🌐
    title: 多格式协议支持
    details: 兼容 OpenAI / Claude / Gemini 原生格式，支持格式互转，现有代码零修改接入。
  - icon: 📊
    title: 可观测性
    details: 实时监控调用量、错误率、费用，支持 Token 级别用量分析，清晰掌握 AI 成本。
  - icon: 🔒
    title: 多租户权限管理
    details: 支持令牌分组、模型访问限制、用量配额，适合团队共享和多项目管理。
---

<div class="home-extra">

<!-- ===== 三步上手 ===== -->
<section class="steps-section">
  <div class="section-header">
    <div class="section-badge">快速上手</div>
    <h2 class="section-title">三步开始使用</h2>
    <p class="section-desc">无论你是开发者还是完全的新手，跟着以下步骤即可在 5 分钟内完成接入</p>
  </div>
  <div class="steps-grid">
    <a href="/guide/1-register" class="step-card">
      <div class="step-number">01</div>
      <div class="step-icon-wrap" style="background:rgba(99,102,241,0.1);color:#6366f1">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      </div>
      <div class="step-title">注册并充值</div>
      <div class="step-desc">使用 GitHub 或邮箱注册账号，按需充值额度（1 元 = 1 美元额度）</div>
      <div class="step-link">去注册 →</div>
    </a>
    <a href="/guide/4-token" class="step-card">
      <div class="step-number">02</div>
      <div class="step-icon-wrap" style="background:rgba(34,197,94,0.1);color:#22c55e">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <div class="step-title">创建 API 令牌</div>
      <div class="step-desc">在控制台创建令牌，<strong>务必选择对应用途的分组</strong>，这是最关键的一步</div>
      <div class="step-link">看教程 →</div>
    </a>
    <a href="/guide/5-cli" class="step-card">
      <div class="step-number">03</div>
      <div class="step-icon-wrap" style="background:rgba(245,158,11,0.1);color:#f59e0b">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      </div>
      <div class="step-title">填入工具开始用</div>
      <div class="step-desc">将 API Base URL 和密钥填入 Claude Code、Codex、Cherry Studio 等工具，立即可用</div>
      <div class="step-link">配置工具 →</div>
    </a>
  </div>
  <div class="api-info-bar">
    <div class="api-info-item">
      <span class="api-info-label">API Base URL</span>
      <code class="api-info-code">https://www.llm-link.top</code>
    </div>
    <div class="api-info-divider"></div>
    <div class="api-info-item">
      <span class="api-info-label">密钥格式</span>
      <code class="api-info-code">sk-xxxxxxxxxxxxxxxx</code>
    </div>
    <div class="api-info-divider"></div>
    <div class="api-info-item">
      <span class="api-info-label">协议兼容</span>
      <code class="api-info-code">OpenAI / Claude / Gemini</code>
    </div>
  </div>
</section>

<!-- ===== 分组选择 ===== -->
<section class="group-section">
  <div class="section-header">
    <div class="section-badge">分组指南</div>
    <h2 class="section-title">我该选哪个分组？</h2>
    <p class="section-desc">创建令牌时选错分组是新手最常见的问题，对照下表选择即可</p>
  </div>
  <div class="group-grid">
    <div class="group-card group-card--blue">
      <div class="group-card-header">
        <div class="group-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <div class="group-tool">Claude Code</div>
      </div>
      <div class="group-tags">
        <span class="group-tag group-tag--primary">cc-sale <em>0.9x 推荐</em></span>
        <span class="group-tag">cc <em>2.5x 稳定</em></span>
      </div>
      <div class="group-tip">性价比首选 cc-sale，对稳定性要求高选 cc</div>
    </div>
    <div class="group-card group-card--green">
      <div class="group-card-header">
        <div class="group-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </div>
        <div class="group-tool">OpenAI Codex</div>
      </div>
      <div class="group-tags">
        <span class="group-tag group-tag--primary">codex-sale <em>0.8x 推荐</em></span>
        <span class="group-tag">codex <em>1x 标准</em></span>
      </div>
      <div class="group-tip">codex-sale 同时支持 Codex、CC 和工具调用</div>
    </div>
    <div class="group-card group-card--purple">
      <div class="group-card-header">
        <div class="group-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        </div>
        <div class="group-tool">通用 API 开发</div>
      </div>
      <div class="group-tags">
        <span class="group-tag group-tag--primary">default <em>1x 通用</em></span>
      </div>
      <div class="group-tip">适合普通 API 调用，含部分免费模型可试用</div>
    </div>
    <div class="group-card group-card--orange">
      <div class="group-card-header">
        <div class="group-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        </div>
        <div class="group-tool">视频生成</div>
      </div>
      <div class="group-tags">
        <span class="group-tag group-tag--primary">doubao-seed <em>1x</em></span>
      </div>
      <div class="group-tip">豆包视频生成专属分组，高清无水印输出</div>
    </div>
  </div>
  <div class="group-footer">
    <a href="/models/2-group" class="group-more-link">查看完整分组与模型说明 →</a>
  </div>
</section>

<!-- ===== 平台政策 ===== -->
<section class="policy-section">
  <div class="section-header">
    <div class="section-badge">平台政策</div>
    <h2 class="section-title">透明、可信赖</h2>
    <p class="section-desc">没有隐藏费用，按量付费，用多少充多少</p>
  </div>
  <div class="policy-grid">
    <div class="policy-card">
      <div class="policy-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <div class="policy-title">1 元 = 1 美元额度</div>
      <div class="policy-desc">人民币直接充值，汇率 1:1，无任何手续费和隐藏扣款</div>
    </div>
    <div class="policy-card">
      <div class="policy-icon" style="background:rgba(34,197,94,0.1);color:#22c55e">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div class="policy-title">支持无理由退款</div>
      <div class="policy-desc">退款金额 = 实充金额 − 实际消耗金额，联系客服即可申请</div>
    </div>
    <div class="policy-card">
      <div class="policy-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <div class="policy-title">邀请好友返 10%</div>
      <div class="policy-desc">好友通过你的链接注册并充值，你获得充值金额 10% 的返利</div>
    </div>
    <div class="policy-card">
      <div class="policy-icon" style="background:rgba(239,68,68,0.1);color:#ef4444">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <div class="policy-title">支持开具发票</div>
      <div class="policy-desc">满 50 元可申请开票，联系企业微信客服或 QQ 群管理员办理</div>
    </div>
  </div>
</section>

<!-- ===== 联系我们 ===== -->
<section class="contact-section">
  <div class="section-header">
    <div class="section-badge">联系我们</div>
    <h2 class="section-title">遇到问题？随时找我们</h2>
    <p class="section-desc">遇到问题优先查阅文档，未能解决请通过以下方式联系我们</p>
  </div>
  <div class="contact-cards">
    <div class="contact-card">
      <div class="contact-card-icon" style="background:rgba(9,182,109,0.1);color:#09b66d">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div class="contact-card-title">企业微信客服</div>
      <img src="https://test-1258105840.cos.ap-chengdu.myqcloud.com/kefu.png" alt="企业微信客服二维码" class="contact-qrcode" />
      <div class="contact-card-desc">扫码添加客服<br>咨询业务、申请开票、退款等</div>
    </div>
    <div class="contact-card">
      <div class="contact-card-icon" style="background:rgba(99,102,241,0.1);color:#6366f1">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
      </div>
      <div class="contact-card-title">QQ 交流群</div>
      <div class="contact-qq">
        <div class="contact-qq-name">llm-link-02</div>
        <div class="contact-qq-num">群号：1102925294</div>
      </div>
      <div class="contact-card-desc">技术答疑 / 活动通知 / 故障反馈<br>查看群公告获取最新动态</div>
    </div>
    <div class="contact-card">
      <div class="contact-card-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
      </div>
      <div class="contact-card-title">使用文档</div>
      <div class="contact-doc-links">
        <a href="/guide/1-register" class="contact-doc-link">注册与充值</a>
        <a href="/guide/4-token" class="contact-doc-link">创建令牌</a>
        <a href="/guide/5-cli" class="contact-doc-link">配置 CLI 工具</a>
        <a href="/faq/CC" class="contact-doc-link">常见问题 FAQ</a>
        <a href="/models/2-group" class="contact-doc-link">分组说明</a>
        <a href="/api-guide/1-quickstart" class="contact-doc-link">API 快速上手</a>
      </div>
      <div class="contact-card-desc">遇到问题先查文档，80% 的问题都有答案</div>
    </div>
  </div>
</section>

</div>

<style>
/* ===== 全局容器 ===== */
.home-extra {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

/* ===== section 通用 ===== */
.steps-section,
.group-section,
.policy-section,
.contact-section {
  margin-top: 80px;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 999px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 10px;
  border: none;
  padding: 0;
}

.section-desc {
  font-size: 15px;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
}

/* ===== 三步上手 ===== */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.step-card {
  position: relative;
  display: block;
  padding: 28px 24px 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.step-card:hover {
  border-color: #6366f1;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(99,102,241,0.12);
}

.step-number {
  position: absolute;
  top: 16px;
  right: 20px;
  font-size: 36px;
  font-weight: 800;
  color: var(--vp-c-divider);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.step-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.step-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
}

.step-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.65;
  margin-bottom: 16px;
}

.step-desc strong {
  color: #ef4444;
}

.step-link {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
}

/* API info bar */
.api-info-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0;
  padding: 16px 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.api-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
}

.api-info-divider {
  width: 1px;
  height: 20px;
  background: var(--vp-c-divider);
}

.api-info-label {
  font-size: 12px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.api-info-code {
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
  color: #6366f1;
  background: rgba(99,102,241,0.08);
  padding: 2px 8px;
  border-radius: 4px;
  border: none;
}

/* ===== 分组选择 ===== */
.group-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.group-card {
  padding: 22px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s, transform 0.2s;
}

.group-card:hover {
  transform: translateY(-2px);
}

.group-card--blue:hover  { border-color: #6366f1; }
.group-card--green:hover { border-color: #22c55e; }
.group-card--purple:hover{ border-color: #a855f7; }
.group-card--orange:hover{ border-color: #f59e0b; }

.group-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.group-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;
}

.group-card--blue   .group-icon { background: rgba(99,102,241,0.1); color: #6366f1; }
.group-card--green  .group-icon { background: rgba(34,197,94,0.1);  color: #22c55e; }
.group-card--purple .group-icon { background: rgba(168,85,247,0.1); color: #a855f7; }
.group-card--orange .group-icon { background: rgba(245,158,11,0.1); color: #f59e0b; }

.group-tool {
  font-size: 16px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.group-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}

.group-tag em {
  font-style: normal;
  font-size: 11px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-base);
}

.group-tag--primary {
  background: rgba(99,102,241,0.08);
  border-color: rgba(99,102,241,0.3);
  color: #6366f1;
}

.group-tag--primary em { color: rgba(99,102,241,0.7); }

.group-tip {
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.group-footer {
  text-align: center;
  margin-top: 20px;
}

.group-more-link {
  font-size: 14px;
  font-weight: 600;
  color: #6366f1;
  text-decoration: none;
  border-bottom: 1px solid rgba(99,102,241,0.3);
  padding-bottom: 2px;
  transition: border-color 0.2s;
}

.group-more-link:hover {
  border-color: #6366f1;
}

/* ===== 平台政策 ===== */
.policy-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.policy-card {
  padding: 24px 20px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  text-align: center;
  transition: border-color 0.2s, transform 0.2s;
}

.policy-card:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
}

.policy-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin: 0 auto 14px;
}

.policy-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
}

.policy-desc {
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

/* ===== 联系我们 ===== */
.contact-section {
  margin-top: 80px;
}

.contact-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.contact-card {
  padding: 28px 24px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  text-align: center;
  transition: border-color 0.2s, transform 0.2s;
}

.contact-card:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
}

.contact-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin: 0 auto 14px;
}

.contact-card-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.contact-qrcode {
  width: 160px;
  height: 160px;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
  padding: 6px;
  margin: 0 auto 14px;
  display: block;
  border: 1px solid var(--vp-c-divider);
}

.contact-qq {
  width: 160px;
  height: 160px;
  margin: 0 auto 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  color: #fff;
  border-radius: 8px;
}

.contact-qq-name {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
}

.contact-qq-num {
  font-size: 13px;
  opacity: 0.9;
  font-variant-numeric: tabular-nums;
}

.contact-card-desc {
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.7;
}

.contact-doc-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 14px;
}

.contact-doc-link {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.15s, color 0.15s;
}

.contact-doc-link:hover {
  border-color: #6366f1;
  color: #6366f1;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .steps-grid {
    grid-template-columns: 1fr;
  }
  .group-grid {
    grid-template-columns: 1fr;
  }
  .policy-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .contact-cards {
    grid-template-columns: 1fr;
  }
  .api-info-bar {
    flex-direction: column;
    gap: 10px;
  }
  .api-info-divider {
    width: 40px;
    height: 1px;
  }
}

@media (max-width: 480px) {
  .policy-grid {
    grid-template-columns: 1fr;
  }
  .section-title {
    font-size: 22px;
  }
}
</style>
