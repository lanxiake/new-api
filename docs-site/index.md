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

<div class="contact-section">

## 联系我们

加入 QQ 群与添加企业微信客服，可获取最新动态、技术支持以及开票协助。

<div class="contact-cards">
  <div class="contact-card">
    <div class="contact-card-title">企业微信客服</div>
    <img src="https://test-1258105840.cos.ap-chengdu.myqcloud.com/kefu.png" alt="企业微信客服二维码" class="contact-qrcode" />
    <div class="contact-card-desc">扫码添加客服，咨询业务与开票</div>
  </div>
  <div class="contact-card">
    <div class="contact-card-title">QQ 交流群</div>
    <div class="contact-qq">
      <div class="contact-qq-name">llm-link-02</div>
      <div class="contact-qq-num">群号：1102925294</div>
    </div>
    <div class="contact-card-desc">查看群公告获取最新通知，开票请联系群管理员</div>
  </div>
</div>

</div>

<style>
.contact-section {
  max-width: 1152px;
  margin: 64px auto 0;
  padding: 0 24px;
}
.contact-section h2 {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
  font-size: 28px;
  text-align: center;
}
.contact-section > p {
  text-align: center;
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
}
.contact-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 64px;
}
.contact-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: border-color 0.2s, transform 0.2s;
}
.contact-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}
.contact-card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--vp-c-text-1);
}
.contact-qrcode {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  margin: 0 auto 16px;
  display: block;
}
.contact-qq {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: #fff;
  border-radius: 8px;
  padding: 16px;
}
.contact-qq-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.contact-qq-num {
  font-size: 14px;
  opacity: 0.9;
  font-variant-numeric: tabular-nums;
}
.contact-card-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
</style>
