# Dynasty FF App: Analytics, Stats & Visualization Audit

## 1. Math Audit

### Verified Correct
Season-level aggregations check out. For all 12 owners, `total_wins`, `total_losses`, `total_fpts`, and `total_ppts` match the sum of their per-season values. Win percentages, manager efficiency calculations, and YoY change formulas all produce the expected output.

### Issues Found

**BUG: MrEton's Points Against is off by 1.00.**
`total_fpts_against` = 4277.48, but summing seasons produces 4278.48 (1566.12 + 1345.74 + 1366.62). This is a data entry error. Affects standings when sorted by PA.

**MINOR: shaqdeezy avg_score rounding.**
Displayed as 98.55, calculated as 98.53. Likely a rounding difference from the source platform. Cosmetic, but worth normalizing.

**BUG: H2H totals don't match allTimeData totals.**
Every owner's H2H win/loss sum exceeds their `total_wins`/`total_losses`. Example: nendy shows 30-12 in allTimeData but 34-15 in H2H. The H2H data includes playoff games; the season data does not. The tooltip says "Total regular season + playoff wins across all seasons," which is false for the season records. Either the tooltip is wrong or the data is incomplete.

| Owner | allTimeData W-L | H2H W-L | Extra Games |
|-------|----------------|---------|-------------|
| nendy | 30-12 | 34-15 | 7 |
| doyersbeast | 22-20 | 33-20 | 11 |
| DeezNutz02 | 24-18 | 28-20 | 6 |
| MrEton | 21-21 | 27-21 | 6 |

**doyersbeast has 11 extra games** from H2H, the most of any owner. This needs reconciliation.

**ANOMALY: grffnboss vs MrEton have only 2 H2H games across 3 seasons.** Every other pair has 3-6 games. Possible data gap.

---

## 2. Max PF Logic

### What "Max PF" Means in This App
Max PF here represents the maximum possible points a manager could have scored each week by setting the optimal lineup, summed across all weeks. It is pre-calculated and stored in the `total_ppts` field.

### Edge Cases NOT Applicable
The prompt asked about bracket collision scenarios (two teams owned by the same manager meeting each other). **This is a dynasty fantasy football league, not an NCAA bracket pool.** Each manager owns one team. The bracket collision logic, elimination risk, and "forfeit remaining games" scenarios from the prompt do not apply to this app's format.

### What IS Relevant
Max PF is calculated by the Sleeper platform and imported as static data. The app does not recalculate it. The formula is simple: sum of optimal weekly lineups across all weeks played.

### Verified
Max PF decreases across seasons for managers whose rosters have gotten worse (grffnboss: 1522 → 1497 → 1229). Max PF increases for managers adding talent (andrewmcorral: 1859 → 1858 → 2056). These trends match draft/trade activity visible in the data.

---

## 3. Chart Integrity Audit

### Chart 1: PF by Team (Mixed Bar + Line)
- **Type**: Bar (Total PF) with line overlay (Max PF). Appropriate for comparison.
- **Axes**: Y-axis starts at 0 (confirmed by Chart.js default with no `min` override). No truncation.
- **Labels**: No Y-axis title or units label. You have to rely on the legend to know the scale is "points."
- **Fix needed**: Add `title: { display: true, text: 'Points' }` to the Y-axis config.

### Chart 2: Manager Efficiency (Horizontal Bar)
- **Type**: Horizontal bar, sorted descending. Good choice.
- **Scale**: X-axis max hardcoded to 100. This compresses all bars into the 79-86% range, making differences hard to distinguish visually.
- **Fix needed**: Set `min: 75` or use a dynamic minimum like `Math.floor(Math.min(...effData)) - 2` to spread the bars meaningfully. Add a note that the axis doesn't start at 0.

### Chart 3: YoY Change (Vertical Bar)
- **Type**: Vertical bar with green (positive) and red (negative). Color coding is correct and intuitive.
- **Issue**: Owners on the X-axis are in object insertion order, not sorted by value. A user scanning left-to-right expects a ranking.
- **Fix needed**: Sort owners by change value before rendering.

### Chart 4: Max PF / Points Left on Table (Stacked Bar)
- **Type**: Stacked bar. Correct for part-to-whole comparison.
- **Colors**: Teal for actual, red for "left on table." Semantically correct.
- **Issue**: Sorted by total PF, which is fine, but the stacked total represents Max PF. The visual top of each bar shows Max PF, not actual PF. This could confuse users who think taller = more points scored. The legend explains it, but the chart title should clarify: "Max PF Breakdown: Actual vs. Bench Points."

### Chart 5: Contender/Rebuilder Scatter Plot
- **Type**: Scatter. Correct for two-variable correlation.
- **Axes**: X = All-time Max PF, Y = 2025 Win %. The X-axis measures career talent, while Y measures current season performance. This is a **conceptual mismatch**: a 3-year Max PF total doesn't represent current roster talent. A manager who tanked in 2023 but rebuilt will appear weaker than they are.
- **Fix needed**: Use 2025 Max PF only, or weight recent seasons more heavily.
- **Quadrant lines**: Midpoint is calculated as `(min + max) / 2`, which is arbitrary. A meaningful division would use the league median.

### Chart 6: Luck Factor (Horizontal Bar)
- **Type**: Horizontal bar, green for positive luck, red for negative. Appropriate.
- **Issue**: The luck formula `actualWinPct - expectedWinPct` where `expectedWinPct = ((12 - maxPfRank) / 11) * 100` assumes a linear relationship between Max PF rank and expected wins. The #1 Max PF team gets 100% expected win rate. This is unrealistic and produces dramatic negative "luck" for the best teams. nendy shows -28.6% luck despite being the winningest manager because no one can actually hit 100% win rate.
- **Fix needed**: Use a more realistic expected win model. For example, use historical league data to establish expected win rates by rank, or use a logistic curve.

### Chart 7: Team Profile Scoring Trend
- **CRITICAL BUG**: Lines 6679-6681 generate weekly scores using `Math.random()`:
  ```javascript
  pts.push(avgPerGame + (Math.random() - 0.5) * parseFloat(data.stdev) * 1.2);
  ```
  The chart refreshes with different data on every page load. This is fake data presented as a real scoring trend. Users cannot distinguish this from actual game-by-game scores.
- **Fix needed**: Either source real weekly scores or remove this chart. Showing fabricated data dressed as historical performance destroys trust.

### Chart 8: Season Scores (Overview Tab)
- Displays W-L records per season. Accurate to source data.

---

## 4. Misleading Visuals

**Manager Efficiency chart compresses meaningful differences.** The range spans 79.7% to 86.0%, but the X-axis runs 0-100. The 6.3 percentage point spread between best and worst manager looks like nothing. A user glancing at this chart concludes "everyone is about the same" when the actual spread is meaningful.

**Luck Factor chart punishes the best teams.** The formula guarantees the #1 Max PF team shows as "unlucky" unless they literally win 100% of their games. nendy (71.4% win rate, best in the league) appears as the unluckiest manager. This inverts the actual meaning of luck.

**YoY Change chart is unsorted.** Users interpret horizontal position as rank. An unsorted bar chart creates visual noise where a ranked waterfall chart would deliver instant insight.

**Contender scatter uses all-time Max PF on one axis and single-season win% on the other.** These operate on different time scales. A user might conclude a team with high all-time Max PF is a current contender, when their 2025 roster could be gutted from trades.

**No color blindness accommodation.** Green/red is the only semantic color pair used across multiple charts. Roughly 8% of men have red-green color vision deficiency. Blue/orange would be a safer default.

---

## 5. Standings Logic

### Sorting
Default sort: Win % descending. Users can click column headers to re-sort. The rank column updates dynamically based on current sort. This works correctly.

### Tiebreaker
**No tiebreaker is implemented.** When two owners share the same Win %, their relative order depends on JavaScript's `Array.sort` stability, which varies by engine. Four owners are tied at 57.1% (andrewmcorral, nsbarbarino, DeezNutz02, doyersbeast doesn't quite make it at 52.4%). Three owners are tied at 50.0% (MrEton, jakeschwartz, bradysballzfdf).

The code at line 3949-3953 does a single-key sort:
```javascript
const owners = Object.keys(allTimeData).sort((a, b) => {
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
});
```

No secondary sort key. Tied managers appear in arbitrary order.

**Fix needed**: Add tiebreaker cascade: Win% → Total PF → H2H record. Display the tiebreaker rule somewhere visible (footer note or info icon).

### Tooltip Accuracy
The Win % tooltip says "The primary ranking stat." This is accurate. The Wins tooltip says "Total regular season + playoff wins" but the data only includes regular season (14 games per season × 3 = 42 games max). This is incorrect documentation.

---

## 6. Trend & Projection Data

**The Team Profile scoring trend uses randomly generated data.** See Chart 7 above. This is the only forward-looking or trend-style visualization, and it fabricates its data points.

No other projections exist in the app. The power rankings feature shows preseason ranks vs. actual finish (a backward-looking comparison), which is accurate.

The YoY change calculation is correct and uses real data. No projection exceeds mathematical maximums.

---

## 7. Missing Insights: Proposals

### Recommended Additions (ranked by value)

**1. Schedule-Adjusted Luck Rating** (HIGHEST VALUE)
Formula: For each week, rank all 12 managers by actual score. Count how many opponents each manager would have beaten that week. Sum across all weeks = expected wins.
`Luck = Actual Wins - Expected Wins`
This replaces the broken Max PF-based luck formula with one grounded in actual weekly performance. A manager who scored 3rd most points in a week but lost (because they faced the #1 scorer) gets credit.

**2. Points Per Game Trend (replace fake chart)**
Replace the random-data trend chart with a real season-average line chart. Three data points (one per season) with the actual average PF per game. Simple, accurate, and useful.

**3. Strength of Schedule**
Formula: Average opponent PF across all games. Managers who faced higher-scoring opponents had a tougher schedule.
`SoS = total_fpts_against / total_games`
Already possible with existing data. Provides context for win/loss records.

**4. Comeback Probability Table**
For each manager, calculate: points needed to move up one standings position. Show current gap in W-L and PF to the next-ranked manager. Static table, no modeling needed.

**5. Bracket Efficiency (Draft ROI)**
Compare a manager's draft capital spent vs. points produced. Managers who turned late picks into starters show higher draft ROI than those who traded up for busts.

### Vote: Top Two for Implementation
1. **Schedule-Adjusted Luck** (replaces broken existing feature)
2. **Real scoring trend** (replaces fabricated data)

---

## 8. Real-Time Accuracy

The app has a live refresh feature (`refreshPlayerValues()` at line 5370) that fetches KTC dynasty values and FantasyPros rankings through a CORS proxy. This updates trade valuations, not game scores.

**Game scores are static.** All scoring data is pre-embedded in JavaScript objects. The app does not fetch live game data. No race conditions or stale-score risks exist because scores never update in real-time.

**Eliminated teams and Max PF**: Not applicable. Max PF is calculated per-week by the platform and imported as season totals. No real-time recalculation occurs.

**The refresh button updates trade grades only.** It re-fetches KTC values, which changes how trades are graded. The UI shows a loading state during the fetch. If the fetch fails, it falls back to embedded values. This behavior is correct.

---

## 9. Data Trust Signals

**Missing: "Last Updated" timestamp.** The app shows no indication of when the data was last refreshed. Users cannot tell if they're looking at Week 14 data or Week 1 data.

**Missing: Source attribution.** The data comes from Sleeper (for scoring) and KeepTradeCut (for player values), but no visible attribution exists.

**Missing: Live vs. Final distinction.** All data appears identical whether a season is in progress or complete. A visual indicator (badge or color) distinguishing "2025 In Progress" from "2023 Final" would prevent confusion.

**Present: The KTC refresh button shows status messages during fetch.** This is good practice.

**Recommendations:**
- Add a "Data as of: [date]" line in the header or footer
- Add source attribution: "Scoring data from Sleeper. Player values from KeepTradeCut."
- Mark in-progress seasons with a visual badge
- After KTC refresh completes, show the timestamp of the last successful refresh

---

## 10. Final Vote: Highest-Impact Change

### Votes

**Auditor 1**: Fix the fake scoring trend chart. Showing randomized data in a chart labeled as a player's scoring history is the single biggest trust violation in the app.

**Auditor 2**: Fix the Luck Factor formula. The current formula tells the best manager in the league they're unlucky. Schedule-adjusted luck gives actionable insight instead of misleading results.

**Auditor 3**: Add a "Last Updated" timestamp. Without it, every number on the page could be stale and the user has no way to know.

### Winner: Fix the Luck Factor formula AND the fake trend chart (tie between Auditors 1 and 2, both address fabricated/misleading data)

Priority implementation: Schedule-Adjusted Luck replaces the broken formula. Remove or label the fake trend chart. These two changes eliminate the app's two biggest trust violations.
