/**
 * 掘金注册脚本
 * 页面确认：手机号 + 短信验证码
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const CONFIG = {
  phone: '17323230127',
  username: 'llm_link_top',
  screenshotDir: path.join(__dirname, 'screenshots'),
};

function waitForInput(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans.trim()); }));
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  });
  const page = await context.newPage();

  try {
    console.log('[掘金] 打开登录/注册页面...');
    await page.goto('https://juejin.cn/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);

    // 掘金登录页：输入手机号
    console.log('[掘金] 等待手机号输入框...');
    const phoneInput = await page.waitForSelector('input[placeholder*="手机号"]', { timeout: 15000 });
    await phoneInput.click();
    await delay(300);
    for (const c of CONFIG.phone) {
      await page.keyboard.type(c, { delay: 60 });
    }
    console.log('[掘金] 已输入手机号:', CONFIG.phone);
    await delay(1000);

    // 点击获取验证码
    const smsBtn = await page.waitForSelector('button:has-text("获取验证码"), .btn-send-code', { timeout: 10000 });
    await smsBtn.click();
    console.log('[掘金] 已点击获取验证码');

    // 截图
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `juejin_sms_sent_${Date.now()}.png`) });

    // 等待用户输入验证码
    const smsCode = await waitForInput('\n📱 请输入收到的掘金短信验证码: ');

    // 输入验证码
    const codeInput = await page.waitForSelector('input[placeholder*="验证码"]', { timeout: 10000 });
    await codeInput.click();
    await delay(300);
    for (const c of smsCode) {
      await page.keyboard.type(c, { delay: 80 });
    }
    console.log('[掘金] 已输入验证码');
    await delay(500);

    // 点击登录/注册
    const submitBtn = await page.waitForSelector('button:has-text("登录 / 注册"), button:has-text("登录/注册"), button.login-btn', { timeout: 10000 });
    await submitBtn.click();
    console.log('[掘金] 已点击登录/注册');
    await delay(4000);

    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `juejin_after_login_${Date.now()}.png`) });

    // 检查是否需要设置昵称
    const nicknameInput = await page.$('input[placeholder*="昵称"], input[placeholder*="用户名"]');
    if (nicknameInput) {
      console.log('[掘金] 设置用户名...');
      await nicknameInput.click();
      await delay(300);
      for (const c of CONFIG.username) {
        await page.keyboard.type(c, { delay: 60 });
      }
      await delay(500);
      const confirmBtn = await page.$('button:has-text("确认"), button:has-text("完成")');
      if (confirmBtn) await confirmBtn.click();
      await delay(2000);
    }

    console.log('\n✅ 掘金注册/登录完成！请检查浏览器窗口确认状态');
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `juejin_done_${Date.now()}.png`) });
    await waitForInput('按回车键关闭浏览器...');

  } catch (err) {
    console.error('[掘金] 错误:', err.message);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `juejin_err_${Date.now()}.png`) });
    await waitForInput('发生错误，按回车键关闭...');
  } finally {
    await browser.close();
  }
}

main();
