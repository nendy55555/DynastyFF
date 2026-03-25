# Debugging guide

> Read this before touching any code when diagnosing an issue.
> The goal: form a hypothesis in one pass, not through trial and error.

---

## Step 1 — Gather before guessing

This is a static file. There are no server logs. All debugging happens in the browser.

```
1. Open index.html in a browser
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab — read the full error message including file + line number
4. Go to Network tab if the issue involves KTC values loading
5. Run: git log --oneline -10  (what changed recently?)
6. Run: git diff HEAD~1 --stat  (which parts of index.html changed?)
```

**For chart issues specifically:**
- Open Console — Chart.js logs detailed errors when data is malformed
- Check that the canvas element is visible before the chart initializes (charts fail silently when canvas is hidden)

---

## Step 2 — Map the error to a layer

| Error type | Where to look first |
|---|---|
| `Cannot read properties of undefined` | The data object that feeds the broken render function — check field names against `reference/data-models.md` |
| Chart not rendering / blank canvas | Console for Chart.js errors; confirm tab is active before chart init |
| Wrong number displayed | The data object first (is the raw value wrong?), then the calculation function |
| UI layout broken | CSS variables section at top of file; check if a class was renamed |
| KTC values not loading | Network tab — look for the CORS proxy fetch request and its response |
| Feature works locally, broken on GitHub Pages | File path casing, or a CDN resource that requires HTTPS |
| Tab not showing | Check the `data-tab` attribute matches the panel `id` exactly |

---

## Step 3 — Known failure patterns

> These are bugs that have actually occurred in this project. Add a new block every time a non-trivial bug is fixed.

---

### Pattern: Team Profile Scoring Trend uses random data
**Symptom:** The scoring trend line in team profile modals shows different values on every page reload
**Root cause:** Lines ~6679–6681 generate weekly scores using `Math.random()` instead of real data
**Fix:** Either source real weekly scores per owner per season, or remove the chart entirely
**Check first:** Search for `Math.random()` in index.html to locate the exact lines
**Status:** Known bug — not yet fixed as of 2026-03-25

---

### Pattern: Manager Efficiency chart compresses all bars
**Symptom:** The Manager Efficiency horizontal bar chart (Trends tab) looks like all managers are identical — bars span nearly the full width
**Root cause:** X-axis max is hardcoded to 100. The actual range is ~79%–86%, so all bars cluster in the right 7% of the chart
**Fix:** Set `min: 75` on the X-axis, or use `Math.floor(Math.min(...effData)) - 2` dynamically
**Check first:** Find the Manager Efficiency Chart.js config in the `trends` tab render block

---

### Pattern: YoY Change chart unsorted
**Symptom:** The Year-over-Year Change bar chart (Trends tab) shows owners in insertion order instead of ranked by change value
**Root cause:** Data is not sorted before being passed to Chart.js
**Fix:** Sort owners by change value (descending) before building the chart dataset
**Check first:** Find the YoY chart initialization and look for the sort step (it doesn't exist yet)

---

### Pattern: Luck Factor punishes the best teams
**Symptom:** nendy (best win record in the league) shows as the "unluckiest" team in the Analytics tab
**Root cause:** Luck formula is `actualWinPct - expectedWinPct` where expected = `((12 - maxPfRank) / 11) * 100`. The #1 Max PF team gets 100% expected, which no one can actually achieve.
**Fix:** Replace with schedule-adjusted luck: for each week, count how many opponents a manager would have beaten. Sum = expected wins. Luck = actual wins - expected wins.
**Check first:** Search for `luck` or `Luck Factor` in the analytics chart initialization block

---

### Pattern: Standings sort has no tiebreaker
**Symptom:** Tied teams appear in arbitrary order when sorting by Win %
**Root cause:** `populateStandings` uses a single-key sort with no secondary sort
**Fix:** Add tiebreaker cascade: Win% → Total PF → H2H record
**Check first:** `populateStandings()` function — look at the `.sort()` comparator

---

### Pattern: H2H totals exceed allTimeData totals
**Symptom:** An owner's total wins in H2H sum exceeds their `allTimeData.total_wins`
**Root cause:** `h2hData` includes playoff games; `allTimeData` season records include only regular season games. The tooltip on the standings page incorrectly claims "Total regular season + playoff wins."
**Fix:** Either (a) add playoff games to allTimeData totals, or (b) fix the tooltip copy to say "Regular season wins only"
**Check first:** Compare `h2hData[owner]` win sums vs `allTimeData[owner].total_wins`

---

### Pattern: MrEton's Points Against off by 1.00
**Symptom:** MrEton's `total_fpts_against` in `allTimeData` is 4277.48, but summing his seasons produces 4278.48
**Root cause:** Data entry error — one of the three season values is 1.00 too low
**Fix:** Audit `allTimeData["MrEton"].seasons` values and correct the entry with the error
**Check first:** Sum `allTimeData["MrEton"].seasons[2023].fpts_against + .seasons[2024].fpts_against + .seasons[2025].fpts_against`

---

### Pattern: Contender scatter uses mismatched time scales
**Symptom:** Analytics scatter plot X-axis is all-time Max PF, Y-axis is 2025 win %. Teams that gutted their roster appear as strong contenders due to historic Max PF.
**Root cause:** Conceptual mismatch in chart design — career total vs single-season performance
**Fix:** Use 2025 Max PF only on the X-axis (or use a weighted recent-season average)
**Check first:** Find the scatter plot data building block — look for where `maxPf` is calculated

---

## Step 4 — Confirm before fixing

Before writing any code, state:
1. The specific line number where the bug lives (search for a nearby unique string in index.html)
2. Why this is the root cause, not just where the symptom shows
3. What the fix changes
4. How you'll verify it works (visual check in browser)

---

## What not to do when debugging

- Do not read all 7700 lines looking for clues — use Grep with a specific search term
- Do not make multiple changes at once — one hypothesis, one fix, one check
- Do not assume the bug is in the last thing edited — check the browser console error first
