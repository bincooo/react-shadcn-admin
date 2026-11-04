import { chromium } from 'playwright'

const base = process.env.BASE ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

async function snapshot(label) {
  const res = await page.evaluate(() => {
    const all = performance.getEntriesByType('resource').map((e) => ({
      url: e.name,
      bytes: e.transferSize || e.encodedBodySize || 0,
      type: e.initiatorType,
    }))
    return all
  })
  const prev = snapshot.prev ?? []
  snapshot.prev = res
  const delta = res.slice(prev.length)
  const js = delta
    .filter((d) => /\.js$/.test(d.url))
    .reduce((a, d) => a + d.bytes, 0)
  const css = delta
    .filter((d) => /\.css$/.test(d.url))
    .reduce((a, d) => a + d.bytes, 0)
  const other = delta.reduce((a, d) => a + d.bytes, 0) - js - css
  console.log(
    `${label.padEnd(20)} js ${(js / 1024).toFixed(1).padStart(7)}KB  css ${(css / 1024).toFixed(1).padStart(6)}KB  other ${(other / 1024).toFixed(1).padStart(6)}KB  files ${delta.length}`,
  )
  for (const d of delta
    .filter((d) => /\.js$/.test(d.url))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 6))
    console.log(
      `      ${(d.bytes / 1024).toFixed(1).padStart(7)}KB ${new URL(d.url).pathname}`,
    )
}
snapshot.prev = []

async function lcp() {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        let value = 0
        new PerformanceObserver((list) => {
          for (const e of list.getEntries())
            value = Math.max(value, e.startTime + e.duration)
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        setTimeout(() => resolve(Math.round(value)), 300)
      }),
  )
}

await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
await snapshot('login (first load)')
console.log(`      LCP ${await lcp()}ms`)
await page
  .getByRole('button', { name: /登\s*录|Sign in/i })
  .first()
  .click()
await page.waitForURL(/dashboard/)
await page.waitForTimeout(1500)
await snapshot('→ dashboard')
// 登录后首个后台页面（工作台）的稳定时刻
console.log(`      LCP ${await lcp()}ms`)
await page.goto(`${base}/components`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await snapshot('/components')
await browser.close()
