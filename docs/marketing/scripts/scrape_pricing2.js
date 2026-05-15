/**
 * 用已登录的 profile 抓取 LLM-Link 模型广场价格数据
 * 用法: node scrape_pricing2.js <platform>
 *   platform: 已登录的 profile 名称，如 juejin（用它的登录态）
 *   或者直接用 llm-link profile
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const platform = process.argv[2] || 'llmlink';
const PROFILES_DIR = path.join(__dirname, 'browser-profiles');
const profileDir = path.join(PROFILES_DIR, platform);

async function scrapePricingForGroup(page, groupName) {
  // 等待分组筛选器出现
  await page.waitForTimeout(1000);

  const results = [];

  // 抓取当前显示的所有模型行
  const rows = await page.evaluate(() => {
    const rows = [];
    // 尝试找表格行
    document.querySelectorAll('tr, [class*="row"], [class*="model"]').forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length > 5 && text.length < 500) {
        rows.push(text);
      }
    });
    return rows;
  });

  return rows;
}

async function main() {
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const page = await context.newPage();

  console.log('正在加载模型广场...');
  await page.goto('https://www.llm-link.top/pricing', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 检查是否需要登录
  const pageText = await page.evaluate(() => document.body.innerText);
  if (pageText.includes('登 录') || pageText.includes('登录')) {
    console.log('需要登录，当前页面：');
    console.log(pageText.substring(0, 300));
    await context.close();
    return;
  }

  console.log('\n=== 页面已加载，抓取内容 ===\n');

  // 尝试按分组筛选并抓取
  const groups = ['cc', 'cc-sale', 'codex', 'codex-sale'];

  for (const group of groups) {
    console.log(`\n--- 分组: ${group} ---`);

    // 找分组筛选按钮并点击
    try {
      const clicked = await page.evaluate((groupName) => {
        const els = Array.from(document.querySelectorAll('*'));
        for (const el of els) {
          if (el.children.length === 0 && el.innerText?.trim() === groupName) {
            el.click();
            return true;
          }
        }
        return false;
      }, group);

      if (!clicked) {
        console.log(`未找到分组筛选按钮: ${group}`);
        continue;
      }

      await page.waitForTimeout(1500);

      // 抓取表格内容
      const content = await page.evaluate(() => document.body.innerText);
      // 只输出关键的价格相关行
      const lines = content.split('\n').filter(l => {
        const t = l.trim();
        return t.length > 3 && (
          t.includes('$') || t.includes('/1M') || t.includes('claude') ||
          t.includes('gpt') || t.includes('opus') || t.includes('sonnet') ||
          t.includes('input') || t.includes('output') || t.includes('输入') || t.includes('输出')
        );
      });
      console.log(lines.slice(0, 40).join('\n'));

    } catch (e) {
      console.log(`抓取 ${group} 失败:`, e.message);
    }
  }

  // 输出完整页面内容供参考
  console.log('\n\n=== 完整页面文本（前5000字符）===\n');
  const fullText = await page.evaluate(() => document.body.innerText);
  console.log(fullText.substring(0, 5000));

  await context.close();
}

main().catch(console.error);
