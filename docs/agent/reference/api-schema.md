# API schema

> This app has no server-side API. The only external call is the KTC value fetch, documented below.

---

## KTC value fetch (client-side)

Triggered when the user clicks "Refresh KTC Values" on the Rosters tab.

**Method:** GET via CORS proxy
**Purpose:** Fetch live player and pick values from KeepTradeCut
**Frequency:** On demand (user-initiated)

```javascript
// Pattern used in index.html
const CORS_PROXY = "https://corsproxy.io/?";
const KTC_URL = "https://keeptradecut.com/dynasty-rankings";

fetch(CORS_PROXY + encodeURIComponent(KTC_URL))
  .then(res => res.text())
  .then(html => {
    // Parse player values from returned HTML
    // Overlay onto rosterData for display
  });
```

**Response:** Raw HTML from KTC — player values are parsed out of the page markup, not a JSON API.

**Failure behavior:** If the CORS proxy is unavailable or KTC changes their markup, the refresh fails silently or shows an error state. Roster display falls back to static data. No retry logic.

**Pick value fetch:** Pick values come from the embedded `ktcPickValues` object in index.html, not from this fetch. The live fetch is for named players only.

---

## External resources (CDN)

These are loaded via `<script>` and `<link>` tags, not fetched programmatically:

| Resource | URL | Purpose |
|---|---|---|
| Chart.js 4.4.1 | `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js` | All chart rendering |
| Inter typeface | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800` | Typography |

If either CDN is unavailable, Chart.js charts fail to render (blank canvases) and the typeface falls back to system fonts. The rest of the app still functions.

---

## No internal API

There are no `fetch()` calls to any internal routes. There is no backend. All data is embedded in `index.html` as JavaScript objects.
