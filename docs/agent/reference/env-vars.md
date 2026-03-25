# Environment variables

> This project has no environment variables. It is a fully static site with no server-side code.

---

## Status

No `.env` file. No secrets. No server. Nothing to configure per environment.

The only "configuration" in the codebase is the CORS proxy URL hardcoded in the KTC fetch block inside `index.html`. It is not an env var — it is a string literal:

```javascript
const CORS_PROXY = "https://corsproxy.io/?";
```

If the CORS proxy needs to change (e.g. corsproxy.io goes down), edit that string directly in `index.html`.

---

## If you're adding a backend someday

If this project ever adds a server (e.g. to pull live Sleeper data), document all env vars here using this format:

| Variable | Type | Required | Description | Example |
|---|---|---|---|---|
| `SLEEPER_LEAGUE_ID` | string | yes | Sleeper league ID for API calls | `123456789` |

And update `DECISIONS.md` with the architectural decision to add a backend.
