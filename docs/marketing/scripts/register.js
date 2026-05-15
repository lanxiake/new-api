/**
 * LLM-Link 宣传账号批量注册脚本
 * 运行: node register.js [platform]
 * 例如: node register.js hn       → 注册 Hacker News
 *       node register.js reddit   → 注册 Reddit
 *       node register.js github   → 注册 GitHub
 *       node register.js discord  → 注册 Discord
 *       node register.js nodeseek → 注册 NodeSeek
 *       node register.js v2ex     → 注册 V2EX
 *       node register.js all      → 按顺序注册所有不需要手机号的平台
 */

const { chromium } = require('D:/develop/node-v22.14.0-win-x64/node_modules/@executeautomation/playwright-mcp-server/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ── 账号资料 ──────────────────────────────────────────────
const CREDS = {
  email:    'aicopilot001@proton.me',
  username: 'llm_link_top',
  password: 'V&8gN3#xL6@t',
  phone:    '17323230217',
};

const ACCOUNTS_FILE = path.join(__dirname, '../accounts.md');

// ── 工具函数 ──────────────────────────────────────────────
function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

function updateAccountStatus(platform, status, note = '') {
  let content = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
  const line = `| ${platform} | ${CREDS.username} | ${status} | ${note} |`;
  // 替换对应行
  const re = new RegExp(`\\| ${platform} \\|.*\\|.*\\|.*\\|`);
  if (re.test(content)) {
    content = content.replace(re, line);
  }
  fs.writeFileSync(ACCOUNTS_FILE, content, 'utf8');
}

async function pause(ms) { return new Promise(r => setTimeout(r, ms)); }

async function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

// ── 各平台注册函数 ─────────────────────────────────────────

/**
 * Hacker News — 最简单：用户名 + 密码，无需邮箱
 */
async function registerHN(browser) {
  log('🟡 开始注册 Hacker News...');
  const page = await browser.newPage();
  try {
    await page.goto('https://news.ycombinator.com/login?goto=news', { waitUntil: 'domcontentloaded' });
    // HN 登录页面底部有创建账号表单
    // 找到第二个表单（注册表单）
    await page.waitForSelector('form:nth-of-type(2)', { timeout: 10000 });

    const forms = await page.$$('form');
    if (forms.length < 2) throw new Error('找不到注册表单');

    const registerForm = forms[1];
    await registerForm.$eval('input[name="acct"]', el => el.value = '');
    await registerForm.$('input[name="acct"]').then(el => el.fill(CREDS.username));
    await registerForm.$('input[name="pw"]').then(el => el.fill(CREDS.password));

    log('  → 填写完毕，提交注册...');
    await registerForm.$('input[type="submit"]').then(el => el.click());
    await pause(3000);

    const url = page.url();
    const content = await page.content();

    if (url.includes('news.ycombinator.com/news') || content.includes('logout')) {
      log('  ✅ Hacker News 注册成功！');
      updateAccountStatus('Hacker News', '✅ 已注册', '');
    } else if (content.includes('That username is taken')) {
      log('  ⚠️  用户名已被占用，尝试备用名...');
      // 尝试 llm_link_dev
      await page.goto('https://news.ycombinator.com/login?goto=news', { waitUntil: 'domcontentloaded' });
      const forms2 = await page.$$('form');
      const rf2 = forms2[1];
      await rf2.$('input[name="acct"]').then(el => el.fill('llmlink_promo'));
      await rf2.$('input[name="pw"]').then(el => el.fill(CREDS.password));
      await rf2.$('input[type="submit"]').then(el => el.click());
      await pause(3000);
      if (page.url().includes('news') || (await page.content()).includes('logout')) {
        log('  ✅ Hacker News 注册成功（用户名: llmlink_promo）');
        updateAccountStatus('Hacker News', '✅ 已注册', '用户名: llmlink_promo');
      } else {
        log('  ❌ Hacker News 注册失败，请手动处理');
        updateAccountStatus('Hacker News', '❌ 失败', '需手动注册');
      }
    } else {
      log('  ❌ Hacker News 注册失败，请截图查看');
      await page.screenshot({ path: path.join(__dirname, 'hn_error.png') });
      updateAccountStatus('Hacker News', '❌ 失败', '见 hn_error.png');
    }
  } catch (e) {
    log(`  ❌ HN 错误: ${e.message}`);
    await page.screenshot({ path: path.join(__dirname, 'hn_error.png') }).catch(() => {});
    updateAccountStatus('Hacker News', '❌ 失败', e.message.slice(0, 30));
  } finally {
    await page.close();
  }
}

/**
 * Reddit
 */
async function registerReddit(browser) {
  log('🟠 开始注册 Reddit...');
  const page = await browser.newPage();
  try {
    await page.goto('https://www.reddit.com/register/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pause(3000);

    // Step 1: 邮箱
    const emailInput = await page.waitForSelector('input[name="email"], input[id="email"], input[type="email"]', { timeout: 15000 });
    await emailInput.fill(CREDS.email);
    log('  → 填写邮箱');

    const continueBtn = await page.$('button[type="submit"], button:has-text("Continue")');
    if (continueBtn) await continueBtn.click();
    await pause(2000);

    // Step 2: 用户名
    const usernameInput = await page.waitForSelector('input[name="username"]', { timeout: 10000 }).catch(() => null);
    if (usernameInput) {
      await usernameInput.fill(CREDS.username);
      log('  → 填写用户名');
    }

    // Step 3: 密码
    const pwInput = await page.$('input[name="password"]');
    if (pwInput) {
      await pwInput.fill(CREDS.password);
      log('  → 填写密码');
    }

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await pause(4000);

    await page.screenshot({ path: path.join(__dirname, 'reddit_result.png') });
    log('  → 截图已保存: reddit_result.png');
    log('  ⚠️  Reddit 注册通常需要邮箱验证，请检查邮箱 aicopilot001@proton.me');
    updateAccountStatus('Reddit', '⏳ 待邮箱验证', '查收 proton.me 邮件');
  } catch (e) {
    log(`  ❌ Reddit 错误: ${e.message}`);
    await page.screenshot({ path: path.join(__dirname, 'reddit_error.png') }).catch(() => {});
    updateAccountStatus('Reddit', '❌ 失败', e.message.slice(0, 30));
  } finally {
    await page.close();
  }
}

/**
 * GitHub
 */
async function registerGitHub(browser) {
  log('🐙 开始注册 GitHub...');
  const page = await browser.newPage();
  try {
    await page.goto('https://github.com/signup', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pause(3000);

    // GitHub signup 是交互式的，多步骤
    const emailInput = await page.waitForSelector('input#email', { timeout: 15000 });
    await emailInput.fill(CREDS.email);
    await page.keyboard.press('Enter');
    await pause(2000);

    const pwInput = await page.waitForSelector('input#password', { timeout: 10000 }).catch(() => null);
    if (pwInput) {
      await pwInput.fill(CREDS.password);
      await page.keyboard.press('Enter');
      await pause(2000);
    }

    const usernameInput = await page.waitForSelector('input#login', { timeout: 10000 }).catch(() => null);
    if (usernameInput) {
      await usernameInput.fill(CREDS.username);
      await page.keyboard.press('Enter');
      await pause(2000);
    }

    // 拒绝营销邮件
    const emailPref = await page.$('input[name="opt_in"]').catch(() => null);
    if (emailPref) {
      const checked = await emailPref.isChecked();
      if (checked) await emailPref.click();
    }

    await page.keyboard.press('Enter');
    await pause(3000);

    await page.screenshot({ path: path.join(__dirname, 'github_result.png') });
    log('  → 截图已保存: github_result.png');
    log('  ⚠️  GitHub 需要邮箱验证码，请查收邮件并告知我验证码');

    const code = await askUser('  请输入 GitHub 发送到邮箱的验证码（没收到则直接回车跳过）: ');
    if (code) {
      const codeInputs = await page.$$('input[aria-label*="digit"], input.form-control[maxlength="1"]');
      for (let i = 0; i < codeInputs.length && i < code.length; i++) {
        await codeInputs[i].fill(code[i]);
      }
      await pause(2000);
    }

    await page.screenshot({ path: path.join(__dirname, 'github_result2.png') });
    log('  ⚠️  GitHub 还需完成验证码拼图，请手动在浏览器中完成');
    updateAccountStatus('GitHub', '⏳ 待完成验证', '查看 github_result2.png');
  } catch (e) {
    log(`  ❌ GitHub 错误: ${e.message}`);
    await page.screenshot({ path: path.join(__dirname, 'github_error.png') }).catch(() => {});
    updateAccountStatus('GitHub', '❌ 失败', e.message.slice(0, 30));
  } finally {
    await page.close();
  }
}

/**
 * Discord
 */
async function registerDiscord(browser) {
  log('💬 开始注册 Discord...');
  const page = await browser.newPage();
  try {
    await page.goto('https://discord.com/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pause(3000);

    await page.fill('input[name="email"]', CREDS.email);
    await page.fill('input[name="username"]', CREDS.username);
    await page.fill('input[name="password"]', CREDS.password);

    // 生日
    const monthSel = await page.$('select[name="month"]').catch(() => null);
    if (monthSel) {
      await page.selectOption('select[name="month"]', '6');
      await page.selectOption('select[name="day"]', '15');
      await page.selectOption('select[name="year"]', '1995');
    }

    log('  → 表单填写完毕，提交...');
    await page.click('button[type="submit"]');
    await pause(4000);

    await page.screenshot({ path: path.join(__dirname, 'discord_result.png') });
    log('  → 截图已保存: discord_result.png');
    log('  ⚠️  Discord 需要邮箱验证，请查收 aicopilot001@proton.me');
    updateAccountStatus('Discord', '⏳ 待邮箱验证', '查收 proton.me 邮件');
  } catch (e) {
    log(`  ❌ Discord 错误: ${e.message}`);
    await page.screenshot({ path: path.join(__dirname, 'discord_error.png') }).catch(() => {});
    updateAccountStatus('Discord', '❌ 失败', e.message.slice(0, 30));
  } finally {
    await page.close();
  }
}

/**
 * NodeSeek
 */
async function registerNodeSeek(browser) {
  log('🖥️  开始注册 NodeSeek...');
  const page = await browser.newPage();
  try {
    await page.goto('https://www.nodeseek.com/signUp.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pause(3000);

    await page.fill('input[name="email"], input[placeholder*="邮箱"], input[type="email"]', CREDS.email);
    await page.fill('input[name="username"], input[placeholder*="用户名"]', CREDS.username);
    await page.fill('input[name="password"], input[placeholder*="密码"], input[type="password"]', CREDS.password);

    await page.screenshot({ path: path.join(__dirname, 'nodeseek_form.png') });
    log('  → 截图已保存: nodeseek_form.png，请手动确认并点击提交');
    updateAccountStatus('NodeSeek', '⏳ 待手动提交', '见 nodeseek_form.png');
  } catch (e) {
    log(`  ❌ NodeSeek 错误: ${e.message}`);
    await page.screenshot({ path: path.join(__dirname, 'nodeseek_error.png') }).catch(() => {});
    updateAccountStatus('NodeSeek', '❌ 失败', e.message.slice(0, 30));
  } finally {
    await page.close();
  }
}

/**
 * V2EX
 */
async function registerV2EX(browser) {
  log('🌐 开始注册 V2EX...');
  const page = await browser.newPage();
  try {
    await page.goto('https://www.v2ex.com/signup', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pause(3000);

    await page.screenshot({ path: path.join(__dirname, 'v2ex_signup.png') });

    // V2EX 需要 Google 验证码，很可能需要手动处理
    const usernameInput = await page.$('input[name="username"]').catch(() => null);
    if (usernameInput) {
      await usernameInput.fill(CREDS.username);
      const passwordInput = await page.$('input[name="password"]');
      if (passwordInput) await passwordInput.fill(CREDS.password);
      const emailInput = await page.$('input[name="email"]');
      if (emailInput) await emailInput.fill(CREDS.email);
    }

    await page.screenshot({ path: path.join(__dirname, 'v2ex_form.png') });
    log('  → 截图已保存: v2ex_form.png');
    log('  ⚠️  V2EX 可能有 Google reCAPTCHA，需要手动完成验证');
    updateAccountStatus('V2EX', '⏳ 待手动验证', 'reCAPTCHA 需手动完成');
  } catch (e) {
    log(`  ❌ V2EX 错误: ${e.message}`);
    await page.screenshot({ path: path.join(__dirname, 'v2ex_error.png') }).catch(() => {});
    updateAccountStatus('V2EX', '❌ 失败', e.message.slice(0, 30));
  } finally {
    await page.close();
  }
}

/**
 * Medium
 */
async function registerMedium(browser) {
  log('📝 开始注册 Medium...');
  const page = await browser.newPage();
  try {
    await page.goto('https://medium.com/m/signin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pause(3000);

    // Medium 支持邮件魔法链接登录
    const emailBtn = await page.$('button:has-text("Email")').catch(() => null);
    if (emailBtn) {
      await emailBtn.click();
      await pause(1500);
    }

    const emailInput = await page.$('input[type="email"], input[name="email"]').catch(() => null);
    if (emailInput) {
      await emailInput.fill(CREDS.email);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
    }

    await pause(3000);
    await page.screenshot({ path: path.join(__dirname, 'medium_result.png') });
    log('  → Medium 已发送登录/注册链接到邮箱，请查收');
    updateAccountStatus('Medium', '⏳ 待邮箱验证', '查收 proton.me 邮件中的魔法链接');
  } catch (e) {
    log(`  ❌ Medium 错误: ${e.message}`);
    updateAccountStatus('Medium', '❌ 失败', e.message.slice(0, 30));
  } finally {
    await page.close();
  }
}

// ── 主入口 ──────────────────────────────────────────────────
async function main() {
  const platform = process.argv[2] || 'all';

  log('🚀 启动 Playwright（有界面模式）...');
  const browser = await chromium.launch({
    headless: false,       // 有界面，可以看到操作过程
    slowMo: 200,           // 每步慢 200ms，方便观察
    args: ['--start-maximized'],
  });

  const runners = {
    hn:       () => registerHN(browser),
    reddit:   () => registerReddit(browser),
    github:   () => registerGitHub(browser),
    discord:  () => registerDiscord(browser),
    nodeseek: () => registerNodeSeek(browser),
    v2ex:     () => registerV2EX(browser),
    medium:   () => registerMedium(browser),
  };

  if (platform === 'all') {
    // 不需要手机号的平台，按顺序执行
    for (const fn of [registerHN, registerReddit, registerDiscord, registerMedium]) {
      await fn(browser);
      await pause(2000);
    }
  } else if (runners[platform]) {
    await runners[platform]();
  } else {
    log(`❌ 未知平台: ${platform}。可选: ${Object.keys(runners).join(', ')}, all`);
  }

  log('');
  log('✅ 本轮注册完成。浏览器将保持打开，你可以手动处理剩余步骤。');
  log('   所有结果截图保存在: docs/marketing/scripts/');
  log('   账号状态已更新: docs/marketing/accounts.md');
  log('');
  log('   按 Ctrl+C 退出，或等待 30 秒自动关闭...');
  await pause(30000);
  await browser.close();
}

main().catch(e => {
  console.error('脚本崩溃:', e);
  process.exit(1);
});
