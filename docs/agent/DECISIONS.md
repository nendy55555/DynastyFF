# Dynasty FF — Decisions Log

Append-only record of decisions that shape the codebase. Every entry explains *why* so future-you can judge whether the reasoning still holds.

---

## 2026-04-20 — Single-file architecture stays

**Decision:** Keep `index.html` as a single ~7,800-line file. Do not split into separate `.js`/`.css` files.

**Why:**
- The README promises "One self-contained HTML file, no build step"
- GitHub Pages serves it directly with zero deploy pipeline
- Splitting would introduce a bundler (Vite / Rollup / esbuild) and a build step, which is the exact maintenance tax we're trying to avoid
- The only real cost of single-file is testability — solved separately via `tests/extract.mjs`

**Tradeoff:** Longer edits scroll through more lines. Accepted.

**When to revisit:** If the file grows past 15,000 lines, or if we ever need a framework.

---

## 2026-04-20 — Test harness extracts from HTML at test time

**Decision:** Tests use `tests/extract.mjs` to brace-count function bodies out of `index.html` and emit a CommonJS module to `tests/.cache/logic.cjs`. The site itself is unchanged — only the test harness ever runs the extractor.

**Why:**
- Preserves the single-file architecture decision above
- No refactor risk — the site code stays exactly as it was
- Zero new production dependencies
- Uses only Node built-ins (`node:test`, `node:fs`, `createRequire`)

**Tradeoff:** The extractor breaks if target functions get renamed or converted to arrow syntax. Mitigated by: documenting the fragility in `tests/extract.mjs`, and listing targets in a single `TARGETS` array so fixing it is one edit.

**Alternative considered:** Split logic into `js/logic.js` and import it. Rejected because it forces a deploy-path change (loading an external script from Pages) and a build step for older-browser compatibility.

---

## 2026-04-20 — Chart.js pinned with SRI

**Decision:** Chart.js script tag now includes `integrity="sha512-..."` and `crossorigin="anonymous"`.

**Why:**
- cdnjs is trusted but not infallible — an SRI hash eliminates the entire "CDN tampering" class of risk
- Zero runtime cost
- Hash was retrieved from cdnjs's official SRI endpoint on 2026-04-20

**When to revisit:** Only when bumping Chart.js version. Copy the new hash from cdnjs.

---

## 2026-04-20 — CORS proxy fallback list (3 deep)

**Decision:** Replaced the single-proxy `PROXY = 'https://corsproxy.io/?'` with a helper `proxyFetch()` that iterates through `CONFIG.CORS_PROXY_FALLBACKS`:

```js
CORS_PROXY_FALLBACKS: [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy?quest='
]
```

**Why:**
- Free public CORS proxies have zero SLA. The original code would silently fail (status text only) if corsproxy.io went down or rate-limited us
- Three independent proxies means roughly 3x higher availability
- All three accept `encodeURIComponent(targetUrl)` appended to the prefix — same URL shape, easy iteration

**Tradeoff:** A request now potentially hits 3 proxies sequentially on a bad day. Acceptable — worst case adds ~6 seconds to the Refresh button.

**When to revisit:** If any of the three disappears, swap in a new one. Keep 3 in the list at all times.

---

## 2026-04-20 — localStorage cache for KTC/FP with staleness warning

**Decision:** Successful KTC/FP fetches now persist to localStorage under keys `dff_ktc_v1` and `dff_fp_v1`. On page load, an IIFE (`hydrateExternalsFromCache`) reads these and `Object.assign`s them into the live `ktcValues`/`fpRanks` objects. If the cache is older than `CONFIG.STALE_WARN_MS` (7 days), a console warning fires.

**Why:**
- Without this, a user who loads the page after a KTC/FP outage sees only the small embedded fallback objects (~200 players)
- Cached values survive proxy outages — cross-session resilience
- Keyed with `_v1` suffix so we can bust the cache later by bumping to `_v2` if the shape changes

**Tradeoff:** Stale cache could mislead a user who hasn't refreshed in months. The 7-day warning mitigates but doesn't eliminate this.

**When to revisit:** If we ever change the shape of `ktcValues` (e.g., adding a third tuple element), bump `_v1` to `_v2` to invalidate old caches.

---

## 2026-04-20 — Data validation errors surface as a dismissible banner

**Decision:** The existing `validateData` IIFE now also pushes errors into `window.__dffValidateErrors`. A second IIFE reads that and renders a red banner at the top of the page when errors exist, showing the first 4 issues plus "see console for details." Dismissible with an × button.

**Why:**
- Console-only warnings are invisible to users making manual weekly data edits
- A visible banner catches "I forgot to update losses after updating wins" class of bugs before they're live for hours
- Dismissible so it doesn't block usage when the user has already seen it

**Tradeoff:** Small visual cost (red banner) during development. Acceptable.

---

## 2026-04-20 — Dead code: removed no-op `getGrade` function

**Decision:** Deleted `getGrade(score, pickNum, totalPicks, isRookie)` (formerly lines 6418-6426). Both branches returned `score` unchanged and it was called from nowhere.

**Why:** Dead code. No behavior change.

**Verified:** `grep -n "getGrade\b"` in the file returns zero matches after the deletion.

---

## 2026-04-20 — No Claude API calls to downgrade

**Decision:** The Opus→Sonnet→Haiku downgrade workstream is N/A for this project. Zero Claude API calls exist.

**Why:** This project was built as a static dashboard — all scoring/grading logic is deterministic JS. No LLM dependency.

**When to revisit:** If a future feature (e.g., natural-language trade analysis) adds a Claude call, this decision block should be updated and the new call should start on the cheapest tier that passes eval.

---

## 2026-04-20 — Did NOT add: write-through proxy with analytics

**Considered:** Routing KTC/FP fetches through a Cloudflare Worker that caches responses and gives us telemetry.

**Rejected because:**
- Adds infrastructure I'd have to maintain
- Costs money past free tier
- The browser localStorage cache + 3-proxy fallback covers 95% of the resilience value
- Direct contradiction with the "minimal maintenance after Max downgrade" goal

**When to revisit:** Only if proxy failures become a recurring problem and I'm willing to pay $5/mo for a Worker.

---

## 2026-04-24 — H2H Record column now sums the row (was regular-season only)

**Decision:** `generateH2HGrid()` computes the Record column by summing `h2hData[owner]` across all opponents, instead of reading `allTimeData[owner].total_wins/total_losses`. Sort order uses the same H2H totals.

**Why:**
- `allTimeData` is regular season only (derived from `seasons[year].wins/losses`)
- `h2hData` includes regular season + playoffs (per the existing comment on the constant)
- The old Record column used `allTimeData` while the matrix cells used `h2hData`, so the Record didn't equal the sum of the row — users noticed the inconsistency
- Aligning both to `h2hData` is the simpler fix because the matrix is the primary visual

**Tradeoff:** Rankings in the H2H table can now diverge slightly from other tabs that use regular-season standings. Accepted — the H2H tab's own numbers are internally consistent, which matters more.

**When to revisit:** If we add a "regular season only" toggle to the H2H view, both sources would be needed.

---

## 2026-04-20 — Did NOT add: Chart.js self-hosted copy

**Considered:** Downloading `chart.umd.js` into the repo and serving it from GitHub Pages to eliminate the CDN dependency entirely.

**Rejected because:**
- SRI hash already closes the tampering vector
- Self-hosting adds ~200KB to every page load (no CDN cache benefit)
- Makes Chart.js version upgrades a file-swap chore

**When to revisit:** If cdnjs ever goes down for >24 hours.
