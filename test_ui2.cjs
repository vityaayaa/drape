// @ts-check
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:5173'
const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

async function wait(ms = 600) {
  return new Promise(r => setTimeout(r, ms))
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
  console.log(`  📸 ${name}.png`)
}

async function clickTab(page, label) {
  await page.locator(`button.nav-tab:has-text("${label}")`).click()
  await wait(700)
}

// Заполняем number-инпут с placeholder="—" по его текущему порядковому номеру
// (после рендера). Используем evaluate для надёжности.
async function fillByReact(page, selector, value) {
  await page.evaluate(({ sel, val }) => {
    const el = document.querySelector(sel)
    if (!el) throw new Error('not found: ' + sel)
    const nativeInput = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    nativeInput.set.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, { sel: selector, val: String(value) })
  await wait(100)
}

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
  })
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

  console.log('Opening app...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await wait(1200)

  // ── Заполняем параметры плитки ─────────────────────────────────────
  await clickTab(page, 'Комната')
  console.log('[Комната] tile params')

  // В TileForm 4 number-инпута — они первые на странице
  const allNum = () => page.locator('input[type="number"]')
  await allNum().nth(0).fill('300')
  await allNum().nth(1).fill('600')
  await allNum().nth(2).fill('8')
  await allNum().nth(3).fill('2')
  await wait(300)

  // ── Стена 1 ─────────────────────────────────────────────────────────
  await page.locator('button:has-text("+ Добавить стену")').click()
  await wait(400)
  // Теперь инпуты 4,5 = Длина/Высота стены 1
  await allNum().nth(4).fill('350')
  await allNum().nth(5).fill('280')
  await wait(200)

  // ── Стена 2 ─────────────────────────────────────────────────────────
  await page.locator('button:has-text("+ Добавить стену")').click()
  await wait(400)
  await allNum().nth(6).fill('450')
  await allNum().nth(7).fill('280')
  await wait(200)

  // ── Стена 3 ─────────────────────────────────────────────────────────
  await page.locator('button:has-text("+ Добавить стену")').click()
  await wait(400)
  await allNum().nth(8).fill('200')
  await allNum().nth(9).fill('280')
  await wait(400)

  await shot(page, '10_room_walls_correct')

  // ── Скролл до углов и итога ─────────────────────────────────────────
  await page.evaluate(() => document.querySelector('.tab-panel').scrollTop += 900)
  await wait(500)
  await shot(page, '11_room_corners_summary')

  // ── Маска на стену 1 ────────────────────────────────────────────────
  console.log('[Комната] mask')
  await page.evaluate(() => document.querySelector('.tab-panel').scrollTop = 300)
  await wait(300)
  await page.locator('button:has-text("+ Добавить")').first().click()
  await wait(400)
  // Маска добавляет 4 новых number инпута (x,y,w,h) — теперь у нас 10+4=14
  await allNum().nth(10).fill('50')   // x
  await allNum().nth(11).fill('0')    // y
  await allNum().nth(12).fill('90')   // width
  await allNum().nth(13).fill('220')  // height
  await wait(300)
  await shot(page, '12_room_with_mask')

  // ── Фото вкладка ────────────────────────────────────────────────────
  console.log('[Фото] with walls')
  await clickTab(page, 'Фото')
  await wait(800)
  await shot(page, '13_photo_with_walls_panorama')

  // ── 3D viewer ───────────────────────────────────────────────────────
  console.log('[3D viewer]')
  await clickTab(page, '3D')
  await wait(3500)
  await shot(page, '14_viewer_3d_3walls')

  await browser.close()
  console.log(`\n✅ Done. Errors: ${errors.length}`)
  errors.slice(0, 5).forEach(e => console.log(`  ❌ ${e.slice(0, 120)}`))
})()
