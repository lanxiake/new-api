/**
 * 小红书 - 仅打开浏览器，完全手动操作
 */
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  console.log('[小红书] 打开登录页，请手动完成注册');
  console.log('[小红书] 手机号: 17323230127');
  console.log('[小红书] 完成后关闭浏览器窗口');

  await page.goto('https://www.xiaohongshu.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.waitForEvent('close', { timeout: 600000 }).catch(() => {});
  await browser.close();
  console.log('[小红书] 完成');
}

main().catch(console.error);
