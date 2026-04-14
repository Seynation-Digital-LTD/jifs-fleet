/**
 * JIFS Fleet — Screenshot Re-capture (pages 08–16)
 * Uses your existing Chrome — no browser download needed.
 *
 * Run:
 *   node capture-screenshots.js
 */
const USERNAME = 'admin';
const PASSWORD = 'admin123';
const BASE_URL  = 'http://localhost:5173';
/* ---------------------------------------------------------- */

const puppeteer = require('puppeteer-core');
const path      = require('path');
const fs        = require('fs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT    = path.join(__dirname, 'guide-screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
const VIEWPORT = { width: 1440, height: 860 };

async function shot(page, filename) {
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: path.join(OUT, filename), clip: { x: 0, y: 0, width: 1440, height: 860 } });
  console.log(`  ✅  ${filename}`);
}

async function goto(page, url) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));
}

(async () => {
  console.log('\n🚀  Launching Chrome…');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // Log in
  await goto(page, '/');
  await page.waitForSelector('input', { timeout: 8000 });
  const inputs = await page.$$('input');
  await inputs[0].type(USERNAME);
  await inputs[1].type(PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 12000 }),
    page.keyboard.press('Enter')
  ]);
  console.log('  🔑  Logged in\n');

  // Verify login worked
  const url = page.url();
  if (url.includes('login') || url === BASE_URL + '/') {
    console.error('❌  Login failed — check USERNAME/PASSWORD at top of script');
    await browser.close();
    process.exit(1);
  }

  // ── 08. EXPENSE FORM ──────────────────────────────────────
  console.log('📸  Expense form…');
  await goto(page, '/expenses');
  // Click "Add" / "New Transaction" button
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')]
      .find(b => /add|new|log|record|transaction/i.test(b.innerText));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await shot(page, '08-expense-form.png');
  // Close modal with click on backdrop or × button
  await page.evaluate(() => {
    const close = document.querySelector('[aria-label="Close"], .modal-close, button.close, [data-dismiss]')
      || [...document.querySelectorAll('button')].find(b => /cancel|close|✕|×/i.test(b.innerText));
    if (close) close.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // ── 09. EXPENSE FILTERS ───────────────────────────────────
  console.log('📸  Expense filters…');
  await goto(page, '/expenses');
  await shot(page, '09-expense-filters.png');

  // ── 10. PRINT STATEMENT ───────────────────────────────────
  console.log('📸  Print Statement…');
  await goto(page, '/print-statement');
  await shot(page, '10-print-statement.png');

  // ── 11. STATEMENT TABLE ───────────────────────────────────
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')]
      .find(b => /generate|view|show|search|print|apply/i.test(b.innerText));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await shot(page, '11-statement-table.png');

  // ── 12. SERVICES ──────────────────────────────────────────
  console.log('📸  Services…');
  await goto(page, '/services');
  await shot(page, '12-services-list.png');

  // ── 13. PARTS ─────────────────────────────────────────────
  console.log('📸  Parts…');
  await goto(page, '/parts');
  await shot(page, '13-parts-list.png');

  // ── 14. DOCUMENTS ─────────────────────────────────────────
  console.log('📸  Documents…');
  await goto(page, '/documents');
  await shot(page, '14-documents-list.png');

  // ── 15. REPORTS — FIRST TAB ───────────────────────────────
  console.log('📸  Reports…');
  await goto(page, '/reports');
  await shot(page, '15-reports-tabs.png');

  // ── 16. REPORTS — SECOND TAB ──────────────────────────────
  await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('button, [role="tab"]')];
    if (tabs.length > 1) tabs[1].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await shot(page, '16-reports-chart.png');

  await browser.close();
  console.log('\n🎉  Done! Come back to Claude and say "screenshots done".\n');
})().catch(err => {
  console.error('\n❌  Error:', err.message);
  process.exit(1);
});
