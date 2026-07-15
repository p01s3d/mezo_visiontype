# Static guide preview draft

Self-contained HTML/CSS mock of one deep-dive section (trade panel). Copy into a mitteartlab.com page — no React or CDS runtime.

## Preview locally

Open `trade-preview.html` in a browser, or serve this folder:

```bash
npx serve export/guide-static-draft
```

Font paths in the HTML point at `src/assets/fonts/riforma/` for local preview. On your site, either:

- Copy the woff2 files next to the CSS, or
- Drop the `@font-face` block and rely on `system-ui` (defined in `guide-tokens.css`)

## Files

| File | Role |
|------|------|
| `guide-tokens.css` | Shared design tokens from `design.md` |
| `trade-preview.css` | Section layout + trade panel styles |
| `trade-preview.html` | One 50/50 deep-dive section (copy + mock) |

## Drop into mitteartlab.com

1. Copy `guide-tokens.css` and `trade-preview.css` into your static assets folder.
2. Paste the `<article class="guide-section">…</article>` block into a case-study page.
3. Repeat the pattern for other previews (prices table, sparkline, sidebar, icon grid).

## Notes

- Preview is **visual only** — tabs, dropdown, and input are not interactive.
- Trade panel width is fixed at `360px` to match the live dashboard rail.
- Replace coincap icon URLs with local assets if you prefer no external requests.

## PNG export (live CDS previews)

With the dev server running (`yarn dev`), capture PNGs from the React guide:

```bash
yarn export:guide-preview trade    # one preview
yarn export:guide-preview all      # all five
```

Output: `export/guide-static-draft/png/`

| File | Section |
|------|---------|
| `trade-panel.png` | Trade rail |
| `prices-table.png` | Prices table |
| `charts.png` | Sparklines |
| `sidebar.png` | Expanded nav |
| `icons-grid.png` | Icon grid |

Uses Playwright headless Chromium — crops the preview card from `/?guide`, not the full page.
