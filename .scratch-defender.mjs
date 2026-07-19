import { chromium } from 'playwright'
const shotDir = '/tmp/claude-1000/-home-solstice-Desktop-art-vercel-html-exotopia-org/66f4f8f3-0173-49a3-b2b4-a4c1ed5a6946/scratchpad'
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errs = []
page.on('pageerror', e => errs.push('pageerror: ' + e.message))
page.on('console', m => { if (m.type()==='error') errs.push(m.text()) })

await page.goto('http://localhost:9304/bh/A0620-00', { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForTimeout(2000)
await page.screenshot({ path: `${shotDir}/def-1-a0620.png` })

// Drag the defender slider
const track = await page.$('.bhdn-track')
const box = await track.boundingBox()
await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2, { steps: 20 })
await page.waitForTimeout(300)
await page.mouse.up()
await page.waitForTimeout(1200)
await page.screenshot({ path: `${shotDir}/def-2-after-drag.png` })

// Click "OTHER OBJECTS" quick switch to jump bh->bh directly (exercises the
// route-param watcher + vector zoom tween while staying mounted)
const before = page.url()
await page.click('.bhdn-switch-btn:has-text("M87")')
await page.waitForTimeout(200)
await page.screenshot({ path: `${shotDir}/def-3-jump-mid.png` })
await page.waitForTimeout(1600)
await page.screenshot({ path: `${shotDir}/def-4-jump-done.png` })
console.log('URL before/after jump:', before, '->', page.url())

await page.waitForTimeout(500)
console.log('ERRORS:', JSON.stringify(errs, null, 2))
await browser.close()
