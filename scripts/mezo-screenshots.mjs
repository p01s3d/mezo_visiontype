// Dev helper: capture the three Mezo prototype states for visual verification.
// Usage: node scripts/mezo-screenshots.mjs [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const baseUrl = process.argv[2] ?? 'http://localhost:5173';
const outDir = 'export/mezo-shots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${baseUrl}/?txs`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/1-actions-active.png` });

// expand the "A gift" loan; grab mid-transition frames to check the choreography
const giftStrip = page.locator('.mezo-strip', { hasText: 'A gift' });
await giftStrip.click();
await page.waitForTimeout(120);
await page.screenshot({ path: `${outDir}/2a-expanding-120ms.png` });
await page.waitForTimeout(130);
await page.screenshot({ path: `${outDir}/2b-expanding-250ms.png` });
await page.waitForTimeout(950);
await page.screenshot({ path: `${outDir}/2-expanded.png` });
await giftStrip.click();
await page.waitForTimeout(150);
await page.screenshot({ path: `${outDir}/2c-collapsing-150ms.png` });
await page.waitForTimeout(450);

// timeline view
await page.getByRole('button', { name: 'timeline', exact: true }).click();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${outDir}/3-timeline.png` });

// back to actions (checks the reverse transition doesn't crash)
await page.getByRole('button', { name: 'actions', exact: true }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/4-back-to-actions.png` });

// show: all -> more strips than fit, canvas should scroll horizontally
await page.getByRole('button', { name: 'all', exact: true }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/5-all-scroll-start.png` });
await page.locator('.mezo-canvas').evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/6-all-scroll-end.png` });

// hover state on a strip
await page.locator('.mezo-strip', { hasText: 'Bridge' }).first().hover();
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/7-hover.png` });

await browser.close();
console.log(`done -> ${outDir}`);
