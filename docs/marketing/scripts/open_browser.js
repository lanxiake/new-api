/**
 * 持久化浏览器启动器
 * 登录状态保存在 browser-profiles/<platform>/ 目录
 * 用法: node open_browser.js <platform> [url]
 *
 * 例:
 *   node open_browser.js reddit
 *   node open_browser.js discord
 *   node open_browser.js github https://github.com
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const platform = process.argv[2] || 'default';
const url = process.argv[3];

const PROFILES_DIR = path.join(__dirname, 'browser-profiles');
const profileDir = path.join(PROFILES_DIR, platform);

// 各平台默认 URL
const DEFAULT_URLS = {
  reddit:      'https://www.reddit.com',
  discord:     'https://discord.com/channels/@me',
  github:      'https://github.com',
  devto:       'https://dev.to',
  medium:      'https://medium.com',
  juejin:      'https://juejin.cn',
  zhihu:       'https://www.zhihu.com',
  csdn:        'https://www.csdn.net',
  xiaohongshu: 'https://www.xiaohongshu.com',
  nodeseek:    'https://www.nodeseek.com',
};

async function main() {
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
    console.log(`[${platform}] 创建新 profile: ${profileDir}`);
  } else {
    console.log(`[${platform}] 使用已有 profile: ${profileDir}`);
  }

  const targetUrl = url || DEFAULT_URLS[platform] || 'about:blank';
  console.log(`[${platform}] 打开: ${targetUrl}`);

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    slowMo: 100,
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
  });

  const page = await context.newPage();
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => {
    console.log(`[${platform}] 页面加载警告: ${e.message}`);
  });

  console.log(`[${platform}] 浏览器已打开，登录状态将自动保存`);
  console.log(`[${platform}] 关闭浏览器窗口即可退出`);

  // 等待所有页面关闭
  await context.waitForEvent('close', { timeout: 3600000 }).catch(() => {});
  await context.close().catch(() => {});
  console.log(`[${platform}] 已退出，登录状态已保存到 ${profileDir}`);
}

main().catch(console.error);
