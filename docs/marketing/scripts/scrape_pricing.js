/**
 * 抓取 LLM-Link 模型广场价格数据
 * 用法: node scrape_pricing.js
 */
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  console.log('正在加载模型广场...');
  await page.goto('https://www.llm-link.top/pricing', { waitUntil: 'networkidle', timeout: 30000 });

  // 等待价格表渲染
  await page.waitForTimeout(3000);

  // 抓取页面全文
  const text = await page.evaluate(() => document.body.innerText);
  console.log('\n=== 页面文本内容 ===\n');
  console.log(text.substring(0, 8000));

  await browser.close();
}

main().catch(console.error);
