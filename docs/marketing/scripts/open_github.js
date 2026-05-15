/**
 * GitHub - 仅打开浏览器，完全手动操作（需要梯子）
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

  console.log('[GitHub] 打开注册页，请手动完成注册');
  console.log('[GitHub] 邮箱: Alaric.Veyra@proton.me');
  console.log('[GitHub] 用户名: llm_link_top');
  console.log('[GitHub] 密码: V&8gN3#xL6@t');
  console.log('[GitHub] 完成后关闭浏览器窗口');

  await page.goto('https://github.com/signup', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.waitForEvent('close', { timeout: 600000 }).catch(() => {});
  await browser.close();
  console.log('[GitHub] 完成');
}

main().catch(console.error);
