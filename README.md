# SwampHack Squirtles 🐢

An AI-powered psychological study adventure. Students upload their notes, a cute robot
teacher turns them into lessons… and slowly stops wanting them to leave.
Built for **SwampHacks**.

## Status

| Part | Status | Where |
|---|---|---|
| Login: Auth0 username + password | ✅ done (needs Auth0 setup) | `client/src/auth/`, `server/src/auth/` |
| Database: users + saved questions (Tiger Data PostgreSQL) | ✅ done (needs `DATABASE_URL`) | `server/src/db/` |
| Gemini: notes / PDFs → questions | ✅ done (needs `GEMINI_API_KEY`) | `server/src/gemini/` |
| Notes → Gemini → database | ✅ done | `server/src/services/studyPacks.js`, `POST /api/notes` |
| Game (React visual novel: robot, dialogue, choices, survival stats) | ✅ playable demo | `client/src/GameApp.jsx`, `client/src/game/` |
| App screens: login, upload notes/PDF, saved sets → game | ✅ done | `client/src/App.jsx`, `client/src/components/` |
| Art & audio | ⬜ team | `client/public/assets/` |
| Hosting (Vultr + .study domain) | ⬜ later | `deploy/` |

## Getting started

Requires **Node.js 22.13 or newer** (check with `node -v`; get the LTS from nodejs.org).

You also need the team's keys in `.env` (ask a teammate privately): `DATABASE_URL` (Tiger Data),
the Auth0 values, and `GEMINI_API_KEY`.

```bash
git clone https://github.com/otravieso/swamphack-squirtles.git
cd swamphack-squirtles
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev
```

Open **http://localhost:5173**:

1. **Log in / Sign up** (skipped when Auth0 isn't configured; everything is then saved as "guest").
2. **Hand in your notes**: paste text, or choose a PDF / .txt / .md file → *Generate questions & play*.
3. **Play**: the Professor asks the questions Gemini generated from your notes.
4. **← My notes** returns to the home screen, where saved sets can be played again or deleted.

Add `?debug` to the URL to see the hidden survival stats while playing.

The server won't start without `DATABASE_URL`. The tables are created once with `node server/setup-db.js`
(already done for the shared database; see `server/src/db/README.md`).
Auth0 setup: **`server/src/auth/README.md`**.

`npm test` runs all tests: server (notes/PDF glue + database; the database tests use a separate
`test` schema in Tiger Data, never real game data) and client (question set → game adapter).

> ⚠️ **Never commit `.env`.** It's in `.gitignore`.

## Project structure

```
client/                    Browser side (React + Vite)
  src/main.js              Entry point: renders <App />
  src/App.jsx              Screens: login → home (upload + saved sets) → game
  src/components/          UploadNotes, SavedSets (app screens) + Robot, DialogueBox, ChoiceBox, GameOver (game)
  src/GameApp.jsx          The game (visual novel engine)
  src/game/                story.js (script as data), stats.js, questionProvider.js,
                           questionSetAdapter.js (saved questions → game format), game.css
  src/api/api.js           Calls to our server (attaches the login token); files.js = PDF/file helpers
  src/auth/auth.js         Auth0 login / sign-up / logout
  test/                    Client tests
  public/assets/           Sprites, tilesets, sounds
server/                    Backend (holds the secret keys)
  src/routes/              API endpoints (see its README)
  src/auth/                Auth0 token check + setup guide
  src/db/                  Tiger Data PostgreSQL: users, question_sets, questions
  src/gemini/              Gemini API: PDF → text, notes → questions
  src/services/            Glue: notes/PDF → Gemini → database
  test/                    Tests (database + notes/PDF glue)
deploy/                    Hosting (Vultr + .study domain), later
```

## How the pieces connect

```
App.jsx ─ UploadNotes ─→ client/src/api ──(login token)──→ POST /api/notes → Gemini → database
        └ SavedSets ───→ client/src/api ──────────────────→ GET /api/question-sets/:id
        → questionSetAdapter (renames fields) → GameApp asks those questions
```

## Game notes

- Edit the story in `client/src/game/story.js` (plain data: `scene`, `say`, `q`, `choice`, `end`).
  `*text in asterisks*` renders as glitch text in the Professor's lines.
- The story currently has **4** question spots; Gemini generates **10** per upload. Add more `q(...)` nodes to use them all
  (after a set runs out, questions repeat rather than erroring).
- `GameApp` accepts optional `script` and `hooks` props (`onAnswer`, `onChoice`, `onDeath`, `onEnd`).
- `client/src/game/game.js` is the old DOM-based engine and is no longer used.

### Manual game test checklist
1. Advance dialogue, including skipping the typing animation.
2. Answer a question correctly and incorrectly on separate playthroughs.
3. Make a water choice, descend to the stairwell, and select cafeteria food.
4. Reach the chapter completion screen, then restart.
5. Try bad choices and wrong answers to verify death/restart.
6. With `?debug`, verify hunger/thirst decay every two questions.

## Team workflow

- Work on a branch: `git checkout -b your-name/feature`
- Commit small, push, open a Pull Request; a teammate merges it.
- `git pull` before you start working.
