# React gameplay conversion — Edgar branch

This archive contains **new or replacement files only**. No GitHub changes were made.

## Copy files

Copy `client/src/GameApp.jsx` into the same path in your repository, replacing the old component.
Copy all four `.jsx` files from `client/src/components/` into a new `client/src/components/` folder.
| Part | Status | Where |
|---|---|---|
| Login: Auth0 username + password | ✅ done (needs Auth0 setup) | `client/src/auth/`, `server/src/auth/` |
| Database: users + saved questions (Tiger Data PostgreSQL) | ✅ done (needs `DATABASE_URL`) | `server/src/db/` |
| Gemini: notes → questions | ✅ done (needs `GEMINI_API_KEY`) | `server/src/gemini/` |
| Notes → Gemini → database | ✅ done | `server/src/services/studyPacks.js`, `POST /api/notes` |
| Game (scenes, robot, UI) | ⬜ team | `client/src/game/` |
| Art & audio | ⬜ team | `client/public/assets/` |
| Hosting (Vultr + .study domain) | ⬜ later | `deploy/` |

Keep these existing files unchanged:
- `client/src/main.js`
- `client/index.html`
- `client/src/game/story.js`
- `client/src/game/stats.js`
- `client/src/game/questionProvider.js`
- `client/src/game/game.css`
- `client/vite.config.js`
- backend, auth and database files

After testing the new React version, `client/src/game/game.js` (the old DOM-based engine) is unused and can be deleted. Don't delete it until you've confirmed the new game works.

## Run

From the repository root:

```bash
npm run dev -w client
```

Open the Vite local URL. Add `?debug` to see survival stats.
You also need the team's keys in `.env` (ask a teammate privately): `DATABASE_URL` (Tiger Data),
the Auth0 values, and `GEMINI_API_KEY`.

```bash
git clone https://github.com/otravieso/swamphack-squirtles.git
cd swamphack-squirtles
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev
```

Open **http://localhost:5173** for a small test page: sign up, log in, paste notes or upload a PDF → generate questions with Gemini, and list saved sets.

The server won't start without `DATABASE_URL`. The tables are created once with `node server/setup-db.js`
(already done for the shared database; see `server/src/db/README.md`).
Without Auth0 values, everything is saved under a "guest" user. Auth0 setup: **`server/src/auth/README.md`**.

`npm test` runs the tests. The database tests use a separate `test` schema in Tiger Data, never real game data.

## Test

1. Advance dialogue, including skipping the typing animation.
2. Answer a question correctly and incorrectly on separate playthroughs.
3. Make a water choice, descend to the stairwell, and select cafeteria food.
4. Reach the chapter completion screen, then restart.
5. Try bad choices and wrong answers to verify death/restart.
6. Test with `?debug` to verify hunger/thirst decay every two questions.

The story has four question nodes. The sample question provider has five unique questions; expanding the story beyond five question nodes requires additional questions or Gemini integration.
```
client/                Browser side (what the player sees)
  src/game/            Game code: scenes, robot teacher, dialogue, question UI
  src/api/api.js       Calls to our server (attaches the login token)
  src/auth/auth.js     Auth0 login / sign-up / logout
  public/assets/       Sprites, tilesets, sounds
  index.html, src/main.js   Temporary test page (replace with the game)
server/                Backend (holds the secret keys)
  src/routes/          API endpoints (see its README)
  src/auth/            Auth0 token check + setup guide
  src/db/              Tiger Data PostgreSQL: users, question_sets, questions
  src/gemini/          Gemini API: notes → questions
  src/services/        Glue: notes → Gemini → database
  test/                Tests (database + notes→Gemini glue)
deploy/                Hosting (Vultr + .study domain), later
```

## Integration

`GameApp` accepts optional `script` and `hooks` props. `hooks` supports `onAnswer`, `onChoice`, `onDeath`, and `onEnd`.
The question provider still uses `getQuestion({difficulty, seen})` and `setQuestionProvider(...)`.
```
game → client/src/api ──(login token)──→ server/src/routes → server/src/auth (who is this?)
                                                          → server/src/db   (save / load questions)
                                                          → server/src/gemini (generate questions)
```

## Important

Vite stays in the project as the development/build tool. React now renders and manages the entire gameplay UI. The code has not been browser-tested against your machine, so check the browser console if an error appears.
