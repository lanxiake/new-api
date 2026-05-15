/**
 * CSDN 注册脚本
 * 支持手机号注册
 */
const { chromium } = require('playwright');
const path = require('path');
const readline = require('readline');

const CONFIG = {
  phone: '17323230127',
  email: 'Alaric.Veyra@proton.me',
  username: 'llm_link_top',
  password: 'V&8gN3#xL6@t',
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
    console.log('[CSDN] 打开注册页面...');
    await page.goto('https://passport.csdn.net/register/phone', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);

    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `csdn_loaded_${Date.now()}.png`) });
    console.log('[CSDN] 页面已加载，截图已保存');

    // 输入手机号
    const phoneInput = await page.waitForSelector('input[name="phone"], input[placeholder*="手机"], input[type="tel"], input[id*="phone"]', { timeout: 15000 });
    await phoneInput.click();
    await delay(300);
    for (const c of CONFIG.phone) {
      await page.keyboard.type(c, { delay: 60 });
    }
    console.log('[CSDN] 已输入手机号');
    await delay(1000);

    // 获取验证码
    const smsBtn = await page.waitForSelector('button:has-text("获取验证码"), span:has-text("获取验证码"), .getCode', { timeout: 10000 });
    await smsBtn.click();
    console.log('[CSDN] 已请求短信验证码');

    const smsCode = await waitForInput('\n📱 请输入收到的 CSDN 短信验证码: ');

    const codeInput = await page.waitForSelector('input[name="code"], input[placeholder*="验证码"], input[id*="code"]', { timeout: 10000 });
    await codeInput.click();
    await delay(300);
    for (const c of smsCode) {
      await page.keyboard.type(c, { delay: 80 });
    }
    await delay(500);

    // 设置密码
    const pwdInput = await page.$('input[name="password"], input[type="password"]');
    if (pwdInput) {
      await pwdInput.click();
      for (const c of CONFIG.password) {
        await page.keyboard.type(c, { delay: 60 });
      }
      console.log('[CSDN] 已输入密码');

      // 确认密码
      const pwdConfirm = await page.$('input[name="confirmPassword"], input[placeholder*="确认密码"]');
      if (pwdConfirm) {
        await pwdConfirm.click();
        for (const c of CONFIG.password) {
          await page.keyboard.type(c, { delay: 60 });
        }
      }
      await delay(500);
    }

    // 勾选协议
    const checkbox = await page.$('input[type="checkbox"]');
    if (checkbox) {
      const checked = await checkbox.isChecked();
      if (!checked) await checkbox.click();
    }

    // 提交
    const submitBtn = await page.waitForSelector('button[type="submit"], button:has-text("注册"), .register-btn', { timeout: 10000 });
    await submitBtn.click();
    console.log('[CSDN] 已提交注册');
    await delay(5000);

    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `csdn_done_${Date.now()}.png`) });
    console.log('\n✅ CSDN 注册完成，请检查浏览器状态');
    await waitForInput('按回车键关闭浏览器...');

  } catch (err) {
    console.error('[CSDN] 错误:', err.message);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `csdn_err_${Date.now()}.png`) });
    await waitForInput('发生错误，按回车键关闭...');
  } finally {
    await browser.close();
  }
}

main();
