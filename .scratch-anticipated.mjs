import { chromium } from 'playwright'
const shotDir = '/tmp/claude-1000/-home-solstice-Desktop-art-vercel-html-exotopia-org/66f4f8f3-0173-49a3-b2b4-a4c1ed5a6946/scratchpad'
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errs = []
page.on('pageerror', e => errs.push(e.message))
page.on('console', m => { if (m.type()==='error') errs.push(m.text()) })

for (const id of ['Cygnus-X-1', 'Omega-Cen-IMBH', 'M87-star', 'NGC-4258', 'Gaia-BH1']) {
  await page.goto(`http://localhost:9303/bh/${id}`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `${shotDir}/ant-${id}-close.png` })
  // zoom out to see the anticipated shell — scroll wheel out several times
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(640, 400)
    await page.mouse.wheel(0, 300)
    await page.waitForTimeout(80)
  }
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${shotDir}/ant-${id}-far.png` })
}

console.log('ERRORS:', JSON.stringify(errs))
await browser.close()
