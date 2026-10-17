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

- The story in `client/src/game/story.js` is transcribed **word for word** from the team script
  (only formatting differs: `*text*` = glitch text for the Professor's noises, stage directions shown as `(pauses)`).
  It has **14** question spots (including two Rapid Fire rounds); Gemini generates 10 per upload, so a few repeat.
- `GameApp` accepts optional `script` and `hooks` props (`onAnswer`, `onChoice`, `onDeath`, `onEnd`).
- `client/src/game/game.js` is the old DOM-based engine and is no longer used.

### Survival stats (Oregon Trail style)

| Stat | Starts at | Lost by |
|---|---|---|
| **Intellect** (`intelligence`) | 5 | 1 per wrong answer |
| **Health** | 5 | water bottle −1, running the stairs −2, egg salad −1, chicken nuggets −1, robo fuel −1, sprint/punch/cloth −1 |
| **Thirst** | 3 | licking the desk / not drinking −1, the railing −1, lasagna −1, the nugget drink −1 |
| **Hunger** | 2 | the window ledge −1, egg salad −1 |

Any stat reaching 0 ends the game. There is no timer: stats only change through the script's decisions and answers
(`DECAY_EVERY = 0` in `stats.js`). Add `?debug` to the URL to see the stats while playing.

**Order when a stat runs out** (handled in `GameApp.jsx` with a `_checkDeath` step):
1. **Decision:** the stat changes → that decision's narration from the script is shown → *then* the game-over screen.
2. **Wrong answer:** the Professor's reaction → intellect −1 and the "Correct answer: …" explanation → *then* game over.
3. The game-over screen says **"You died"** and **"Cause of death: health / thirst / hunger / intelligence"**.

### Final score (`client/src/game/score.js`, logic only, no UI yet)

`computeScore(stats, { completed })`: **100 per intellect point** (the most important), 40 per health, 30 per hunger,
30 per thirst, plus **250** for reaching the end. A perfect run scores **1,100**; dying gives no completion bonus.
The game passes `stats` to its `onEnd({ stats })` and `onDeath({ cause, stats })` hooks, so any screen can show it.

### Manual game test checklist
1. Advance dialogue, including skipping the typing animation.
2. Answer a question correctly and incorrectly on separate playthroughs.
3. Make a water choice, descend the stairs, pick cafeteria food and a drink, then the library escape choice.
4. Reach the chapter completion screen, then restart.
5. Try bad choices and wrong answers to verify death/restart.
6. With `?debug`, verify each choice changes the stats listed in the table above (and nothing changes on its own).

## Team workflow

- Work on a branch: `git checkout -b your-name/feature`
- Commit small, push, open a Pull Request; a teammate merges it.
- `git pull` before you start working.
