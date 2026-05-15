/**
 * GitHub 自动注册脚本 - 适配新版单页表单
 */
const { chromium } = require('playwright');
const path = require('path');

const CONFIG = {
  email: 'Alaric.Veyra@proton.me',
  username: 'llm_link_top',
  password: 'V&8gN3#xL6@t',
  screenshotDir: path.join(__dirname, 'screenshots'),
};

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

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
    console.log('[GitHub] 打开注册页...');
    await page.goto('https://github.com/signup', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    // 新版页面：Email
    console.log('[GitHub] 填写邮箱...');
    const emailInput = await page.waitForSelector('input[name="email"], input#email, input[type="email"]', { timeout: 10000 });
    await emailInput.click();
    await delay(300);
    for (const c of CONFIG.email) { await page.keyboard.type(c, { delay: 60 }); }
    await delay(800);

    // 接受 Cookie（填完邮箱后再关）
    const acceptBtn = await page.$('button:has-text("Accept")');
    if (acceptBtn) { await acceptBtn.click(); await delay(1000); }

    // Password
    console.log('[GitHub] 填写密码...');
    const pwdInput = await page.waitForSelector('input[name="password"], input#password, input[type="password"]', { timeout: 10000 });
    await pwdInput.click();
    await delay(300);
    for (const c of CONFIG.password) { await page.keyboard.type(c, { delay: 60 }); }
    await delay(800);

    // Username
    console.log('[GitHub] 填写用户名...');
    const unameInput = await page.waitForSelector('input[name="login"], input#login, input[name="username"]', { timeout: 10000 });
    await unameInput.click();
    await delay(300);
    for (const c of CONFIG.username) { await page.keyboard.type(c, { delay: 60 }); }
    await delay(1000);

    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `github_filled_${Date.now()}.png`) });
    console.log('[GitHub] 表单已填写，截图已保存');

    console.log('[GitHub] 表单填写完成！');
    console.log('[GitHub] 请在浏览器中：');
    console.log('  1. 向下滚动查看是否有国家/协议选项');
    console.log('  2. 点击 Create account 或 Continue 按钮');
    console.log('  3. 完成验证码');
    console.log('  4. 查收 ProtonMail 邮件并点击验证链接');
    console.log('[GitHub] 完成后关闭浏览器');

    await page.waitForEvent('close', { timeout: 600000 }).catch(() => {});

  } catch (err) {
    console.error('[GitHub] 错误:', err.message);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `github_err_${Date.now()}.png`) });
    console.log('[GitHub] 截图已保存，请检查浏览器手动完成');
    await page.waitForEvent('close', { timeout: 600000 }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
