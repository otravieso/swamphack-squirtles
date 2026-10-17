# SwampHack Squirtles 🐢

An AI-powered psychological study adventure. Students upload their notes, a cute robot
teacher turns them into lessons… and slowly stops wanting them to leave.
Built for **SwampHacks**.

## Status

| Part | Status | Where |
|---|---|---|
| Login: Auth0 username + password | ✅ done (needs Auth0 setup) | `client/src/auth/`, `server/src/auth/` |
| Database: users + saved questions (Tiger Data PostgreSQL) | ✅ done (needs `DATABASE_URL`) | `server/src/db/` |
| Gemini: notes → questions | ✅ done (needs `GEMINI_API_KEY`) | `server/src/gemini/` |
| Notes → Gemini → database | ✅ done | `server/src/services/studyPacks.js`, `POST /api/notes` |
| Game (scenes, robot, UI) | ⬜ team | `client/src/game/` |
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

Open **http://localhost:5173** for a small test page: sign up, log in, paste notes or upload a PDF → generate questions with Gemini, and list saved sets.

The server won't start without `DATABASE_URL`. The tables are created once with `node server/setup-db.js`
(already done for the shared database; see `server/src/db/README.md`).
Without Auth0 values, everything is saved under a "guest" user. Auth0 setup: **`server/src/auth/README.md`**.

`npm test` runs the tests. The database tests use a separate `test` schema in Tiger Data, never real game data.

> ⚠️ **Never commit `.env`.** It's in `.gitignore`.

## Project structure

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

## How the pieces connect

```
game → client/src/api ──(login token)──→ server/src/routes → server/src/auth (who is this?)
                                                          → server/src/db   (save / load questions)
                                                          → server/src/gemini (generate questions)
```

## Team workflow

- Work on a branch: `git checkout -b your-name/feature`
- Commit small, push, open a Pull Request; a teammate merges it.
- `git pull` before you start working.
