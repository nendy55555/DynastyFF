# Data models

> Read this when working with data objects, updating season data, or when a field name is unclear.
> All data is embedded as JS object literals inside index.html. No database. No ORM.

---

## Owner keys

All data objects are keyed by owner username (from Sleeper). The canonical owner keys are:

```
nendy, jakeschwartz, JustinG66, SweetSweet, grffnboss, shaqdeezy,
DeezNutz02, MrEton, nsbarbarino, andrewmcorral, doyersbeast, bradysballzfdf
```

These keys must match exactly (case-sensitive) across every data object.

---

## `allTimeData`

Primary standings and stats object. Keyed by owner key.

```javascript
allTimeData = {
  "[ownerKey]": {
    name: string,          // Display name (e.g. "Thomas N.")
    team: string,          // Team name (e.g. "Nendy's Team")
    total_wins: number,    // Regular season wins across all seasons
    total_losses: number,  // Regular season losses across all seasons
    total_fpts: number,    // Total fantasy points scored
    total_ppts: number,    // Total max possible points (from Sleeper)
    total_fpts_against: number,  // Total points scored against
    seasons: {
      "[year]": {          // e.g. "2023", "2024", "2025"
        wins: number,
        losses: number,
        fpts: number,
        ppts: number,
        fpts_against: number,
        playoff: boolean,         // made the playoffs?
        champion: boolean,        // won the championship?
        playoff_seed: number | null,
        final_rank: number        // 1 = champion, 12 = last place
      }
    }
  }
}
```

**Derived fields** (calculated at render time, not stored):
- `win_pct` = total_wins / (total_wins + total_losses) * 100
- `mgr_eff` = total_fpts / total_ppts * 100
- `avg_score` = total_fpts / (total_wins + total_losses)

---

## `h2hData`

Head-to-head records between every pair of owners. Includes regular season AND playoff games.

```javascript
h2hData = {
  "[ownerA]": {
    "[ownerB]": {
      wins: number,    // ownerA's wins vs ownerB
      losses: number,  // ownerA's losses vs ownerB
      // Note: games = wins + losses, but not always stored explicitly
    }
  }
}
```

**Important:** `h2hData` includes playoff matchups. `allTimeData.total_wins` includes regular season only. These totals do not match — this is a known documented inconsistency.

---

## `streakData`

Longest win and loss streaks per owner.

```javascript
streakData = {
  "[ownerKey]": {
    longestWin: number,
    longestLoss: number
  }
}
```

---

## `transactionData`

All trades in league history. Keyed by a string date (format: `"YYYY-MM-DD"`). Multiple trades on the same date use different keys.

```javascript
transactionData = {
  "[date-key]": {
    date: string,          // Display date (e.g. "Jan 15, 2024")
    season: number,        // Season year (e.g. 2024)
    teams: [ownerKey, ownerKey],   // Two owners in the trade
    assets: {
      "[ownerKey]": string[],   // Assets this owner RECEIVED
      "[ownerKey]": string[]    // Assets this owner RECEIVED
    },
    notes: string | null   // Optional trade context
  }
}
```

Assets are strings like `"Justin Jefferson"`, `"2025 R1"`, `"2026 1.04"`.

---

## `draftData`

Draft board grades per draft.

```javascript
draftData = {
  "startup2023": {
    picks: [
      {
        pick: number,         // Overall pick number
        owner: string,        // ownerKey
        player: string,       // Player name
        grade: string,        // Letter grade ("A", "B+", "C", etc.)
        notes: string | null
      }
    ],
    grades: {
      "[ownerKey]": {
        grade: string,        // Overall draft grade
        gpa: number           // GPA equivalent
      }
    }
  },
  "rookie2024": { /* same shape */ },
  "rookie2025": { /* same shape */ }
}
```

---

## `recordsData`

Single-game and single-season scoring records.

```javascript
recordsData = {
  highScore: { owner: string, score: number, week: string, season: number },
  lowScore:  { owner: string, score: number, week: string, season: number },
  highSeasonPF: { owner: string, score: number, season: number },
  lowSeasonPF:  { owner: string, score: number, season: number },
  highSeasonPA: { owner: string, score: number, season: number },
  // ... additional record types
}
```

---

## `powerRankingsData`

Historical power rankings by season.

```javascript
powerRankingsData = {
  "[year]": {
    "[ownerKey]": {
      preseasonRank: number,
      finalRank: number,
      change: number   // preseasonRank - finalRank (positive = outperformed)
    }
  }
}
```

---

## `ktcPickValues`

KTC market values for draft picks. Populated from CORS proxy fetch. Keyed by tier + round.

```javascript
ktcPickValues = {
  "Early 1st": { "[year]": number },   // e.g. { "2025": 8500, "2026": 7200 }
  "Mid 1st":   { "[year]": number },
  "Late 1st":  { "[year]": number },
  "Early 2nd": { "[year]": number },
  "Mid 2nd":   { "[year]": number },
  "Late 2nd":  { "[year]": number },
  // ... other rounds
}
```

Tier boundaries: slot 1–4 = Early, 5–8 = Mid, 9–12 = Late.

---

## `draftCapitalData`

Current future pick holdings per owner.

```javascript
draftCapitalData = {
  "[ownerKey]": {
    picks: string[],    // e.g. ["2025 R1", "2026 R2", "2026 1.04"]
    ktcTotal: number | null   // null until KTC values are fetched
  }
}
```

---

## `colors`

Chart color mapping per owner.

```javascript
colors = {
  "[ownerKey]": string   // CSS color string (e.g. "#00d4aa", "rgba(255,215,0,0.8)")
}
```

---

## Data integrity rules

- Owner keys are case-sensitive and must match exactly across all objects
- `allTimeData` season totals = sum of individual season values (except the MrEton PA bug)
- `h2hData` is not symmetric — `h2hData[A][B].wins` = `h2hData[B][A].losses`
- Never fabricate stats — all values must come from Sleeper or KTC
