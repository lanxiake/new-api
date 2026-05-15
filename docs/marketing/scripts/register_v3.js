const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const CONFIG = {
  email: 'Alaric.Veyra@proton.me',
  emailPassword: 'mYq)}XS+ia7^HWv',
  username: 'llm_link_top',
  platformPassword: 'V&8gN3#xL6@t',
  phone: '17323230127',
  headless: false,
  slowMo: 300,
  screenshotDir: path.join(__dirname, 'screenshots'),
};

// 确保截图目录存在
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

// ==================== 工具函数 ====================
async function screenshot(page, name) {
  const filePath = path.join(CONFIG.screenshotDir, `${name}_${Date.now()}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  📸 截图已保存: ${filePath}`);
  return filePath;
}

async function randomDelay(min = 500, max = 1500) {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await new Promise(r => setTimeout(r, delay));
}

async function humanType(page, selector, text) {
  await page.click(selector);
  await randomDelay(200, 500);
  for (const char of text) {
    await page.keyboard.type(char, { delay: Math.random() * 100 + 50 });
  }
  await randomDelay(300, 600);
}

function log(platform, message) {
  console.log(`[${platform}] ${message}`);
}

function updateAccountsMd(platform, status, note = '') {
  const accountsPath = path.join(__dirname, '..', 'accounts.md');
  let content = fs.readFileSync(accountsPath, 'utf8');
  const regex = new RegExp(`(\\| ${platform} \\|[^\\|]*\\| )[^\\|]*( \\|)`, 'i');
  const newStatus = note ? `${status} | ${note}` : status;
  if (regex.test(content)) {
    content = content.replace(regex, `$1${newStatus}$2`);
  }
  fs.writeFileSync(accountsPath, content);
  log(platform, `accounts.md 状态已更新: ${newStatus}`);
}

// ==================== 浏览器启动 ====================
async function launchBrowser() {
  return await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });
}

async function newContext(browser) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    window.chrome = { runtime: {} };
  });
  return context;
}

// ==================== 平台注册函数 ====================

// ---- Discord ----
async function registerDiscord(browser) {
  const platform = 'Discord';
  log(platform, '开始注册...');
  const context = await newContext(browser);
  const page = await context.newPage();

  try {
    await page.goto('https://discord.com/register', { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 3000);

    // 邮箱
    await humanType(page, 'input[name="email"]', CONFIG.email);
    log(platform, '已填写邮箱');

    // 用户名
    await humanType(page, 'input[name="username"]', CONFIG.username);
    log(platform, '已填写用户名');

    // 密码
    await humanType(page, 'input[name="password"]', CONFIG.platformPassword);
    log(platform, '已填写密码');

    // 出生日期 - Discord 使用自定义 React 下拉组件
    log(platform, '处理出生日期...');

    // 先找到所有下拉触发按钮（通常有 aria-label 或 role="button"）
    const dateSelectors = await page.$$('[class*="select"], [role="button"], [class*="dropdown"]');
    log(platform, `找到 ${dateSelectors.length} 个可能的下拉元素`);

    // 尝试通过点击和选择文本来操作
    // 年
    await page.click('[class*="year"], [aria-label*="year"], [aria-label*="年"]', { timeout: 5000 }).catch(async () => {
      // 备选：找第三个 select 样式的元素
      const buttons = await page.$$('[class*="select"]');
      if (buttons[2]) await buttons[2].click();
    });
    await randomDelay(500, 1000);
    await page.click('text=1995', { timeout: 3000 }).catch(() => {
      // 备选：用键盘
      page.keyboard.press('ArrowDown');
    });
    log(platform, '已选择年份');
    await randomDelay(500, 1000);

    // 月
    await page.click('[class*="month"], [aria-label*="month"], [aria-label*="月"]', { timeout: 5000 }).catch(async () => {
      const buttons = await page.$$('[class*="select"]');
      if (buttons[0]) await buttons[0].click();
    });
    await randomDelay(500, 1000);
    await page.click('text=June', { timeout: 3000 }).catch(() => {
      page.keyboard.press('ArrowDown');
    });
    log(platform, '已选择月份');
    await randomDelay(500, 1000);

    // 日
    await page.click('[class*="day"], [aria-label*="day"], [aria-label*="日"]', { timeout: 5000 }).catch(async () => {
      const buttons = await page.$$('[class*="select"]');
      if (buttons[1]) await buttons[1].click();
    });
    await randomDelay(500, 1000);
    await page.click('text=15', { timeout: 3000 }).catch(() => {
      page.keyboard.press('ArrowDown');
    });
    log(platform, '已选择日期');
    await randomDelay(1000, 2000);

    // 勾选协议（如果有）
    const tosCheckbox = await page.$('input[type="checkbox"]');
    if (tosCheckbox) {
      await tosCheckbox.click();
      log(platform, '已勾选协议');
    }

    // 点击继续
    await page.click('button[type="submit"], button:has-text("Continue"), button:has-text("继续")');
    log(platform, '已点击提交');

    await randomDelay(3000, 5000);
    await screenshot(page, 'discord_after_submit');

    // 检查是否需要邮箱验证
    const verifyText = await page.$('text=verify your email, text=验证邮箱');
    if (verifyText) {
      log(platform, '需要邮箱验证，请查看 ProtonMail 收件箱');
      updateAccountsMd(platform, '⏳', '需邮箱验证');
    } else {
      log(platform, '注册可能成功，请检查页面状态');
      updateAccountsMd(platform, '⏳', '请人工确认');
    }

    console.log(`\n⚠️ ${platform}: 请检查浏览器窗口，完成任何验证码或验证步骤`);
    console.log(`按回车键继续...`);
    await waitForEnter();

  } catch (error) {
    log(platform, `错误: ${error.message}`);
    await screenshot(page, 'discord_error');
    updateAccountsMd(platform, '❌', error.message.substring(0, 50));
  } finally {
    await context.close();
  }
}

// ---- Reddit ----
async function registerReddit(browser) {
  const platform = 'Reddit';
  log(platform, '开始注册...');
  const context = await newContext(browser);
  const page = await context.newPage();

  try {
    await page.goto('https://www.reddit.com/register/', { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 3000);

    // Reddit 可能弹出 Cookie 同意框
    try {
      await page.click('button:has-text("Accept"), button:has-text("接受"), button:has-text("同意")', { timeout: 5000 });
      log(platform, '已接受 Cookie');
      await randomDelay(1000, 2000);
    } catch (e) { /* 没有弹窗 */ }

    // 邮箱输入 - 使用键盘事件模拟真实输入
    const emailInput = await page.waitForSelector('input[name="email"], input[id*="email"]', { timeout: 10000 });
    await emailInput.click();
    await randomDelay(300, 600);
    for (const char of CONFIG.email) {
      await page.keyboard.type(char, { delay: Math.random() * 80 + 40 });
    }
    log(platform, '已填写邮箱');
    await randomDelay(1000, 2000);

    // 点击 Continue（第一个）
    await page.keyboard.press('Enter');
    log(platform, '按 Enter 继续');
    await randomDelay(2000, 3000);

    // 用户名
    const usernameInput = await page.waitForSelector('input[name="username"], input[placeholder*="username"]', { timeout: 10000 });
    await usernameInput.click();
    for (const char of CONFIG.username) {
      await page.keyboard.type(char, { delay: Math.random() * 80 + 40 });
    }
    log(platform, '已填写用户名');
    await randomDelay(1000, 2000);

    // 密码
    const passwordInput = await page.$('input[name="password"], input[type="password"]');
    if (passwordInput) {
      await passwordInput.click();
      for (const char of CONFIG.platformPassword) {
        await page.keyboard.type(char, { delay: Math.random() * 80 + 40 });
      }
      log(platform, '已填写密码');
    }
    await randomDelay(1000, 2000);

    // 继续
    await page.keyboard.press('Enter');
    log(platform, '按 Enter 提交');
    await randomDelay(3000, 5000);

    await screenshot(page, 'reddit_after_submit');

    // 检查状态
    const url = page.url();
    if (url.includes('verify') || url.includes('onboarding')) {
      log(platform, '注册成功或需要验证');
      updateAccountsMd(platform, '⏳', '需验证');
    } else {
      log(platform, `当前URL: ${url}，请人工检查`);
      updateAccountsMd(platform, '⏳', '请人工确认');
    }

    console.log(`\n⚠️ ${platform}: 请检查浏览器窗口，完成任何验证码`);
    console.log(`按回车键继续...`);
    await waitForEnter();

  } catch (error) {
    log(platform, `错误: ${error.message}`);
    await screenshot(page, 'reddit_error');
    updateAccountsMd(platform, '❌', error.message.substring(0, 50));
  } finally {
    await context.close();
  }
}

// ---- GitHub ----
async function registerGitHub(browser) {
  const platform = 'GitHub';
  log(platform, '开始注册...');
  const context = await newContext(browser);
  const page = await context.newPage();

  try {
    await page.goto('https://github.com/signup', { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 3000);

    // 邮箱
    await humanType(page, 'input#email', CONFIG.email);
    log(platform, '已填写邮箱');
    await page.click('button:has-text("Continue"), button[data-continue-to]');
    await randomDelay(2000, 3000);

    // 密码
    await humanType(page, 'input#password', CONFIG.platformPassword);
    log(platform, '已填写密码');
    await page.click('button:has-text("Continue"), button[data-continue-to]');
    await randomDelay(2000, 3000);

    // 用户名
    await humanType(page, 'input#login', CONFIG.username);
    log(platform, '已填写用户名');
    await page.click('button:has-text("Continue"), button[data-continue-to]');
    await randomDelay(2000, 3000);

    // 是否接收邮件
    const noRadio = await page.$('input[value="n"]');
    if (noRadio) {
      await noRadio.click();
      log(platform, '选择不接收邮件');
    }
    await page.click('button:has-text("Continue"), button[data-continue-to]');
    await randomDelay(3000, 5000);

    await screenshot(page, 'github_after_submit');

    // 检查验证码
    const captcha = await page.$('iframe[src*="recaptcha"], iframe[src*="captcha"], .captcha');
    if (captcha) {
      log(platform, '遇到验证码，请人工完成');
      updateAccountsMd(platform, '⏳', '需人工完成验证码');
    } else {
      log(platform, '请检查页面状态');
      updateAccountsMd(platform, '⏳', '请人工确认');
    }

    console.log(`\n⚠️ ${platform}: 请检查浏览器窗口，完成验证码或验证`);
    console.log(`按回车键继续...`);
    await waitForEnter();

  } catch (error) {
    log(platform, `错误: ${error.message}`);
    await screenshot(page, 'github_error');
    updateAccountsMd(platform, '❌', error.message.substring(0, 50));
  } finally {
    await context.close();
  }
}

// ---- Dev.to ----
async function registerDevTo(browser) {
  const platform = 'Dev.to';
  log(platform, '开始注册...');
  const context = await newContext(browser);
  const page = await context.newPage();

  try {
    await page.goto('https://dev.to/enter?state=new-user', { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 3000);

    // Dev.to 支持多种注册方式，尝试邮箱注册
    const emailLink = await page.$('a:has-text("Sign up with Email"), button:has-text("Email")');
    if (emailLink) {
      await emailLink.click();
      await randomDelay(2000, 3000);
    }

    await humanType(page, 'input[name="user[email]"], input#user_email', CONFIG.email);
    await humanType(page, 'input[name="user[password]"], input#user_password', CONFIG.platformPassword);
    await humanType(page, 'input[name="user[username]"], input#user_username', CONFIG.username);

    // 确认密码
    const confirmInput = await page.$('input[name="user[password_confirmation]"]');
    if (confirmInput) {
      await humanType(page, 'input[name="user[password_confirmation]"]', CONFIG.platformPassword);
    }

    await page.click('input[type="submit"], button[type="submit"]');
    await randomDelay(3000, 5000);

    await screenshot(page, 'devto_after_submit');
    log(platform, '注册提交完成，请检查');
    updateAccountsMd(platform, '⏳', '请人工确认');

    console.log(`\n⚠️ ${platform}: 请检查浏览器窗口`);
    console.log(`按回车键继续...`);
    await waitForEnter();

  } catch (error) {
    log(platform, `错误: ${error.message}`);
    await screenshot(page, 'devto_error');
    updateAccountsMd(platform, '❌', error.message.substring(0, 50));
  } finally {
    await context.close();
  }
}

// ---- NodeSeek ----
async function registerNodeSeek(browser) {
  const platform = 'NodeSeek';
  log(platform, '开始注册...');
  const context = await newContext(browser);
  const page = await context.newPage();

  try {
    await page.goto('https://www.nodeseek.com/signup', { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 3000);

    await humanType(page, 'input[name="email"], input[type="email"]', CONFIG.email);
    await humanType(page, 'input[name="username"]', CONFIG.username);
    await humanType(page, 'input[name="password"], input[type="password"]', CONFIG.platformPassword);

    await page.click('button[type="submit"], input[type="submit"]');
    await randomDelay(3000, 5000);

    await screenshot(page, 'nodeseek_after_submit');
    log(platform, '注册提交完成');
    updateAccountsMd(platform, '⏳', '请人工确认');

    console.log(`\n⚠️ ${platform}: 请检查浏览器窗口，可能需要邮箱验证`);
    console.log(`按回车键继续...`);
    await waitForEnter();

  } catch (error) {
    log(platform, `错误: ${error.message}`);
    await screenshot(page, 'nodeseek_error');
    updateAccountsMd(platform, '❌', error.message.substring(0, 50));
  } finally {
    await context.close();
  }
}

// ---- V2EX ----
async function registerV2EX(browser) {
  const platform = 'V2EX';
  log(platform, '开始注册...');
  const context = await newContext(browser);
  const page = await context.newPage();

  try {
    await page.goto('https://www.v2ex.com/signup', { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 3000);

    await humanType(page, 'input[name="username"]', CONFIG.username);
    await humanType(page, 'input[name="email"], input[type="email"]', CONFIG.email);
    await humanType(page, 'input[name="password"], input[type="password"]', CONFIG.platformPassword);

    await page.click('input[type="submit"], button[type="submit"]');
    await randomDelay(3000, 5000);

    await screenshot(page, 'v2ex_after_submit');
    log(platform, '注册提交完成');
    updateAccountsMd(platform, '⏳', '请人工确认');

    console.log(`\n⚠️ ${platform}: 请检查浏览器窗口，可能需要邮箱验证`);
    console.log(`按回车键继续...`);
    await waitForEnter();

  } catch (error) {
    log(platform, `错误: ${error.message}`);
    await screenshot(page, 'v2ex_error');
    updateAccountsMd(platform, '❌', error.message.substring(0, 50));
  } finally {
    await context.close();
  }
}

// ---- Medium ----
async function registerMedium(browser) {
  const platform = 'Medium';
  log(platform, '开始注册...');
  const context = await newContext(browser);
  const page = await context.newPage();

  try {
    await page.goto('https://medium.com/', { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 3000);

    // 点击注册按钮
    await page.click('a:has-text("Sign up"), button:has-text("Get started")', { timeout: 10000 });
    await randomDelay(2000, 3000);

    // 邮箱注册
    const emailButton = await page.$('button:has-text("Sign up with email"), a:has-text("email")');
    if (emailButton) {
      await emailButton.click();
      await randomDelay(2000, 3000);
    }

    await humanType(page, 'input[type="email"]', CONFIG.email);
    await page.click('button[type="submit"]');
    await randomDelay(3000, 5000);

    await screenshot(page, 'medium_after_submit');
    log(platform, '魔法链接已发送到邮箱，请查收');
    updateAccountsMd(platform, '⏳', '需邮箱点击魔法链接');

    console.log(`\n⚠️ ${platform}: 请检查 ProtonMail 收件箱，点击验证链接`);
    console.log(`按回车键继续...`);
    await waitForEnter();

  } catch (error) {
    log(platform, `错误: ${error.message}`);
    await screenshot(page, 'medium_error');
    updateAccountsMd(platform, '❌', error.message.substring(0, 50));
  } finally {
    await context.close();
  }
}

// ---- 需要手机验证码的平台 ----
async function registerWithPhone(browser, platform, url, selectors) {
  log(platform, '开始注册...');
  const context = await newContext(browser);
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 3000);

    // 填写基础信息
    if (selectors.email) await humanType(page, selectors.email, CONFIG.email);
    if (selectors.username) await humanType(page, selectors.username, CONFIG.username);
    if (selectors.password) await humanType(page, selectors.password, CONFIG.platformPassword);
    if (selectors.phone) await humanType(page, selectors.phone, CONFIG.phone);

    // 点击获取验证码
    if (selectors.smsButton) {
      await page.click(selectors.smsButton);
      log(platform, '已请求短信验证码');
    }

    await screenshot(page, `${platform.toLowerCase()}_before_sms`);

    // 暂停等待用户输入验证码
    console.log(`\n📱 ${platform}: 请输入收到的短信验证码，然后在浏览器中填写`);
    console.log(`完成后按回车键继续...`);
    await waitForEnter();

    // 提交
    if (selectors.submit) {
      await page.click(selectors.submit);
      await randomDelay(3000, 5000);
    }

    await screenshot(page, `${platform.toLowerCase()}_after_submit`);
    updateAccountsMd(platform, '⏳', '需人工完成');

  } catch (error) {
    log(platform, `错误: ${error.message}`);
    await screenshot(page, `${platform.toLowerCase()}_error`);
    updateAccountsMd(platform, '❌', error.message.substring(0, 50));
  } finally {
    await context.close();
  }
}

// ==================== 等待用户输入 ====================
function waitForEnter() {
  return new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });
}

// ==================== 主流程 ====================
async function main() {
  console.log('==============================================');
  console.log('  LLM-Link 平台注册脚本 v3');
  console.log('  邮箱: ' + CONFIG.email);
  console.log('==============================================\n');

  const browser = await launchBrowser();
  console.log('浏览器已启动\n');

  // Phase 1: 不需要手机验证码的平台
  const phase1 = [
    { name: 'Discord', fn: registerDiscord },
    { name: 'Reddit', fn: registerReddit },
    { name: 'GitHub', fn: registerGitHub },
    { name: 'Dev.to', fn: registerDevTo },
    { name: 'NodeSeek', fn: registerNodeSeek },
    { name: 'V2EX', fn: registerV2EX },
    { name: 'Medium', fn: registerMedium },
  ];

  console.log('=== Phase 1: 基础注册（无需手机验证码）===');
  for (const p of phase1) {
    console.log(`\n--- ${p.name} ---`);
    try {
      await p.fn(browser);
    } catch (e) {
      console.error(`${p.name} 注册失败:`, e.message);
    }
    await randomDelay(2000, 4000);
  }

  // Phase 2: 需要手机验证码的平台
  console.log('\n=== Phase 2: 需要手机验证码的平台 ===');
  const phase2 = [
    {
      name: '即刻',
      url: 'https://www.ruguoapp.com/',
      selectors: { phone: 'input[type="tel"]', smsButton: 'button:has-text("获取验证码")', submit: 'button[type="submit"]' }
    },
    {
      name: '掘金',
      url: 'https://juejin.cn/login',
      selectors: { email: 'input[name="loginPhoneOrEmail"]', password: 'input[name="password"]', submit: 'button.login-btn' }
    },
    {
      name: '知乎',
      url: 'https://www.zhihu.com/signup',
      selectors: { phone: 'input[name="phoneNo"]', smsButton: '.SignFlow-smsInputButton', submit: 'button.SignFlow-submitButton' }
    },
    {
      name: '小红书',
      url: 'https://www.xiaohongshu.com/signup',
      selectors: { phone: 'input[placeholder*="手机号"]', smsButton: 'button:has-text("获取验证码")', submit: 'button[type="submit"]' }
    },
    {
      name: 'CSDN',
      url: 'https://passport.csdn.net/login?code=public',
      selectors: { email: 'input[name="all"]', password: 'input[name="pwd"]', submit: 'button.btn' }
    },
  ];

  for (const p of phase2) {
    console.log(`\n--- ${p.name} ---`);
    try {
      await registerWithPhone(browser, p.name, p.url, p.selectors);
    } catch (e) {
      console.error(`${p.name} 注册失败:`, e.message);
    }
    await randomDelay(2000, 4000);
  }

  console.log('\n==============================================');
  console.log('  所有平台注册流程已完成');
  console.log('  请检查 accounts.md 和各平台截图');
  console.log('==============================================');

  await browser.close();
  process.exit(0);
}

// 错误处理
process.on('unhandledRejection', (err) => {
  console.error('未处理的错误:', err);
  process.exit(1);
});

main().catch(console.error);
