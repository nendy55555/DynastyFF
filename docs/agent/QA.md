# QA and testing

> There is no automated test suite. All QA is manual browser testing.

---

## How to test

```bash
# Open index.html in a browser — no server, no build required
open index.html        # macOS
# or: double-click index.html in Finder / Explorer
```

**After any change:**
1. Hard-refresh the browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Open DevTools Console — confirm zero JS errors
3. Click through every tab you modified
4. If you changed data objects, spot-check calculated values against source

---

## Tab-by-tab smoke test checklist

Run this after any significant change:

| Tab | What to verify |
|---|---|
| Overview | Champion rings display; Season Scores chart renders; hero stats show correct values |
| Rosters | Each team's roster cards load; KTC refresh button works (fetches values) |
| Standings | Table renders all 12 owners; sort by each column works; season filter (All / 2023 / 2024 / 2025) works |
| Season Recaps | 2023, 2024, 2025 recap tabs each show content |
| Records | Single-season and single-game records show; win/loss streak lists render |
| Head-to-Head | H2H matrix grid renders; clicking an owner shows their detail view |
| Playoffs | All three brackets (2023, 2024, 2025) render correctly |
| Power Rankings | Year selector works; rank cards show for selected year |
| Draft Board | Sub-tab switching works; draft grids render for all three drafts |
| Trades | Trade list renders; team filter and season filter work |
| Trends | All 4 charts render (PF by Team, Manager Efficiency, YoY Change, Max PF) |
| Analytics | Scatter plot and Luck Factor chart render |
| Draft Capital | Pick holdings per team display |
| League Rules | Content renders (static text) |

---

## What to check when updating data

When you update a data object (e.g. adding a new season's results):

1. **Field names match exactly** — check `reference/data-models.md` before editing
2. **Math checks out** — total_wins + total_losses should equal sum of season wins + losses
3. **H2H stays consistent** — if you add regular season games, add them to `h2hData` too
4. **Standings recalculate correctly** — sort by Win %, PF, and PA and confirm rankings look right
5. **Streak data updated** — if streaks changed, update `streakData`

---

## Known issues (not regressions — pre-existing bugs)

These exist in the codebase. If you see them during testing, they are not caused by your change:

| Issue | Tab | Severity |
|---|---|---|
| Team Profile scoring trend shows different data every page load | Team Profile modal | High — fabricated data |
| Manager Efficiency chart bars look identical | Trends | Medium — display compression |
| YoY Change chart unsorted | Trends | Low |
| Luck Factor shows best teams as unluckiest | Analytics | Medium — formula flaw |
| Standings tied teams sort arbitrarily | Standings | Low |
| MrEton PA off by 1.00 | Standings / Analytics | Low — data entry error |

Full details on all of these in `docs/agent/DEBUG.md`.

---

## Testing a specific bug fix

1. Reproduce the bug in the browser before applying the fix — confirm you can see it
2. Apply the fix
3. Hard-refresh
4. Confirm the specific symptom is gone
5. Run the full smoke test for the tab(s) you touched
6. Check browser console for zero errors

---

## CI behavior

None. There is no CI pipeline. GitHub Pages deploys automatically on push to `main` with no test gate. This makes the pre-push local check critical.
