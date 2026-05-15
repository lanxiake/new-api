/**
 * 知乎 - 打开浏览器，自动填手机号，用户手动完成验证码和注册
 */
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  });
  const page = await context.newPage();

  console.log('[知乎] 打开注册页...');
  await page.goto('https://www.zhihu.com/signin', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 尝试切换到注册tab
  try {
    const registerTab = await page.$('div.SignContainer-tab:has-text("注册"), .Tab:has-text("注册")');
    if (registerTab) {
      await registerTab.click();
      await page.waitForTimeout(1500);
      console.log('[知乎] 已切换到注册tab');
    }
  } catch (e) {}

  // 填手机号
  try {
    const phoneInput = await page.waitForSelector('input[name="phone"], input[placeholder*="手机"], input[type="tel"]', { timeout: 10000 });
    await phoneInput.click();
    await page.waitForTimeout(500);
    await page.keyboard.type('17323230127', { delay: 80 });
    console.log('[知乎] 已填写手机号 17323230127');
  } catch (e) {
    console.log('[知乎] 未找到手机号输入框，请手动填写');
  }

  console.log('[知乎] 请在浏览器里：点击"发送验证码" → 输入短信验证码 → 完成注册');
  console.log('[知乎] 完成后关闭浏览器窗口即可');

  await page.waitForEvent('close', { timeout: 300000 }).catch(() => {});
  await browser.close();
  console.log('[知乎] 浏览器已关闭');
}

main().catch(console.error);
