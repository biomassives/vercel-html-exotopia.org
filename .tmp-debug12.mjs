import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('request', (req) => { if (/\/src\/pages\//i.test(req.url()) && req.url().endsWith('.vue')) console.log('[req]', req.url()); });

await page.goto('http://localhost:9000/', { waitUntil: 'load' });
await page.waitForTimeout(1200);
const box = page.locator('.dco-checkbox input');
if (await box.count()) { await box.check(); await page.locator('.dco-continue').click(); }
await page.waitForTimeout(1000);

await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button.bar-group'));
  btns.find(b => b.textContent.includes('EXPLORE'))?.click();
});
await page.waitForTimeout(500);

const navigated = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent?.trim() === 'Planet Systems' && e.children.length === 0);
  if (!el) return 'not found';
  let clickable = el;
  while (clickable && clickable.tagName !== 'A' && clickable.tagName !== 'BUTTON' && clickable.tagName !== 'DIV') clickable = clickable.parentElement;
  (clickable || el).click();
  return clickable?.outerHTML?.slice(0,150) ?? 'clicked el itself';
});
console.log('nav target:', navigated);
await page.waitForTimeout(1500);
console.log('url:', page.url());
await page.screenshot({ path: '/tmp/claude-1000/-home-solstice-Desktop-art-vercel-html-exotopia-org/058fa144-e422-4740-b474-27543fd56119/scratchpad/station-shots/debug12.png' });
await browser.close();
