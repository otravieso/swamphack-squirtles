# server/

The backend. It holds all secret keys (Gemini, Auth0) so they never reach the browser.

| Folder | What goes here |
|---|---|
| `src/routes/` | API endpoints the client calls (e.g. `POST /api/notes`) |
| `src/gemini/` | Gemini API calls: read uploaded notes and generate questions |
| `src/auth/` | Checking Auth0 login tokens on incoming requests |
