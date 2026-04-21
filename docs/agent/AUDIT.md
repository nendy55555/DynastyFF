# Dynasty FF — Hardening Audit

**Audit date:** 2026-04-20
**Target:** `index.html` (~7,800 lines, vanilla HTML/CSS/JS, single file)
**Deploy target:** GitHub Pages at https://nendy55555.github.io/DynastyFF/

## 1. Inputs → Transformations → Outputs

### Inputs
| Source | Type | Endpoint | Frequency | Failure mode |
|--------|------|----------|-----------|--------------|
| Sleeper user/leagues | JSON API | `https://api.sleeper.app/v1/user/{username}` then `.../leagues/nfl/{year}` | On page load, on season change | Official API, rare outages |
| Sleeper league rosters/users | JSON API | `.../league/{id}/rosters`, `.../league/{id}/users` | On page load | Official API |
| Sleeper weekly matchups | JSON API | `.../league/{id}/matchups/{week}` | On page load (weeks 1-17) | Official API |
| Sleeper players catalog | JSON API | `.../players/nfl` | On page load (cached via `sleeperPlayersCache`) | Very large response (~2MB) |
| KTC dynasty rankings | **HTML scrape** | `https://keeptradecut.com/dynasty-rankings?format=2` via CORS proxy | On manual "Refresh Values" button | **HIGH RISK** — parses `var playersArray = [...]` regex from HTML. Breaks if KTC changes markup. |
| KTC K/DST rankings | HTML scrape | `/pk-rankings`, `/dst-rankings` via CORS proxy | On refresh | Same as above |
| FantasyPros rankings | HTML scrape | `/rankings/dynasty-overall.php`, etc. via CORS proxy | On refresh | **HIGH RISK** — parses DOM table rows. Breaks on any FP table redesign. |
| Embedded data | Literal JS objects | `allTimeData`, `h2hData`, `streakData`, `draftData`, `recordsData`, `transactionData`, `ktcData`, `fpData`, `pickProjection2026`, `nameAliases`, `startup2023Ranks`, `championshipResults` | Weekly manual update during season | Manual edit risk; no schema enforcement beyond startup validation IIFE |
| Chart.js | CDN script | `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js` | Page load | **MED RISK** — no SRI integrity hash. CDN compromise or CDN outage breaks all charts. |
| Inter font | Google Fonts CSS | `https://fonts.googleapis.com/css2?family=Inter:...` | Page load | Falls back to system font; acceptable degradation |

### Transformations (pure logic — testable targets)
| Function | Input | Output | Complexity | Reachable silently-broken surface |
|----------|-------|--------|------------|------------------------------------|
| `normalizeName(name)` | string | string | Trivial lookup | nameAliases drift |
| `getAssetKTC(asset, originalOwner)` | asset string, owner | KTC value (number) | Parses "2026 R1" / "2024 1.12" / player name; applies tier + year discount + top-3 bump | Regex + tier mapping + pickProjection2026 coupling |
| `gradeTrade(sides, timestamp)` | `{team: {got: [], gave: []}}`, ts | `{team: {gotVal, gaveVal, rawAdjGot, rawAdjGave, diff, pctDiff, grade, gradeColor}}` | Trade grading with tier-aware valuation via `buildPickOwnershipMap` | Algorithm depends on trade history, pick projections, KTC values being non-empty |
| `buildPickOwnershipMap(upToTs)` | timestamp | Map of `"YYYY_R" → {ownerName: [originalOwners]}` | Walks trades chronologically, transfers ownership | Correctness depends on trade ordering and 2-team-trade invariant |
| `resolvePickOriginalOwner(map, holder, year, round)` | map, strings | string (owner) or null | Lookup | Simple |
| `calculateGradeStartup(player, pickNum, total)` | strings, numbers | letter grade 'A+'...'F' | KTC rank vs expected rank ratio | startup2023Ranks coverage; ratio thresholds |
| `calculateGradeKTC(player, pickNum, total, pos, type)` | args | letter grade | Same ratio approach with round/TE penalties | Threshold tuning |
| `validateData` IIFE | — | console.warn | Owner count, season presence, wins/fpts types, aggregate match | Runs once; no UI signal |

### Outputs
- Rendered HTML in DOM: standings, H2H grid, records, streaks, power rankings, trade cards with grades, draft board tiles with grades, rosters with KTC values, charts (season scores, PF by team, manager efficiency, YoY change, max PF, luck), team profile modals, championship run modals, season recaps.
- Hash-route deep links: `#profile-{owner}`, `#{tab-name}`.
- Console warnings on data validation failures.

## 2. Claude API call sites
**None.** Zero Claude API calls in the codebase. Grep for `anthropic|claude\.ai|api\.anthropic` returns empty.

**Classification for this project:** the "Opus→Sonnet→Haiku downgrade" and "replaceable with heuristics" workstreams are N/A. Replace that axis with: **reduce silent-break surface from external HTML scraping and unpinned CDN dependencies.**

## 3. Dead code / unused features
Scanned 65 top-level functions. None are obviously orphaned — every function is called from either a DOM event, a `safeInit` boot block (line 6784+), or another function. A deeper pruning pass would need runtime coverage data; not worth the risk of breaking subtle entry points for marginal size gains on a 498KB file.

**Exception — dead branches:**
- `getGrade(score, pickNum, totalPicks, isRookie)` at line 6418 is a no-op — both branches return `score` unchanged. It's still referenced nowhere active. **Decision: remove.** Logged in DECISIONS.md.

## 4. Unpinned / loosely-pinned dependencies
| Dep | Current | Risk | Fix |
|-----|---------|------|-----|
| Chart.js 4.4.1 via cdnjs | Pinned version, no SRI | CDN tamper / corruption not detected | Add `integrity` + `crossorigin` to script tag |
| Google Fonts Inter | Versionless CSS | Minor — font swap, not functional break | Leave; document fallback in CSS |
| `corsproxy.io` | Single point of failure | **HIGH** — if this proxy ever shuts down, the Refresh button breaks silently | Add fallback list: `corsproxy.io`, `api.allorigins.win`, `thingproxy.freeboard.io`. Try each until one works. |

## 5. Implicit assumptions that could silently break
1. **KTC HTML structure** — the page embeds `var playersArray = [...]`. If KTC changes to JSON API or renames the var, the regex returns no match. The code handles this via `else { status.textContent = 'KTC: Could not parse data' }` but the fallback is just showing the stale embedded `ktcData` object — no alert, no telemetry.
2. **FantasyPros table selectors** — `table.table tbody tr, #ranking-table tbody tr`. Any FP redesign breaks parsing silently; `updated=0` would be returned with no user-visible error.
3. **Sleeper league year detection** — fetches leagues for `CONFIG.CURRENT_SEASON`. If the season flips before `CONFIG.CURRENT_SEASON` is bumped, the site shows last year's data with no warning.
4. **`pickProjection2026`** — hardcoded 2026 in the name. When the 2026 rookie draft happens and the current season rolls to 2026, this data structure becomes stale for trade valuation of 2027+ picks. No automatic mechanism.
5. **Trade timestamps are ms epoch** — `buildPickOwnershipMap` compares `trade[2] >= upToTimestamp`. If any trade has a bad timestamp (string, null, missing), the comparison may silently include or exclude it.
6. **Startup2023Ranks** coverage — any player drafted in 2023 startup not in the hardcoded map gets fallback grading from pick %. No warning when this fallback hits.
7. **CORS proxy latency/rate limits** — `corsproxy.io` has no documented SLA for free tier. Could start rate-limiting at any time.
8. **GitHub Pages base path** — site assumes it's served from `/DynastyFF/`. Anchor links and hash routes encode this implicitly.
9. **`fetch` without AbortController** — a slow Sleeper response hangs UI state forever.
10. **No error surfacing to the user** — except the refresh button status text, users never see when data is stale or broken.

## 6. Silent-break risk summary (ordered)
1. **KTC scraping** — HTML schema change → silent stale data. Mitigation: cache with freshness timestamp + user-visible staleness warning.
2. **FantasyPros scraping** — same. Mitigation: same + explicit user notification when `updated=0`.
3. **CORS proxy outage** — Refresh button appears to work, silently fails. Mitigation: proxy fallback list + visible error.
4. **Chart.js CDN tamper** — extremely unlikely but catastrophic. Mitigation: SRI hash.
5. **Sleeper schema evolution** — Sleeper is more stable (real API with versioning) but not infinite. Mitigation: defensive parsing + clear console errors.
6. **Data integrity drift after manual weekly updates** — validation IIFE logs to console only. Mitigation: surface errors in a visible banner when errors exist.

## 7. Dependencies pinning plan
- Chart.js: pin to `4.4.1` with SRI hash `sha512-...` (to be computed from cdnjs SRI endpoint)
- Google Fonts: leave as-is (minor risk, mitigated by `font-family` fallback to system-ui)
- Cache KTC/FP responses to localStorage with 24h TTL, staleness indicator in UI

## 8. Testable surface
The following pure functions are high-value to fence with fixtures:
- `normalizeName` (trivial)
- `getAssetKTC` (regex + tier logic)
- `gradeTrade` / `rawAdj` (scoring algorithm — high behavior-depth-per-LOC)
- `calculateGradeStartup`, `calculateGradeKTC` (threshold-based grading)
- `buildPickOwnershipMap` + `resolvePickOriginalOwner` (stateful walk)
- `validateData` (IIFE — testable by extracting into a named function)

Testing strategy: see RUNBOOK. Use a Node extractor that reads `index.html`, pulls the code block between `// === TESTABLE-LOGIC-START ===` and `// === TESTABLE-LOGIC-END ===` sentinels, wraps it as a module, runs under `node --test`. No build step needed at site runtime.

## 9. Recommendations (ordered by value)
1. Add Chart.js SRI hash (5 min, eliminates class of supply-chain risk)
2. Add CORS proxy fallback list (20 min, eliminates single point of failure)
3. Cache KTC/FP to localStorage with staleness indicator (1 hr, gives offline-ish mode)
4. Add user-visible data validation banner when validateData finds errors (15 min)
5. Remove `getGrade` dead function (2 min)
6. Add module-boundary markers around testable logic (5 min)
7. Write Node test harness + fixture suite (2 hr)
8. Write RUNBOOK (45 min)
