# server/

The backend. It holds all secret keys (Gemini, Auth0) so they never reach the browser.

| Folder | What goes here |
|---|---|
| `src/routes/` | API endpoints the client calls |
| `src/auth/` | Auth0 token check (+ the Auth0 setup guide) |
| `src/db/` | SQLite database: users, question sets, questions |
| `src/gemini/` | Gemini API calls: read uploaded notes and generate questions |
| `test/` | Tests (`npm test`) |
