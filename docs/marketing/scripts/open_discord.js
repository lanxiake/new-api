/**
 * Discord - 打开注册页，自动填写基础信息，手动完成出生日期和验证码
 */
const { chromium } = require('playwright');
const path = require('path');

const CONFIG = {
  email: 'Alaric.Veyra@proton.me',
  username: 'llm_link_top',
  password: 'V&8gN3#xL6@t',
  screenshotDir: path.join(__dirname, 'screenshots'),
};

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
  });

  const page = await context.newPage();
  try {
    console.log('[Discord] 打开注册页...');
    await page.goto('https://discord.com/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);

    // 邮箱
    const emailInput = await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await emailInput.click();
    for (const c of CONFIG.email) { await page.keyboard.type(c, { delay: 60 }); }
    await delay(500);

    // 用户名（display name）
    const unameInput = await page.waitForSelector('input[name="global_name"], input[name="username"]', { timeout: 10000 });
    await unameInput.click();
    for (const c of CONFIG.username) { await page.keyboard.type(c, { delay: 60 }); }
    await delay(500);

    // 密码
    const pwdInput = await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await pwdInput.click();
    for (const c of CONFIG.password) { await page.keyboard.type(c, { delay: 60 }); }
    await delay(500);

    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `discord_filled_${Date.now()}.png`) });
    console.log('[Discord] 邮箱/用户名/密码已填写');
    console.log('[Discord] 请在浏览器中手动：');
    console.log('  1. 选择出生日期（月/日/年）');
    console.log('  2. 勾选服务条款');
    console.log('  3. 点击 Continue 完成注册');
    console.log('  4. 完成人机验证');
    console.log('  5. 查收 ProtonMail 邮件验证');
    console.log('[Discord] 完成后关闭浏览器');

    await page.waitForEvent('close', { timeout: 600000 }).catch(() => {});
  } catch (err) {
    console.error('[Discord] 错误:', err.message);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `discord_err_${Date.now()}.png`) });
    await page.waitForEvent('close', { timeout: 600000 }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
