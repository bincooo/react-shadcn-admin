/**
 * 冒烟测试：登录 → 主要页面 → 关键交互，收集控制台报错并截图。
 *
 * 用法：
 *   pnpm dev                              # 另开终端
 *   pnpm exec playwright install chromium  # 首次需要
 *   pnpm smoke                            # 默认 http://127.0.0.1:5173
 *
 * 环境变量：BASE 目标地址，OUT 截图目录（默认 .screenshots，已加入 .gitignore）
 */
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://127.0.0.1:5173'
const OUT = process.env.OUT ?? '.screenshots'
const PAGES = [
  ['dashboard', '/dashboard'],
  ['monitor', '/dashboard/monitor'],
  ['components', '/components'],
  ['profile', '/profile'],
  ['system-users', '/system/users'],
  ['system-menus', '/system/menus'],
  ['system-roles', '/system/roles'],
]

const errors = []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

page.on('pageerror', (error) => errors.push(`[pageerror] ${error.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`)
})
page.on('requestfailed', (req) =>
  errors.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`),
)

const shot = async (name) => {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('✔', name, page.url())
}

await mkdir(OUT, { recursive: true })

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await shot('01-login')

// 6 种登录风格：glass/slider/bubble/immersive/dotgrid 是懒加载 chunk，
// 逐个切换一遍可以确认按需加载与代码分割没有把页面切成白屏。
const LOGIN_STYLES = [
  '臻享双栏',
  '动感玻璃',
  '滑动登录',
  '气泡简约',
  '分屏沉浸',
  '经典点阵',
]
await page.getByRole('button', { name: /外观设置|Appearance/ }).click()
await page.waitForTimeout(300)
for (const style of LOGIN_STYLES) {
  await page.locator(`button[title="${style}"]`).click()
  await page.waitForTimeout(400)
  const ok = await page
    .getByRole('button', { name: /登\s*录|Sign in/i })
    .first()
    .isVisible()
  if (!ok) errors.push(`[login-style] ${style} 未渲染出登录表单`)
}
console.log('✔ login-styles', LOGIN_STYLES.length, '种风格')
// 还原默认风格并关闭面板，后续步骤仍从 split 登录页开始
await page.locator('button[title="臻享双栏"]').click()
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

await page
  .getByRole('button', { name: /登\s*录|Sign in/i })
  .first()
  .click()
await page.waitForURL(/dashboard/)
await shot('02-dashboard')

for (const [name, path] of PAGES.slice(1)) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await shot(`page-${name}`)
}

// 关键交互：折叠侧边栏、切换语言、打开主题抽屉、切换深色
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /语言/ }).click()
await page.getByRole('menuitem', { name: 'English' }).click()
await page.waitForTimeout(400)
await shot('03-lang-en')
await page.getByRole('button', { name: /Language/ }).click()
await page.getByRole('menuitem', { name: '简体中文' }).click()

await page
  .getByRole('button', { name: /主题设置|主题配置/ })
  .first()
  .click()
await shot('04-theme-panel')
await page.keyboard.press('Escape')

// 顶栏的主题模式按钮：aria-label 固定为「主题模式」，下拉里选具体模式
await page.getByRole('button', { name: /主题模式/ }).click()
await page.getByRole('menuitem', { name: '黑暗' }).click()
await shot('05-dark')
await page.getByRole('button', { name: /主题模式/ }).click()
await page.getByRole('menuitem', { name: '明亮' }).click()

// 移动端抽屉
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
mobile.on('pageerror', (error) => errors.push(`[mobile] ${error.message}`))
await mobile.goto(`${BASE}/components`, { waitUntil: 'networkidle' })
await mobile.waitForTimeout(800)
await mobile.screenshot({ path: `${OUT}/06-mobile-form.png` })

await browser.close()

console.log('')
if (errors.length) {
  console.error(`发现 ${errors.length} 条错误：`)
  for (const error of [...new Set(errors)]) console.error(' -', error)
  process.exit(1)
}
console.log('✅ 冒烟测试通过，无控制台错误')
