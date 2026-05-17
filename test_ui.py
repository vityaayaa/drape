#!/usr/bin/env python3
"""
Visual UI test for drape PWA — mobile viewport (iPhone 14).
Captures all 5 tabs: empty state + with data.
"""

from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = 'http://localhost:5173'
OUT = '/home/victor/projects/drape/screenshots'
os.makedirs(OUT, exist_ok=True)

MOBILE = {'width': 390, 'height': 844}  # iPhone 14


def wait(page, ms=800):
    time.sleep(ms / 1000)


def shot(page, name):
    path = f'{OUT}/{name}.png'
    page.screenshot(path=path, full_page=False)
    print(f'  📸 {name}.png')
    return path


def click_tab(page, label):
    page.locator(f'button.nav-tab:has-text("{label}")').click()
    wait(page, 600)


with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            '--enable-webgl',
            '--use-gl=swiftshader',
            '--enable-accelerated-2d-canvas',
            '--no-sandbox',
        ]
    )
    ctx = browser.new_context(
        viewport=MOBILE,
        device_scale_factor=2,
        color_scheme='dark',
        is_mobile=True,
        has_touch=True,
    )
    page = ctx.new_page()

    # Collect console errors
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

    print('Opening app...')
    page.goto(BASE_URL, wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle')
    wait(page, 1000)

    # ── 1. КОМНАТА — пустое состояние ──────────────────────────────
    print('\n[Комната] empty state')
    click_tab(page, 'Комната')
    shot(page, '01_room_empty')

    # ── 2. КОМНАТА — заполняем данные ──────────────────────────────
    print('\n[Комната] filling tile params')
    # Ширина плитки
    page.locator('input[type="number"]').nth(0).fill('300')
    # Высота плитки
    page.locator('input[type="number"]').nth(1).fill('600')
    # Толщина
    page.locator('input[type="number"]').nth(2).fill('8')
    # Шов
    page.locator('input[type="number"]').nth(3).fill('2')
    wait(page, 400)

    # Добавляем стены
    page.locator('button:has-text("+ Добавить стену")').click()
    wait(page, 300)
    page.locator('button:has-text("+ Добавить стену")').click()
    wait(page, 300)
    page.locator('button:has-text("+ Добавить стену")').click()
    wait(page, 300)

    # Заполняем стены — Длина/Высота
    wall_length_inputs = page.locator('input[placeholder="—"]').all()
    # wall cards: каждая стена имеет 2 number inputs (длина, высота)
    # Стена 1: 350см × 280см
    wall_length_inputs[0].fill('350')
    wall_length_inputs[1].fill('280')
    # Стена 2: 450см × 280см
    wall_length_inputs[2].fill('450')
    wall_length_inputs[3].fill('280')
    # Стена 3: 200см × 280см
    wall_length_inputs[4].fill('200')
    wall_length_inputs[5].fill('280')
    wait(page, 500)
    shot(page, '02_room_with_data')

    # Скроллим вниз — углы и итог
    page.evaluate('document.querySelector(".tab-panel").scrollTop += 600')
    wait(page, 400)
    shot(page, '03_room_corners_summary')

    # ── 3. ДОБАВЛЯЕМ МАСКУ к стене 1 ───────────────────────────────
    print('\n[Комната] adding mask')
    page.evaluate('document.querySelector(".tab-panel").scrollTop = 0')
    wait(page, 300)
    page.locator('button:has-text("+ Добавить")').first.click()
    wait(page, 400)
    # Заполняем маску
    mask_inputs = page.locator('.coordRow input[type="number"]').all()
    if len(mask_inputs) >= 4:
        mask_inputs[0].fill('50')   # x
        mask_inputs[1].fill('0')    # y
        mask_inputs[2].fill('100')  # width
        mask_inputs[3].fill('220')  # height
    wait(page, 400)
    shot(page, '04_room_with_mask')

    # ── 4. ФОТО — пустое состояние ─────────────────────────────────
    print('\n[Фото] empty state')
    click_tab(page, 'Фото')
    wait(page, 500)
    shot(page, '05_photo_empty')

    # ── 5. 3D — со стенами ─────────────────────────────────────────
    print('\n[3D viewer]')
    click_tab(page, '3D')
    wait(page, 2000)  # WebGL init
    shot(page, '06_viewer_3d')

    # ── 6. СХЕМА ────────────────────────────────────────────────────
    print('\n[Схема]')
    click_tab(page, 'Схема')
    wait(page, 400)
    shot(page, '07_export_placeholder')

    # ── 7. УКЛАДКА ──────────────────────────────────────────────────
    print('\n[Укладка]')
    click_tab(page, 'Укладка')
    wait(page, 400)
    shot(page, '08_layout_placeholder')

    # ── 8. КОМНАТА — переопределение плитки ─────────────────────────
    print('\n[Комната] tile override')
    click_tab(page, 'Комната')
    wait(page, 300)
    page.evaluate('document.querySelector(".tab-panel").scrollTop = 0')
    wait(page, 200)
    page.locator('button:has-text("Переопределить плитку")').first.click()
    wait(page, 400)
    shot(page, '09_room_tile_override')

    browser.close()

    print(f'\n✅ Done. Errors collected: {len(errors)}')
    for e in errors[:5]:
        print(f'   ❌ {e[:120]}')
    print(f'\nScreenshots → {OUT}/')
