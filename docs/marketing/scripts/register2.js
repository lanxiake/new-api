/**
 * 修复版注册脚本 v2
 * 专门处理 Discord（出生日期）和 Reddit（反机器人）
 * 运行: node register2.js discord
 *       node register2.js reddit
 *       node register2.js nodeseek
 *       node register2.js v2ex
 */

const { chromium } = require('D:/develop/node-v22.14.0-win-x64/node_modules/@executeautomation/playwright-mcp-server/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CREDS = {
  email:    'aicopilot001@proton.me',
  username: 'llm_link_top',
  password: 'V&8gN3#xL6@t',
};

const SCRIPTS_DIR = __dirname;
const ACCOUNTS_FILE = path.join(__dirname, '../accounts.md');

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

function updateAccountStatus(platform, status, note = '') {
  let content = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
  const re = new RegExp(`(\\| ${platform} \\| llm_link_top \\| ).*?(\\| ).*?( \\|)`);
  const newLine = `| ${platform} | llm_link_top | ${status} | ${note} |`;
  if (re.test(content)) {
    content = content.replace(re, newLine);
  }
  fs.writeFileSync(ACCOUNTS_FILE, content, 'utf8');
}

async function pause(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

// ── Discord（修复版：用 JS 注入选择出生日期）─────────────────
async function registerDiscord(browser) {
  log('💬 Discord 注册（修复版）...');
  const page = await browser.newPage();
  try {
    await page.goto('https://discord.com/register', { waitUntil: 'networkidle', timeout: 30000 });
    await pause(2000);

    // 填邮箱
    await page.fill('input[name="email"]', CREDS.email);
    await pause(500);
    // 填昵称（显示名）
    const displayName = await page.$('input[name="global_name"]').catch(() => null);
    if (displayName) { await displayName.fill('LLM Link'); await pause(300); }
    // 填用户名
    await page.fill('input[name="username"]', CREDS.username);
    await pause(500);
    // 填密码
    await page.fill('input[name="password"]', CREDS.password);
    await pause(500);

    // 出生日期：用 JS 直接设置 select value 并触发 React change 事件
    await page.evaluate(() => {
      function setNativeValue(el, value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(el, value);
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const selects = document.querySelectorAll('select');
      // Discord 出生日期顺序：月、日、年
      if (selects[0]) setNativeValue(selects[0], '6');   // 月: June
      if (selects[1]) setNativeValue(selects[1], '15');  // 日: 15
      if (selects[2]) setNativeValue(selects[2], '1995'); // 年: 1995
    });
    await pause(800);

    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'discord_before_submit.png') });
    log('  → 截图已保存: discord_before_submit.png，即将点击创建账号...');
    await pause(500);

    // 点击提交按钮
    await page.click('button[type="submit"]');
    await pause(5000);

    const content = await page.content();
    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'discord_after_submit.png') });

    if (content.includes('verify') || content.includes('验证') || content.includes('email')) {
      log('  ✅ Discord 账号创建成功，需要邮箱验证！请查收 aicopilot001@proton.me');
      updateAccountStatus('Discord', '⏳ 待邮箱验证', '查收 proton.me 邮件');
    } else if (content.includes('channels') || content.includes('@me')) {
      log('  ✅ Discord 注册并登录成功！');
      updateAccountStatus('Discord', '✅ 已注册', '');
    } else {
      log('  ⚠️  Discord 提交后状态不明，截图已保存: discord_after_submit.png');
      log('  → 浏览器保持打开，请手动查看');
      updateAccountStatus('Discord', '⚠️ 待确认', '见 discord_after_submit.png');
      await ask('  [手动确认后按 Enter 继续]: ');
    }
  } catch (e) {
    log(`  ❌ Discord 错误: ${e.message}`);
    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'discord_error2.png') }).catch(() => {});
    updateAccountStatus('Discord', '❌ 失败', e.message.slice(0, 40));
  } finally {
    await page.close();
  }
}

// ── Reddit（修复版：stealth + 手动等待）──────────────────────
async function registerReddit(browser) {
  log('🟠 Reddit 注册（stealth 模式）...');
  const page = await browser.newPage();
  try {
    // 注入反检测 JS
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto('https://www.reddit.com/register/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await pause(4000);

    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'reddit_step1.png') });
    log('  → Step1 截图已保存');

    // Reddit 新注册流程：先填邮箱点继续
    const emailInput = await page.$('input[id="regEmail"], input[name="email"], input[type="email"]');
    if (!emailInput) {
      log('  ⚠️  找不到邮箱输入框，可能是页面结构变化，请手动操作浏览器');
      await ask('  [手动完成后按 Enter]: ');
      return;
    }

    await emailInput.click();
    await pause(500);
    await page.keyboard.type(CREDS.email, { delay: 80 });
    await pause(1000);

    // 查找"继续"按钮（多种可能的文本）
    const continueBtn = await page.$('button:has-text("继续"), button:has-text("Continue"), button[type="submit"]');
    if (continueBtn) {
      await continueBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await pause(4000);

    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'reddit_step2.png') });
    log('  → Step2 截图已保存');

    // 填用户名
    const usernameInput = await page.$('input[id="regUsername"], input[name="username"]').catch(() => null);
    if (usernameInput) {
      await usernameInput.click();
      await pause(300);
      await page.keyboard.type(CREDS.username, { delay: 80 });
      await pause(800);
    }

    // 填密码
    const pwInput = await page.$('input[id="regPassword"], input[name="password"]').catch(() => null);
    if (pwInput) {
      await pwInput.click();
      await pause(300);
      await page.keyboard.type(CREDS.password, { delay: 80 });
      await pause(800);
    }

    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'reddit_step3.png') });
    log('  → Step3 截图已保存，即将提交...');

    const submitBtn = await page.$('button[type="submit"]').catch(() => null);
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await pause(5000);

    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'reddit_final.png') });
    const url = page.url();
    log(`  → 当前 URL: ${url}`);

    if (url.includes('reddit.com/r/') || url.includes('reddit.com/?') || url.includes('reddit.com/home')) {
      log('  ✅ Reddit 注册成功！');
      updateAccountStatus('Reddit', '✅ 已注册', '');
    } else {
      log('  ⚠️  Reddit 注册状态不明，截图: reddit_final.png');
      log('  → 浏览器保持打开，请手动确认');
      updateAccountStatus('Reddit', '⚠️ 待确认', '见 reddit_final.png');
      await ask('  [手动确认后按 Enter]: ');
    }
  } catch (e) {
    log(`  ❌ Reddit 错误: ${e.message}`);
    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'reddit_error2.png') }).catch(() => {});
    updateAccountStatus('Reddit', '❌ 失败', e.message.slice(0, 40));
  } finally {
    await page.close();
  }
}

// ── NodeSeek ──────────────────────────────────────────────────
async function registerNodeSeek(browser) {
  log('🖥️  NodeSeek 注册...');
  const page = await browser.newPage();
  try {
    await page.goto('https://www.nodeseek.com/signUp.html', { waitUntil: 'networkidle', timeout: 30000 });
    await pause(2000);
    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'nodeseek_form.png') });

    // 尝试填表单
    const inputs = await page.$$('input');
    log(`  → 找到 ${inputs.length} 个输入框`);
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name') || '';
      const placeholder = await input.getAttribute('placeholder') || '';
      log(`     input: type=${type} name=${name} placeholder=${placeholder}`);
    }

    // 通用填写
    const emailEl = await page.$('input[type="email"], input[name="email"], input[placeholder*="邮"]');
    if (emailEl) { await emailEl.fill(CREDS.email); log('  → 填邮箱'); await pause(300); }

    const userEl = await page.$('input[name="username"], input[placeholder*="用户名"], input[placeholder*="账号"]');
    if (userEl) { await userEl.fill(CREDS.username); log('  → 填用户名'); await pause(300); }

    const pwEls = await page.$$('input[type="password"]');
    for (const pwEl of pwEls) { await pwEl.fill(CREDS.password); await pause(200); }
    if (pwEls.length) log(`  → 填密码（${pwEls.length}个密码框）`);

    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'nodeseek_filled.png') });
    log('  → 截图已保存: nodeseek_filled.png');
    log('  ⚠️  浏览器已打开并填好表单，请手动检查验证码并点击提交');
    await ask('  [手动提交后按 Enter 确认结果]: ');

    const url = page.url();
    if (url.includes('nodeseek.com') && !url.includes('signUp')) {
      log('  ✅ NodeSeek 注册成功！');
      updateAccountStatus('NodeSeek', '✅ 已注册', '');
    } else {
      log('  ⚠️  NodeSeek 状态待确认');
      updateAccountStatus('NodeSeek', '⚠️ 待确认', '手动操作中');
    }
  } catch (e) {
    log(`  ❌ NodeSeek 错误: ${e.message}`);
    updateAccountStatus('NodeSeek', '❌ 失败', e.message.slice(0, 40));
  } finally {
    await page.close();
  }
}

// ── V2EX ─────────────────────────────────────────────────────
async function registerV2EX(browser) {
  log('🌐 V2EX 注册...');
  const page = await browser.newPage();
  try {
    await page.goto('https://www.v2ex.com/signup', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pause(3000);

    const userEl = await page.$('input[name="username"]');
    const pwEl   = await page.$('input[name="password"]');
    const emailEl = await page.$('input[name="email"]');

    if (userEl)  { await userEl.fill(CREDS.username);  await pause(300); }
    if (pwEl)    { await pwEl.fill(CREDS.password);    await pause(300); }
    if (emailEl) { await emailEl.fill(CREDS.email);    await pause(300); }

    await page.screenshot({ path: path.join(SCRIPTS_DIR, 'v2ex_filled.png') });
    log('  → 表单已填写，截图: v2ex_filled.png');
    log('  ⚠️  V2EX 有 Google reCAPTCHA，请在浏览器中手动完成验证码后点击注册');
    await ask('  [手动完成验证并注册后，按 Enter 确认]: ');

    const content = await page.content();
    if (content.includes('logout') || content.includes('settings')) {
      log('  ✅ V2EX 注册成功！');
      updateAccountStatus('V2EX', '✅ 已注册', '');
    } else {
      updateAccountStatus('V2EX', '⚠️ 待确认', '手动操作中');
    }
  } catch (e) {
    log(`  ❌ V2EX 错误: ${e.message}`);
    updateAccountStatus('V2EX', '❌ 失败', e.message.slice(0, 40));
  } finally {
    await page.close();
  }
}

// ── 主入口 ────────────────────────────────────────────────────
async function main() {
  const platform = process.argv[2] || 'discord';

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const map = { discord: registerDiscord, reddit: registerReddit, nodeseek: registerNodeSeek, v2ex: registerV2EX };

  if (map[platform]) {
    await map[platform](browser);
  } else {
    log(`未知平台: ${platform}，可选: discord, reddit, nodeseek, v2ex`);
  }

  log('');
  log('本轮完成。30秒后自动关闭浏览器...');
  await pause(30000);
  await browser.close();
}

main().catch(e => { console.error('脚本崩溃:', e); process.exit(1); });
