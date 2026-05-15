/**
 * 抓取各分组下 Claude/GPT 主力模型价格
 */
const { chromium } = require('playwright');

async function scrapeGroup(page, groupName) {
  // 重置并点击指定分组
  await page.goto('https://www.llm-link.top/pricing', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 点击分组按钮
  const clicked = await page.evaluate((g) => {
    const els = Array.from(document.querySelectorAll('*'));
    for (const el of els) {
      if (el.children.length === 0 && el.innerText?.trim() === g) {
        el.click();
        return true;
      }
    }
    return false;
  }, groupName);

  if (!clicked) {
    console.log(`[${groupName}] 未找到分组按钮`);
    return;
  }

  await page.waitForTimeout(2000);

  // 设置每页显示更多（找每页条数选择器）
  // 先抓第1页内容
  const text = await page.evaluate(() => document.body.innerText);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  console.log(`\n========== 分组: ${groupName} ==========`);
  // 只打印含价格信息的行
  let inModel = false;
  let modelName = '';
  for (const line of lines) {
    if (!line.includes('$') && !line.includes('价格') && !line.includes('claude') && !line.includes('gpt') && !line.includes('opus') && !line.includes('sonnet') && !line.includes('haiku')) continue;
    console.log(line);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // 先看 cc 分组下所有内容（设每页100条）
  const groups = ['cc', 'cc-sale', 'codex', 'codex-sale'];
  for (const g of groups) {
    await scrapeGroup(page, g);
  }

  await browser.close();
}

main().catch(console.error);
