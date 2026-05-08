import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LLM-Link 文档',
  description: '新一代大模型 API 网关 · 统一接入 40+ AI 服务商',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/logo.png' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:title', content: 'LLM-Link 使用文档' }],
    ['meta', { property: 'og:description', content: '新一代大模型 API 网关 · 统一接入 40+ AI 服务商' }],
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'LLM-Link',

    nav: [
      { text: '快速开始', link: '/guide/1-register' },
      { text: '常见问题（FAQ）', link: '/faq/CC' },
      { text: 'LLM-Link 官网', link: 'https://www.llm-link.top' },
    ],

    sidebar: [
      {
        text: '快速开始',
        collapsed: false,
        items: [
          { text: '注册账号', link: '/guide/1-register' },
          { text: '登录账号', link: '/guide/2-login' },
          { text: '购买额度', link: '/guide/3-quota' },
          { text: '创建 API 令牌', link: '/guide/4-token' },
          { text: '配置 CLI 工具', link: '/guide/5-cli' },
        ],
      },
      {
        text: '模型广场',
        collapsed: false,
        items: [
          { text: '模型广场介绍', link: '/models/1-intro' },
          { text: '令牌分组介绍', link: '/models/2-group' },
        ],
      },
      {
        text: 'CC-Switch 使用',
        collapsed: false,
        items: [
          { text: '通用步骤', link: '/cc-switch/1-common' },
          { text: 'Claude Code 配置', link: '/cc-switch/2-claude' },
          { text: 'Codex 配置', link: '/cc-switch/3-codex' },
          { text: 'Gemini 配置', link: '/cc-switch/4-gemini' },
          { text: 'CC-Switch-CLI 使用', link: '/cc-switch/5-ccs_cli' },
        ],
      },
      {
        text: 'CLI 配置教程',
        collapsed: false,
        items: [
          { text: '环境检查（通用步骤）', link: '/cli-config/1-env' },
          { text: 'Claude Code 配置', link: '/cli-config/2-claude' },
          { text: 'Codex 配置', link: '/cli-config/3-codex' },
          { text: 'Gemini 配置', link: '/cli-config/4-gemini' },
        ],
      },
      {
        text: '绘图模型教程',
        collapsed: false,
        items: [
          { text: 'Banana2 Pro', link: '/paint/Banana' },
          { text: 'GPT-Image-2', link: '/paint/GPTImage' },
        ],
      },
      {
        text: '进阶玩法',
        collapsed: false,
        items: [
          { text: 'Claude Desktop', link: '/advanced/ClaudeDesktop' },
          { text: 'AionUi', link: '/advanced/AionUI' },
          { text: 'OpenCode', link: '/advanced/OpenCode' },
          { text: 'OpenClaw', link: '/advanced/OpenClaw' },
          { text: 'DS 接入 CC', link: '/advanced/DeepSeekClaudeCode' },
        ],
      },
      {
        text: '常见问题（FAQ）',
        collapsed: false,
        items: [
          { text: 'Claude Code', link: '/faq/CC' },
          { text: 'Codex', link: '/faq/Codex' },
          { text: 'Gemini', link: '/faq/Gemini' },
        ],
      },
      {
        text: '条款与政策',
        collapsed: true,
        items: [
          { text: '使用政策（AUP）', link: '/terms/aup' },
          { text: '服务条款', link: '/terms/TOS' },
          { text: '服务特定条款', link: '/terms/service-specific-terms' },
          { text: '支持的国家和地区', link: '/terms/use' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/QuantumNous/new-api' },
    ],

    footer: {
      message: '基于 New API 开源项目构建',
      copyright: `Copyright © ${new Date().getFullYear()} LLM-Link Team`,
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '深色模式',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    lastUpdated: {
      text: '最后更新',
    },
  },
})
