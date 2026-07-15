/**
 * Capture PNG exports of guide preview components.
 * Usage: node scripts/export-guide-preview.mjs [preview]
 * Previews: trade | prices | charts | sidebar | icons | all
 *
 * Requires dev server at http://localhost:5173
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../export/guide-static-draft/png');

const PREVIEWS = {
  trade: {
    title: 'Flat right rail, no card elevation',
    filename: 'trade-panel.png',
  },
  prices: {
    title: 'Make tables real with DefiLlama',
    filename: 'prices-table.png',
  },
  charts: {
    title: 'Match Coinbase Home with CDS charts',
    filename: 'charts.png',
  },
  sidebar: {
    title: 'Start from the CDS Vite template',
    filename: 'sidebar.png',
  },
  icons: {
    title: 'Theme, motion, and interaction',
    filename: 'icons-grid.png',
  },
};

async function findPreviewCard(page, sectionTitle) {
  return page.evaluate((title) => {
    const heading = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,span,p,div')].find(
      (el) => el.childNodes.length <= 1 && el.textContent?.trim() === title,
    );
    if (!heading) return null;

    let section = heading;
    for (let i = 0; i < 6; i++) {
      section = section.parentElement;
      if (!section) return null;
      if (section.style?.display === 'grid' || getComputedStyle(section).display === 'grid') {
        const cols = section.children;
        if (cols.length >= 2) {
          const previewCol = cols[cols.length - 1];
          const card = previewCol.querySelector('div');
          if (card) {
            const rect = card.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            };
          }
        }
      }
    }
    return null;
  }, sectionTitle);
}

async function exportPreview(page, key) {
  const { title, filename } = PREVIEWS[key];

  await page.evaluate((t) => {
    const heading = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,span,p,div')].find(
      (el) => el.childNodes.length <= 1 && el.textContent?.trim() === t,
    );
    heading?.scrollIntoView({ block: 'center' });
  }, title);

  await page.waitForTimeout(400);

  const clip = await findPreviewCard(page, title);
  if (!clip || clip.width < 10) {
    throw new Error(`Could not find preview card for "${title}"`);
  }

  const outPath = path.join(OUT_DIR, filename);
  await page.screenshot({
    path: outPath,
    clip: {
      x: Math.max(0, clip.x),
      y: Math.max(0, clip.y),
      width: clip.width,
      height: clip.height,
    },
  });

  console.log(`Saved ${outPath} (${Math.round(clip.width)}×${Math.round(clip.height)})`);
}

const arg = process.argv[2] ?? 'trade';
const keys = arg === 'all' ? Object.keys(PREVIEWS) : [arg];

if (keys.some((k) => !PREVIEWS[k])) {
  console.error(`Unknown preview "${arg}". Use: ${Object.keys(PREVIEWS).join(' | ')} | all`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:5173/?guide', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

for (const key of keys) {
  await exportPreview(page, key);
}

await browser.close();
