// @ts-check
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:5173'
const OUT = path.join(__dirname, 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const MOBILE = { width: 390, height: 844 }

function shot(page, name) {
  const p = path.join(OUT, `${name}.png`)
  return page.screenshot({ path: p, fullPage: false }).then(() => console.log(`  📸 ${name}.png`))
}

async function wait(ms = 800) {
  return new Promise(r => setTimeout(r, ms))
}

async function clickTab(page, label) {
  await page.locator(`button.nav-tab:has-text("${label}")`).click()
  await wait(700)
}

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
  })
  const ctx = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  })
  const page = await ctx.newPage()

  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

  console.log('Opening app...')
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await wait(1200)

  // ── 1. КОМНАТА — пустое ──────────────────────────────────
  console.log('\n[Комната] empty state')
  await clickTab(page, 'Комната')
  await shot(page, '01_room_empty')

  // ── 2. КОМНАТА — заполняем ───────────────────────────────
  console.log('\n[Комната] filling tile params')
  const numInputs = page.locator('.tab-panel input[type="number"]')
  await numInputs.nth(0).fill('300')   // ширина плитки
  await numInputs.nth(1).fill('600')   // высота плитки
  await numInputs.nth(2).fill('8')     // толщина
  await numInputs.nth(3).fill('2')     // шов
  await wait(300)

  // 3 стены
  for (let i = 0; i < 3; i++) {
    await page.locator('button:has-text("+ Добавить стену")').click()
    await wait(300)
  }

  // Длина/Высота стен — находим placeholder=— инпуты заново
  const wallInputs = await page.locator('input[placeholder="—"]').all()
  const wallData = [['350','280'], ['450','280'], ['200','280']]
  for (let i = 0; i < 3; i++) {
    await wallInputs[i * 2].fill(wallData[i][0])
    await wallInputs[i * 2 + 1].fill(wallData[i][1])
  }
  await wait(500)
  await shot(page, '02_room_with_walls')

  // Скролл вниз — углы и итог
  await page.evaluate(() => document.querySelector('.tab-panel').scrollTop += 600)
  await wait(400)
  await shot(page, '03_room_corners_and_summary')

  // ── 3. МАСКА ─────────────────────────────────────────────
  console.log('\n[Комната] adding mask to wall 1')
  await page.evaluate(() => document.querySelector('.tab-panel').scrollTop = 0)
  await wait(300)
  await page.locator('button:has-text("+ Добавить")').first().click()
  await wait(500)
  const maskInputs = await page.locator('input[type="number"][min="0"][step="any"]').all()
  // После добавления стен будут дополнительные инпуты маски
  // Найдём последние 4 number инпута в последней маске
  const allNumInputs = await page.locator('input[type="number"]').all()
  // Маска находится в WallCard — берём маску-инпуты внутри .coordRow
  const coordInputs = await page.locator('.coordRow input[type="number"]').all()
  if (coordInputs.length >= 4) {
    await coordInputs[0].fill('50')
    await coordInputs[1].fill('0')
    await coordInputs[2].fill('90')
    await coordInputs[3].fill('220')
  }
  await wait(500)
  await shot(page, '04_room_with_mask')

  // ── 4. ПЕРЕОПРЕДЕЛЕНИЕ ПЛИТКИ ────────────────────────────
  console.log('\n[Комната] tile override')
  await page.locator('button:has-text("Переопределить плитку")').first().click()
  await wait(500)
  await shot(page, '05_room_tile_override_open')

  // ── 5. ФОТО — пустое ─────────────────────────────────────
  console.log('\n[Фото] empty state')
  await clickTab(page, 'Фото')
  await wait(600)
  await shot(page, '06_photo_empty')

  // ── 6. 3D ─────────────────────────────────────────────────
  console.log('\n[3D viewer]')
  await clickTab(page, '3D')
  await wait(2500)  // WebGL init time
  await shot(page, '07_viewer_3d')

  // ── 7. СХЕМА ──────────────────────────────────────────────
  console.log('\n[Схема]')
  await clickTab(page, 'Схема')
  await wait(400)
  await shot(page, '08_export_placeholder')

  // ── 8. УКЛАДКА ────────────────────────────────────────────
  console.log('\n[Укладка]')
  await clickTab(page, 'Укладка')
  await wait(400)
  await shot(page, '09_layout_placeholder')

  await browser.close()

  console.log(`\n✅ Screenshots → ${OUT}/`)
  if (errors.length) {
    console.log(`\n⚠️  Console errors (${errors.length}):`)
    errors.slice(0, 8).forEach(e => console.log(`   ${e.slice(0, 120)}`))
  } else {
    console.log('✅ No console errors')
  }
})()
