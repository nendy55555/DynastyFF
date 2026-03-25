# Til Death do us Part

Dynasty fantasy football league dashboard for a 12-team Half-PPR Sleeper league, running since 2023.

**Live site:** [https://nendy55555.github.io/DynastyFF/](https://nendy55555.github.io/DynastyFF/)

## What's in here

All-time standings, head-to-head records, power rankings, rosters with KTC valuations, draft board grades, trade history with live trade grading, season recaps, analytics charts, and individual team profiles. One self-contained HTML file, no build step.

## Data sources

- **Scoring & rosters:** [Sleeper](https://sleeper.com)
- **Player values:** [KeepTradeCut](https://keeptradecut.com) (fetched live via refresh button)
- **Draft pick values:** KTC pick market, with 10% discount applied (picks tend to be overvalued)

## Stack

- Vanilla HTML/CSS/JS
- [Chart.js 4.4.1](https://www.chartjs.org/) for visualizations
- [Inter](https://rsms.me/inter/) typeface
- GitHub Pages for hosting

## Local development

Open `index.html` in a browser. No server required. KTC refresh uses a CORS proxy, so that feature needs an internet connection.

## Updating data

Season stats, rosters, and trade history are embedded as JavaScript objects inside `index.html`. To update after a week of games:

1. Pull updated stats from Sleeper
2. Edit the `allTimeData`, `rosterData`, and `transactionData` objects
3. Push the updated `index.html` to this repo

## League settings

12 teams, 1QB, Half-PPR, dynasty format with taxi squads. Full scoring and roster settings are on the League Rules tab of the site.
