# Mezo History Strips — workflow log

Goal: build the Mezo activity-history prototype from three reference screenshots as a
standalone full-screen view inside the existing `defi-system` repo.

Reference screenshots:

1. **Actions view** — thin vertical "history strips" (Loan / Stake / Swap / Transfer …)
   arranged like a skyline, filter bar on top (`show`, `view by`, `filter by`),
   dark action rail on the right, wealth bar pinned at the bottom.
2. **Expanded strip** — clicking a strip expands it horizontally into a wide detail
   card (progress, payment schedule, status rows, loan health meter) while neighbors
   slide outward.
3. **Timeline view** — `view by: timeline` repositions the strips along a horizontal
   time axis while a red wealth area chart slides up from the bottom, with dashed
   connectors from each strip down to the axis.

---

## Phase 1 — Scaffold

- **Route**: added an `?mezo` URL check in `src/App.tsx` (same pattern as the existing
  `?guide` view). When present, the app renders `<MezoApp />` full-screen and skips the
  CDS shell entirely — the Mezo look is a different brand, so pulling in the Coinbase
  design system would fight us more than help.
- **Styling decision**: self-contained `src/components/Mezo/mezo.css` with plain class
  names instead of CDS props. The Riforma font is already loaded globally, so the
  prototype inherits it for free.
- **Static data**: `src/data/mezoActions.ts` — 12 hand-written actions (7 active,
  5 completed) with October day-of-month values driving the timeline, loan detail
  payloads for the three loans, and a hand-crafted 22-point wealth series ending at
  $316,463. Fully static per the brief; no seeded randomness needed.

- **Type shim**: framer-motion v10 (pinned by `@coinbase/cds-web`'s peer dependency,
  so not upgradeable) has types that predate React 19 — `motion.div` loses
  `className` and other intrinsic props under `@types/react` 19. Added a small
  `motion.ts` re-typing wrapper (`MotionDiv`) instead of casting at every call site.

## Phase 2 — Actions view (screenshot 1)

- **Positioning engine**: instead of a flex row, `StripCanvas` computes absolute
  `x/y/width/height` for every strip and animates them with framer-motion springs.
  One engine handles all three states (packed row, expanded neighbor-shift, timeline
  scatter) — switching modes is just a different position computation, and
  framer-motion tweens between them automatically.
- Strip height scales with amount (min→max mapped to 210–330px); a small deterministic
  hash of the id gives each strip its vertical stagger, producing the skyline effect
  without storing layout data.
- `show: all / active only` filters the data; strips animate in/out with
  `AnimatePresence` (fade + scale). `filter by: none` is a visual placeholder.
- Fixed chrome built in this phase: `MezoHeader` (squiggle wordmark + menu pill),
  `ActionRail` (six dark icon buttons + close pill, visual only), `WealthBar`
  (avatar, total wealth, mezo points, dotted progress strip).

- **Bug found via screenshots**: the button reset (`.mezo-root button`) had higher
  specificity than the single-class pill/button styles, so filter pills, detail
  buttons, and the dark rail all rendered unstyled. Fixed by wrapping the reset in
  `:where()` to zero out its specificity.

## Phase 3 — Expand / collapse (screenshot 2)

- Clicking a strip expands it in place to 880×432. Because the positioning engine
  recomputes every strip's x when one width changes, neighbors slide outward on the
  same spring — no extra choreography code.
- Expanded content cross-fades in after the shell grows (staggered `AnimatePresence`).
- Loans get the full layout: dark illustration tile, title/amount, "Borrow more" /
  "Pay back early" buttons, and a right pane with progress header (35% / on-track
  pills), dot progress row, vertical payment schedule (complete/pending/upcoming),
  status rows, and the loan-health gradient meter. Other action types reuse the
  right pane with simple status rows.
- Clicking the expanded strip header, another strip, or switching filters/views
  collapses it.

## Phase 4 — Timeline view (screenshot 3)

- `view by: timeline` maps each strip's October day onto the canvas width; strips
  animate from their packed positions to their date positions (same spring engine).
- The wealth area chart is a plain SVG (catmull-rom smoothed path, pink gradient
  fill, point markers, "total wealth" pill at the line end). It mounts inside a
  `motion.div` that slides up from below the viewport; on exit it slides back down.
- Dashed vertical connectors render from each strip's bottom edge to the axis;
  tick pills ("Oct 2w", "Oct 3w", "Today") sit on the axis at the same x-scale used
  by both the strips and the chart, so everything lines up by construction.
- The `view by` control mirrors the screenshot: when timeline is active the group
  reads `timeline: [total wealth]` with a red pill. Switching to timeline also flips
  `show` to `all` — the reference frames show that pairing, and the timeline reads
  better with the full history.
- First timeline screenshot showed the strips bunched right of center: the original
  mock dates clustered in Oct 7–22. Spread the action days across Oct 2–22 so the
  scatter fills the axis like the reference.

## Phase 5 — Polish & verification

- Springs tuned (`stiffness 170 / damping 26` for strip layout, softer
  `stiffness 120 / damping 22` for the chart entrance). Strip content cross-fades
  with a short delay so text never squishes while the shell resizes.
- Wrote `scripts/mezo-screenshots.mjs` (Playwright, already a dev dependency): loads
  `/?mezo`, captures actions view, expanded "A gift", timeline, and the reverse
  transition to `export/mezo-shots/`. Used the captures to compare against the three
  reference images at 1440×900 — skyline spacing, expanded card proportions, and
  timeline scatter + chart alignment all match.
- `tsc -b` clean, no linter errors. Prototype reachable at `http://localhost:5173/?mezo`.

## Phase 6 — Density, scrolling, hover, progress details

- **More strips**: dataset grew from 12 to 20 actions (Oct 1–22, 10 active /
  10 completed). "A gift" gained an extra past schedule entry to feed the fade
  effect below.
- **Horizontal scrolling**: the canvas is now a scroll container (hidden scrollbar)
  with an inner content div sized by the same positioning engine — packed-row width
  in actions mode, a minimum of 104px per day in timeline mode so strips keep
  breathing room instead of piling up. The chart, ticks, and connectors live inside
  the scrolling content, so everything stays aligned while scrolling. Entering the
  timeline auto-scrolls to "Today"; expanding a strip scrolls it into view centered.
- **Hover states**: clickable strips lift 10px and scale 2% on a spring
  (framer-motion `whileHover`), with a deeper shadow and a subtle icon nudge via CSS.
- **Progress details** (matching the reference expanded card): progress dots pop in
  with a staggered spring after the card opens; the schedule rail is now continuous
  between markers; the oldest schedule entry sits half-cut behind a top fade mask
  (like the reference's cropped "$105.12"); the pending payment is emphasized
  (larger, darker) while upcoming stays faded.
- Verified with the screenshot script (extended to capture scroll start/end and a
  hover frame). `tsc -b` clean.
- **Follow-up fix**: "it's not scrolling" — the canvas only reacted to native
  horizontal input (trackpad swipe / shift+wheel), so a plain mouse wheel did
  nothing. Added a non-passive `wheel` listener that maps vertical `deltaY` to
  `scrollLeft` when the canvas overflows. Verified with a scripted wheel event
  (scrollLeft 0 -> 600).
- **Follow-up fix**: inconsistent hover — some strips lifted, others only showed
  the shadow. Cause: the `whileHover` target used `y: layout.y - 10`, computed from
  the strip's layout position; framer-motion's hover gesture could hold a stale
  target (or get interrupted by expand/filter re-layouts), so the lift silently
  no-oped on some strips while the CSS shadow still fired. Fix: split each strip
  into an outer layer (framer-motion position/size transforms only) and an inner
  `.mezo-strip-card` layer that owns all visuals; the hover lift is now pure CSS
  (`translateY(-10px) scale(1.02)`) on the inner layer, so it can never conflict
  with the position animation. Verified all strips report the identical hover
  transform matrix.

## Phase 7 — Expand/collapse choreography

- Replaced the whole-tree cross-fade with **shared-element choreography**. Each strip
  card now renders three layers: a persistent shared layer (icon, title, amount)
  that travels between collapsed and expanded coordinates; a collapsed-only meta
  layer (type label, date, status dot) that fades out on expand and back in on
  collapse; and the expanded-only detail that fades in staggered.
- **Manual coordinates over `layoutId`**: framer-motion's shared layout API measures
  targets at mount, while our card is still mid-resize (width/height animate via
  the positioning engine), so targets would be stale. Both coordinate sets live in
  `GEOM` in `constants.ts`, next to a single `TIMING` scale (spring, 100-120ms exits,
  40ms shared-element stagger, 180/240ms content entrance delays).
- Choreography: icon leads, title follows +40ms, amount +80ms (overlapping action);
  the dark tile scales in from 0.6 beneath the arriving icon at ~120ms (secondary
  action); the right pane rises in at ~180ms, buttons at ~240ms; progress dots keep
  their staggered pop. Loans send the small arrow icon to the tile's badge (where
  that glyph lives in the expanded state); other types land it centered on the tile
  at full size. Collapse reverses: content sinks out in 120ms, shared elements
  travel back on the same stagger, meta fades back in at ~150ms.
- **Bug found while verifying**: framer-motion v10 silently ignores `fontSize` on
  update animations — the expanded title stayed at 12px. Switched the text morph to
  a fixed font size + animated `scale` with `transformOrigin: top center` (also the
  more performant, transform-only approach).
- Reduced motion: `useReducedMotion()` collapses all travel/scale to plain fades
  (position changes become instant), and a `prefers-reduced-motion` media query
  disables the CSS hover lift/nudge. Hover feedback tightened 250ms -> 150ms; added
  an `:active` squash (0.98) for press feedback.
- Verified via mid-transition captures (120ms/250ms expand, 150ms collapse) showing
  elements traveling and growing rather than cross-fading.

## Phase 8 — Animation principles polish

Applied the **animation-principles** and **interaction-design** skill review:

- **Collapse reverse stagger**: `StripDetail` root is now a variant container with
  three direct grid children (tile, pane, buttons). `staggerDirection: -1` on exit
  runs buttons → pane → tile; each sinks 8px while fading (120ms).
- **Staging**: non-expanded strips animate to `opacity: 0.55` / `scale: 0.97` via the
  `.mezo-strip-enter` layer while one card is open — directs attention without hiding
  neighbors entirely.
- **Anticipation**: `MezoApp` holds an `anticipatingId` for 80ms before setting
  `expandedId`; `.is-anticipating` squashes the card to 0.98 before the width spring.
- **Keyboard / focus**: strips are `role="button"` with `tabIndex`, `aria-expanded`,
  `aria-label`, Enter/Space handler, and a `:focus-visible` ring that mirrors hover
  (lift + green outline).
- **Detail innards stagger**: schedule rows, status rows, and loan health each rise in
  with 30ms steps after the right pane lands.
- **Icon arc**: shared icon uses split x/y springs (`stiffness 200` / `120`) so travel
  curves rather than sliding on a straight diagonal.
- **Secondary action on expand**: `.is-expanded` deepens the card shadow during the
  spring.
- Verified with updated screenshot script; `tsc -b` clean.
