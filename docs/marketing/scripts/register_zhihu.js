/**
 * 知乎注册脚本
 * 页面确认：手机号 + 短信验证码
 */
const { chromium } = require('playwright');
const path = require('path');
const readline = require('readline');

const CONFIG = {
  phone: '17323230127',
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
    console.log('[知乎] 打开注册页面...');
    await page.goto('https://www.zhihu.com/signin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);

    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `zhihu_loaded_${Date.now()}.png`) });

    // 切换到注册 tab（如果有）
    const registerTab = await page.$('div:has-text("注册"), button:has-text("注册"), a:has-text("注册")');
    if (registerTab) {
      await registerTab.click();
      console.log('[知乎] 已切换到注册');
      await delay(1500);
    }

    // 切换到手机号注册方式
    const phoneModeBtn = await page.$('a:has-text("手机注册"), span:has-text("手机注册"), button:has-text("短信登录")');
    if (phoneModeBtn) {
      await phoneModeBtn.click();
      await delay(1500);
    }

    // 输入手机号
    console.log('[知乎] 等待手机号输入框...');
    const phoneInput = await page.waitForSelector('input[name="phone"], input[placeholder*="手机"], input[type="tel"]', { timeout: 15000 });
    await phoneInput.click();
    await delay(300);
    for (const c of CONFIG.phone) {
      await page.keyboard.type(c, { delay: 60 });
    }
    console.log('[知乎] 已输入手机号:', CONFIG.phone);
    await delay(1000);

    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `zhihu_phone_entered_${Date.now()}.png`) });

    // 点击发送验证码
    const smsBtn = await page.waitForSelector('button:has-text("发送验证码"), button:has-text("获取验证码"), .Button--blue', { timeout: 10000 });
    await smsBtn.click();
    console.log('[知乎] 已点击发送验证码');
    await delay(1000);

    // 等用户输入验证码
    const smsCode = await waitForInput('\n📱 请输入收到的知乎短信验证码: ');

    // 输入验证码
    const codeInput = await page.waitForSelector('input[name="code"], input[placeholder*="验证码"]', { timeout: 10000 });
    await codeInput.click();
    await delay(300);
    for (const c of smsCode) {
      await page.keyboard.type(c, { delay: 80 });
    }
    console.log('[知乎] 已输入验证码');
    await delay(500);

    // 如果是注册流程，可能还需要密码
    const pwdInput = await page.$('input[name="password"], input[type="password"]');
    if (pwdInput) {
      await pwdInput.click();
      for (const c of CONFIG.password) {
        await page.keyboard.type(c, { delay: 60 });
      }
      console.log('[知乎] 已输入密码');
      await delay(500);
    }

    // 提交
    const submitBtn = await page.waitForSelector('button[type="submit"], button:has-text("注册"), button:has-text("登录")', { timeout: 10000 });
    await submitBtn.click();
    console.log('[知乎] 已点击提交');
    await delay(5000);

    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `zhihu_done_${Date.now()}.png`) });
    console.log('\n✅ 知乎操作完成，请检查浏览器状态');
    await waitForInput('按回车键关闭浏览器...');

  } catch (err) {
    console.error('[知乎] 错误:', err.message);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, `zhihu_err_${Date.now()}.png`) });
    await waitForInput('发生错误，按回车键关闭...');
  } finally {
    await browser.close();
  }
}

main();
