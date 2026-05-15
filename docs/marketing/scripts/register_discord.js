/**
 * Discord 专项注册脚本（出生日期修复版）
 * 运行: node register_discord.js
 */
const { chromium } = require('D:/develop/node-v22.14.0-win-x64/node_modules/@executeautomation/playwright-mcp-server/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CREDS = { email: 'aicopilot001@proton.me', username: 'llm_link_top', password: 'V&8gN3#xL6@t' };
const DIR = __dirname;
const ACCOUNTS = path.join(__dirname, '../accounts.md');

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }
async function pause(ms) { return new Promise(r => setTimeout(r, ms)); }
async function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(q, a => { rl.close(); r(a.trim()); }));
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  });
  const page = await browser.newPage();

  log('打开 Discord 注册页...');
  await page.goto('https://discord.com/register', { waitUntil: 'networkidle', timeout: 30000 });
  await pause(2000);

  // 填邮箱
  await page.fill('input[name="email"]', CREDS.email);
  await pause(400);

  // 昵称
  const displayEl = await page.$('input[name="global_name"]').catch(() => null);
  if (displayEl) { await displayEl.fill('LLM Link'); await pause(300); }

  // 用户名
  await page.fill('input[name="username"]', CREDS.username);
  await pause(400);

  // 密码
  await page.fill('input[name="password"]', CREDS.password);
  await pause(400);

  // 出生日期：用 selectOption（Playwright 原生，最可靠）
  log('设置出生日期...');
  const selects = await page.$$('select');
  log(`  找到 ${selects.length} 个 select`);

  if (selects.length >= 3) {
    // Discord 出生日期顺序：月(0)、日(1)、年(2)
    await selects[0].selectOption('6');   // 6月
    await pause(300);
    await selects[1].selectOption('15');  // 15日
    await pause(300);
    await selects[2].selectOption('1995'); // 1995年
    await pause(300);
    log('  ✅ 出生日期已设置: 1995-06-15');
  } else if (selects.length > 0) {
    // 尝试逐一设置
    for (let i = 0; i < selects.length; i++) {
      const opts = await selects[i].$$('option');
      const vals = [];
      for (const o of opts) vals.push(await o.getAttribute('value'));
      log(`  select[${i}] options: ${vals.slice(0,5).join(',')}`);
    }
    log('  ⚠️  select 结构不符预期，请手动选择出生日期');
  } else {
    log('  ⚠️  没有找到出生日期 select，Discord 可能更新了页面结构');
  }

  await page.screenshot({ path: path.join(DIR, 'discord_filled.png') });
  log('截图保存: discord_filled.png');

  const ans = await ask('出生日期是否已正确填写？直接回车提交，输入 n 手动操作: ');
  if (ans.toLowerCase() !== 'n') {
    log('点击"创建账号"按钮...');
    await page.click('button[type="submit"]');
    await pause(5000);
    await page.screenshot({ path: path.join(DIR, 'discord_submitted.png') });
    log('截图保存: discord_submitted.png');

    const content = await page.content();
    const url = page.url();
    log(`当前 URL: ${url}`);

    if (content.includes('verify') || content.includes('验证') || url.includes('verify')) {
      log('✅ Discord 账号已创建，等待邮箱验证！请查收 aicopilot001@proton.me');
      // 更新 accounts.md
      let md = fs.readFileSync(ACCOUNTS, 'utf8');
      md = md.replace(/\| Discord \|.*?\|.*?\|.*?\|/, '| Discord | llm_link_top | ⏳ 待邮箱验证 | 查收 proton.me |');
      fs.writeFileSync(ACCOUNTS, md);
    } else if (url.includes('@me') || content.includes('channels')) {
      log('✅ Discord 注册并直接登录成功！');
      let md = fs.readFileSync(ACCOUNTS, 'utf8');
      md = md.replace(/\| Discord \|.*?\|.*?\|.*?\|/, '| Discord | llm_link_top | ✅ 已注册 |  |');
      fs.writeFileSync(ACCOUNTS, md);
    } else {
      log('⚠️  状态不明，请手动查看 discord_submitted.png 和浏览器');
      await ask('[手动确认后按 Enter 关闭]: ');
    }
  } else {
    log('请在浏览器中手动完成注册，完成后按 Enter...');
    await ask('[完成后按 Enter]: ');
  }

  log('30秒后关闭...');
  await pause(30000);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
