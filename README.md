# SwampHack Squirtles 🐢

> *Learning has never been this fun! ★*

An AI-powered psychological study adventure. Students upload their notes, and a cute robot
teacher turns them into lessons inside a cozy pixel-art school. Answer questions to progress
and reach the exit… but the closer you get, the less the teacher wants you to leave.

Inspired by Stardew Valley, Oregon Trail, Baldi's Basics and Doki Doki Literature Club.
Built for **SwampHacks**.

## Tech stack

| Part | Tech | Hackathon challenge |
|---|---|---|
| Game (browser) | [Phaser 3](https://phaser.io) + [Vite](https://vite.dev), plain JavaScript | n/a |
| Notes → questions, robot dialogue | Gemini API (key from Google AI Studio), structured JSON output | **Best Use of Gemini API** |
| Login + saved progress | Auth0 (SPA SDK + JWT-verified API) | **Best Use of Auth0** |
| Server / hosting | Node + Express on a Vultr instance | **Best Use of Vultr** |
| Domain | `.study` domain from GoDaddy Registry | **Best Domain Name** |
| Write-up | `docs/devlog.md` → dev.to | **DEV Writing Challenge** |

See [`docs/challenges.md`](docs/challenges.md) for the full checklist.

## Getting started

**Requirements:** [Node.js 20+](https://nodejs.org) and Git.

```bash
git clone https://github.com/otravieso/swamphack-squirtles.git
cd swamphack-squirtles
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
npm run dev
```

Open **http://localhost:5173**.

- The game works **with no keys at all**: it uses sample questions and plays as a guest.
- Add `GEMINI_API_KEY` to `.env` to generate questions from real notes.
- Fill the `AUTH0_*` / `VITE_AUTH0_*` values to turn on login.
- Restart `npm run dev` after editing `.env`.

> ⚠️ **Never commit `.env`** or paste keys into code. It's already in `.gitignore`.
> If a key leaks, revoke it in AI Studio / Auth0 right away.

## Project structure

```
client/                     Browser game (Vite + Phaser)
  src/scenes/               Boot → Title → Upload → Classroom → Escape
  src/robot/Robot.js        The teacher (placeholder shapes; swap for sprites)
  src/ui/widgets.js         Dialogue box, question panel, buttons
  src/auth/auth.js          Auth0 login
  src/api/api.js            Calls to our server
  public/assets/            Sprites, tilesets, sounds
server/                     Express API (holds all secret keys)
  src/gemini/               Gemini client, schemas, question + dialogue generation
  src/routes/               /api/notes, /api/progress, /api/dialogue
  src/auth/requireAuth.js   Auth0 token check (guest mode when unset)
  src/store/                Saved progress (JSON file for now)
deploy/                     Vultr setup script + nginx config + domain steps
docs/                       Challenge checklist + devlog
```

## How the game loop works

1. Student uploads notes (PDF, photos of handwritten notes, or .txt/.md).
2. `POST /api/notes` sends them to Gemini, which returns topics + ~20 multiple-choice
   questions as **guaranteed JSON** (see `server/src/gemini/schemas.js`).
3. The classroom asks questions one by one. Answers are graded on the server.
4. Correct answers raise the robot's **corruption stage** (0 cheerful → 3 desperate).
   Its face, the room color, glitches and its Gemini-written dialogue all change.
5. Answer everything to reach the exit door.

## Team workflow

- `main` should always run. Do work on a branch: `git checkout -b feature/escape-scene`
- Commit small, push often, open a Pull Request, and have a teammate merge it.
- Pull before you start: `git pull origin main`
- Suggested split: **game/scenes**, **art + dialogue writing**, **Gemini prompts/server**, **Auth0 + deploy**.

## Deploying

See [`deploy/README.md`](deploy/README.md): Vultr server + `.study` domain + HTTPS.
