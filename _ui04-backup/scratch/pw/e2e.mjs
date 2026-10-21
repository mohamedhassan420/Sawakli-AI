import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'

const S = '/home/user/ui04-work/scratch'
const EV = '/home/user/ui04-work/evidence'
const BASE = 'http://localhost:3041'
const phase = process.argv[2] ?? 'main'
const secret = (name) => readFileSync(`${S}/secrets/${name}`, 'utf8').trim()

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Africa/Cairo', locale: 'en-US' })
const page = await context.newPage()
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${page.url()} :: ${m.text().slice(0, 300)}`) })
page.on('pageerror', (e) => consoleErrors.push(`${page.url()} :: pageerror ${String(e).slice(0, 300)}`))
const out = { phase, steps: [] }
const log = (step, data = {}) => { out.steps.push({ step, ...data }); console.log(step, JSON.stringify(data)) }

async function login(email, passwordFile) {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(secret(passwordFile))
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/setup/connector')
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.waitForURL('**/dashboard')
  log('login', { email, landed: new URL(page.url()).pathname })
}

async function kpis() {
  await page.getByTestId('kpi-spend').waitFor()
  const result = {}
  for (const key of ['spend', 'clicks', 'conversions', 'ctr', 'cpa', 'roas']) {
    const card = page.getByTestId(`kpi-${key}`)
    result[key] = {
      value: (await card.locator('.kpi-value').innerText()).trim(),
      delta: (await card.locator('.kpi-delta').count()) ? (await card.locator('.kpi-delta').innerText()).trim() : null,
    }
  }
  result.dataThrough = (await page.locator('.data-through').innerText()).trim()
  result.mutedLine = (await page.locator('.muted-line').count()) ? (await page.locator('.muted-line').first().innerText()).trim() : null
  result.attention = (await page.locator('.attention-strip li').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim())
  return result
}

async function tableRows() {
  await page.locator('table tbody tr').first().waitFor()
  const rows = await page.locator('table tbody tr').evaluateAll((trs) => trs.map((tr) => ({
    cells: [...tr.querySelectorAll('td')].map((td) => td.innerText.trim()),
    weakClass: tr.classList.contains('row-weak'),
    reason: tr.querySelector('td:last-child .badge')?.getAttribute('title') ?? null,
  })))
  return { rows, footer: (await page.locator('.table-footer').innerText()).trim() }
}

if (phase === 'main') {
  await login('demo@nourfashion.example', 'demo_password')

  log('dashboard-default', await kpis())
  await page.screenshot({ path: `${EV}/01-dashboard-default-last90.png`, fullPage: true })

  await page.goto(`${BASE}/dashboard?range=all`)
  log('dashboard-all', await kpis())

  await page.goto(`${BASE}/dashboard?range=7d`)
  log('dashboard-7d', await kpis())

  await page.goto(`${BASE}/dashboard`)
  await page.getByTestId('kpi-spend').waitFor()
  await page.getByLabel('Platform').selectOption('meta')
  await page.waitForURL('**/dashboard?platform=meta')
  log('dashboard-meta', { url: page.url(), ...(await kpis()) })
  await page.screenshot({ path: `${EV}/02-dashboard-filtered-meta.png`, fullPage: true })

  await page.goto(`${BASE}/dashboard?range=30d`)
  log('dashboard-30d', await kpis())
  await page.screenshot({ path: `${EV}/03-dashboard-last30-deltas.png`, fullPage: true })

  await page.locator('.attention-link').click()
  await page.waitForURL('**/campaigns?range=30d')
  log('campaigns-30d-via-attention-link', { url: page.url(), ...(await tableRows()) })
  await page.screenshot({ path: `${EV}/04-campaigns-last30-flash-sale-weak.png`, fullPage: true })

  await page.goto(`${BASE}/campaigns`)
  log('campaigns-default', await tableRows())
  await page.screenshot({ path: `${EV}/05-campaigns-default-weak-rows.png`, fullPage: true })
  await page.locator('.perf-legend').screenshot({ path: `${EV}/06-campaigns-legend.png` })

  await page.getByRole('button', { name: 'ROAS' }).click()
  log('campaigns-sorted-roas-desc', await tableRows())

  await page.goto(`${BASE}/campaigns?platform=google&status=active`)
  log('campaigns-google-active', await tableRows())

  await page.goto(`${BASE}/campaigns`)
  await page.getByRole('link', { name: 'Summer Collection Push' }).click()
  await page.getByRole('heading', { name: 'Summer Collection Push' }).waitFor()
  log('detail', { url: page.url(), heading: await page.getByRole('heading', { level: 2 }).innerText() })
  await page.screenshot({ path: `${EV}/07-campaign-detail-real-header.png`, fullPage: true })

  await page.goto(`${BASE}/campaigns/00000000-0000-0000-0000-000000000000`)
  await page.getByText('Campaign not found.').waitFor()
  log('detail-unknown-id', { notFound: true })

  // Expired or invalid token -> central 401 rule clears the session and lands on /login.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('sawakli-session'))
    s.access_token = 'invalid-token'
    localStorage.setItem('sawakli-session', JSON.stringify(s))
  })
  await page.goto(`${BASE}/dashboard`)
  await page.waitForURL('**/login', { timeout: 15000 })
  log('expired-token', { landed: new URL(page.url()).pathname, sessionCleared: await page.evaluate(() => localStorage.getItem('sawakli-session') === null) })

  // Second organization with no data.
  await login('other@isolation.example', 'other_password')
  await page.getByText('No marketing data is available yet.').waitFor()
  log('other-org-empty', { kpiCards: await page.locator('[data-testid^=kpi-]').count() })
  await page.screenshot({ path: `${EV}/08-empty-state-second-org.png`, fullPage: true })
  await page.goto(`${BASE}/campaigns/770e8400-e29b-41d4-a716-44665544000a`)
  await page.getByText('Campaign not found.').waitFor()
  log('other-org-nour-campaign-detail', { notFound: true })
}

if (phase === 'error') {
  await login('demo@nourfashion.example', 'demo_password').catch((e) => log('login-failed-as-expected', { error: String(e).slice(0, 120) }))
}

if (phase === 'error-with-session') {
  // API stopped after login: reload the dashboard with the stored session.
  await page.goto(`${BASE}/login`)
  await page.evaluate((session) => {
    localStorage.setItem('sawakli-session', session)
    document.cookie = 'sawakli-auth=1;path=/'
  }, readFileSync(`${S}/session.json`, 'utf8'))
  await page.goto(`${BASE}/dashboard`)
  const alert = page.locator('.data-state-error')
  await alert.waitFor({ timeout: 20000 })
  log('error-state', { text: (await alert.innerText()).replace(/\s+/g, ' '), retryButton: await alert.getByRole('button', { name: /retry/i }).count() })
  await page.screenshot({ path: `${EV}/09-error-state-api-stopped.png`, fullPage: true })
}

if (phase === 'save-session') {
  await login('demo@nourfashion.example', 'demo_password')
  writeFileSync(`${S}/session.json`, await page.evaluate(() => localStorage.getItem('sawakli-session')), { mode: 0o600 })
  log('session-saved', {})
}

log('console-errors', { count: consoleErrors.length, errors: consoleErrors.slice(0, 10) })
writeFileSync(`${EV}/e2e-${phase}.json`, JSON.stringify(out, null, 2))
await browser.close()
