/**
 * 掘金 - 打开浏览器，自动填手机号，用户手动完成验证码和注册
 */
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  });
  const page = await context.newPage();

  console.log('[掘金] 打开登录页...');
  await page.goto('https://juejin.cn/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 填手机号
  const phoneInput = await page.waitForSelector('input[placeholder*="手机号"]', { timeout: 15000 });
  await phoneInput.click();
  await page.waitForTimeout(500);
  await page.keyboard.type('17323230127', { delay: 80 });
  console.log('[掘金] 已填写手机号 17323230127');
  console.log('[掘金] 请在浏览器里点击"获取验证码"，输入短信验证码，完成注册');
  console.log('[掘金] 完成后关闭浏览器窗口即可');

  // 等待浏览器关闭
  await page.waitForEvent('close', { timeout: 300000 }).catch(() => {});
  await browser.close();
  console.log('[掘金] 浏览器已关闭');
}

main().catch(console.error);
