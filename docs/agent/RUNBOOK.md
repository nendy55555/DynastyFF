# Dynasty FF — Operator Runbook

Written so future-you (or anyone else) can keep this site alive with near-zero Claude help.

**Project root:** `/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF`
**Site URL:** https://nendy55555.github.io/DynastyFF/
**Repo:** https://github.com/nendy55555/DynastyFF

## Everyday operations

### Weekly in-season update (5 min)

1. Open `index.html` in your editor
2. Scroll to the data block at the top of the `<script>` tag and update:
   - `allTimeData[2026]` — win/loss/fpts for current season
   - `h2hData[2026]` — head-to-head results for the new week
   - `streakData` — if streaks changed
3. Save, then push:
   ```bash
   cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
   git add index.html
   git commit -m "Week N data update"
   git push
   ```
   Time: ~30 seconds. GitHub Pages rebuilds in ~1 minute.

### Hit "Refresh Values" in the UI

1. Open the live site
2. Click the "Refresh Values" button (top of Trades tab)
3. Wait for the status text: "KTC updated N · FP updated M"
4. Values auto-cache to localStorage with a 24-hour TTL

If the button shows an error, see [CORS proxy failed](#cors-proxy-failed) below.

### End-of-season rollover

Once the 2026 season completes:

1. Bump `CONFIG.CURRENT_SEASON` to `2027`
2. Rename `pickProjection2026` to `pickProjection2027` and re-project picks (update `pick` numbers based on standings)
3. Grep the codebase for `2026` to catch any other hardcoded references:
   ```bash
   cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
   grep -n "2026" index.html
   ```
4. Run tests to catch any breakage:
   ```bash
   cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
   node tests/extract.mjs && node --test tests/logic.test.mjs
   ```
   Time: ~3 seconds.

## Testing

### Run the full test suite

```bash
cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
node tests/extract.mjs && node --test tests/logic.test.mjs
```

Time: ~2 seconds. Expected: `# pass 30 / # fail 0`.

### What the tests cover

- `normalizeName` — alias lookups
- `getPlayerKTC` / `getPlayerKTCRank` / `getPlayerFPRank` — direct rank lookups
- `getAssetKTC` — player lookups, future picks (`YYYY R#`), exact picks (`YYYY R.SLOT`), tier bumps, year discounts
- `buildPickOwnershipMap` / `resolvePickOriginalOwner` — chronological trade replay
- `gradeTrade` — balanced trades, lopsided trades, invalid input, mixed player+pick trades
- `calculateGradeStartup` — KTC-rank-based startup grading
- `calculateGradeKTC` — rookie + startup dispatcher

### What the tests DO NOT cover

- The Sleeper API integration (live network)
- KTC/FantasyPros HTML scraping (depends on their current markup)
- UI rendering (DOM code untested)
- Chart.js rendering

Anything above is covered by manual smoke testing in the browser.

### Adding new tests

1. Add a new `describe(...)` block to `tests/logic.test.mjs`
2. If the function you want to test isn't exported, add its name to `TARGETS` in `tests/extract.mjs`
3. Re-run extract + test:
   ```bash
   cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
   node tests/extract.mjs && node --test tests/logic.test.mjs
   ```

### If the extractor breaks

The extractor uses brace-counting to pull functions out of `index.html`. It breaks if:

- A target function gets renamed → update `TARGETS` in `extract.mjs`
- A target function gets converted to arrow syntax (`const fn = () => {}`) → rewrite the extractor or declare it as `function fn() {}`
- A function has a string literal containing an unbalanced `{` or `}` → the extractor handles single/double/backtick strings, but regex literals with braces would break it

You'll see: `Error: Function 'X' not found in source` or `Unbalanced braces extracting 'X'`.

## Deploys

### Deploy to GitHub Pages

GitHub Pages serves directly from the `main` branch of the repo. There is no build step. Every `git push` to `main` is a deploy.

```bash
cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
git add -A
git commit -m "Short reason for change"
git push
```

Time: ~30 seconds for the push, ~60 seconds for Pages to rebuild.

### Verify a deploy

1. Visit https://nendy55555.github.io/DynastyFF/ in a private window (to bypass your browser cache)
2. Hard-refresh (Cmd+Shift+R on Mac)
3. Check the browser console for red errors
4. Confirm charts render, standings load, Refresh Values button works

### Rollback a bad deploy

```bash
cd "/Users/thomasnendick/Documents/Claude/Projects/Dynasty FF"
git log --oneline -5
git revert <bad-commit-sha>
git push
```

Time: ~2 minutes total. GitHub Pages rebuilds on the next commit.

## Debugging

### CORS proxy failed

**Symptom:** Refresh Values button shows "Could not reach KTC" or similar.

**Diagnosis:**
1. Open browser DevTools → Network tab
2. Click Refresh Values
3. Check requests to `corsproxy.io`, `allorigins.win`, `codetabs.com`

**The fallback list (as of 2026-04-20):**
```js
CORS_PROXY_FALLBACKS: [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy?quest='
]
```

If all three fail, the cached localStorage data still serves the UI. You can:
- Wait 24 hours (rate limits often reset)
- Swap in another public proxy. Search `[cors proxy free]` and replace one entry in `CONFIG.CORS_PROXY_FALLBACKS`

### KTC values look wrong or all zeros

**Symptom:** KTC column shows `-` or `0` for known players after clicking Refresh.

**Diagnosis:** KTC changed their HTML. The scraper looks for `var playersArray = [...]` in the response body.

**Fix:**
1. Visit https://keeptradecut.com/dynasty-rankings?format=2 directly
2. View source, search for `playersArray`
3. If the variable name or JSON shape changed, update the regex in the `fetchKTCData` function (search `playersArray` in index.html)
4. If KTC moved to a real JSON API, rewrite the fetch to hit that endpoint

Workaround while you fix it: the embedded `ktcData` object still provides values for ~200 top players.

### FantasyPros ranks missing

**Symptom:** FP column shows `-` for most players after Refresh.

**Diagnosis:** FantasyPros redesigned their ranking table.

**Fix:**
1. Visit https://www.fantasypros.com/nfl/rankings/dynasty-overall.php
2. View source, find the new table selector
3. Update the `fetchFPData` function (search `fpRankings` in index.html)

Workaround: embedded `fpData` object covers the top ~100 players.

### Data validation banner showed up

**Symptom:** Red banner at top of page saying "Data integrity check found N issues."

**Diagnosis:** You edited the embedded data objects and introduced a mismatch. Common causes:
- Wins don't match losses across the league (total wins must equal total losses)
- A player in one object isn't in another
- Missing season key in `allTimeData`

**Fix:**
1. Open DevTools console
2. Look for `validateData` warnings — they print specific issues
3. Fix the mismatch in `index.html`
4. Commit the fix

### GitHub Pages showing old version

**Diagnosis:** Browser or CDN cache.

**Fix:** Hard refresh (Cmd+Shift+R). If still stale after 5 minutes, visit https://github.com/nendy55555/DynastyFF/actions and check the Pages deployment ran successfully.

## Where things live

| Concern | Location |
|---------|----------|
| All site code | `index.html` (single file, ~7,800 lines) |
| Embedded historical data | Top of `<script>` block: `allTimeData`, `h2hData`, `streakData`, `draftData`, `recordsData`, `transactionData`, `ktcData`, `fpData`, `pickProjection2026`, `nameAliases`, `startup2023Ranks`, `championshipResults` |
| Config (league IDs, seasons, TTLs, proxy list) | `CONFIG` object near top of `<script>` |
| CSS | `<style>` block in `<head>` |
| Agent docs | `docs/agent/` |
| Tests | `tests/` |

## Glossary

- **KTC**: KeepTradeCut — dynasty ranking source. Each player has a value (1-10000 scale) and overall rank.
- **FP**: FantasyPros — rankings source.
- **SRI**: Subresource Integrity — hash-pinned CDN scripts so a compromised CDN can't silently ship malicious code.
- **Pick tier**: Early (picks 1-4), Mid (5-8), Late (9-12). Used in trade valuation.
- **Top-3 bump**: Extra 1.15x multiplier applied to future 1st-round picks from owners currently projected top-3.
- **Original owner**: The team who originally held a pick before any trades. Determines which tier the pick trades at.
