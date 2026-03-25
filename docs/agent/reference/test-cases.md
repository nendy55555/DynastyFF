# Test cases

> Manual test cases for this project. No automated test suite exists.
> Run these when verifying a fix or before pushing a significant change.

---

## Standings

| Case | Steps | Expected result |
|---|---|---|
| Default load | Open site, click Standings | Table shows 12 owners sorted by Win % descending |
| Sort by PF | Click "PF" column header | Table re-sorts by Points For descending; rank column updates |
| Sort ascending | Click same column twice | Sort flips to ascending |
| Season filter | Click "2024" season button | Table shows only 2024 stats for all owners |
| Return to all-time | Click "All Time" after season filter | Table returns to career totals |
| Tied owners | Sort by Win % | Tied owners at 57.1% appear (order may be arbitrary — see DEBUG.md) |

---

## Head-to-Head

| Case | Steps | Expected result |
|---|---|---|
| Matrix load | Click H2H tab | Grid renders with all 12 owners on each axis |
| Detail drill-down | Click an owner name | Detail view shows their record vs every other owner |
| Win/loss consistency | Compare A vs B wins to B vs A losses | They should match exactly |

---

## Trades

| Case | Steps | Expected result |
|---|---|---|
| Full list | Click Trades tab | All trades render with date, teams, and assets |
| Team filter | Select a specific team | Only trades involving that team show |
| Season filter | Select 2024 | Only 2024 trades show |
| KTC grade display | Look at a trade card | Both sides show KTC value total and grade (if KTC loaded) |

---

## Charts (Trends tab)

| Case | Steps | Expected result |
|---|---|---|
| PF by Team | Click Trends tab | Bar + line chart renders with all 12 owners |
| Manager Efficiency | Same tab | Horizontal bar chart renders (note: bars will look compressed — known issue) |
| YoY Change | Same tab | Vertical bar chart renders with green/red bars |
| Max PF | Same tab | Stacked bar chart renders |
| Console check | Open DevTools Console while on Trends | Zero Chart.js errors |

---

## Team Profile modal

| Case | Steps | Expected result |
|---|---|---|
| Open profile | Click any owner name in Standings | Modal opens with that owner's career stats |
| Scoring trend | Look at the trend chart in modal | Chart renders — BUT values change on every reload (known Math.random bug) |
| Close modal | Click X or outside modal | Modal closes; standings table still renders correctly |

---

## KTC refresh

| Case | Steps | Expected result |
|---|---|---|
| Refresh values | Go to Rosters tab; click "Refresh KTC" | Values update on player cards |
| Offline failure | Test with network disabled | Button fails gracefully; static roster data still displays |

---

## Data integrity spot-checks

Run these when allTimeData is updated:

```
1. Sum allTimeData["nendy"].seasons["2023"].wins
   + allTimeData["nendy"].seasons["2024"].wins
   + allTimeData["nendy"].seasons["2025"].wins
   Should equal allTimeData["nendy"].total_wins

2. allTimeData["MrEton"].total_fpts_against
   Should equal sum of seasons fpts_against (currently off by 1.00 — known bug)

3. For any two owners A and B:
   h2hData[A][B].wins should equal h2hData[B][A].losses
```
