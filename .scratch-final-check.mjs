import { chromium } from 'playwright'
const shotDir = '/tmp/claude-1000/-home-solstice-Desktop-art-vercel-html-exotopia-org/66f4f8f3-0173-49a3-b2b4-a4c1ed5a6946/scratchpad'
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errs = []
page.on('pageerror', e => errs.push('pageerror: ' + e.message))
page.on('console', m => { if (m.type()==='error') errs.push(m.text()) })

for (const url of ['/galactic-center', '/bh/Gaia-BH2', '/bh/GRO-J1655-40', '/bh/NGC-4258']) {
  await page.goto(`http://localhost:9304${url}`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${shotDir}/final2-${url.replace(/\//g,'_')}.png` })
}

console.log('ERRORS:', JSON.stringify(errs, null, 2))
await browser.close()
