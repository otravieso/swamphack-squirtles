# SwampHack Squirtles 🐢

An AI-powered psychological study adventure. Students upload their notes, a cute robot
teacher turns them into lessons… and slowly stops wanting them to leave.
Built for **SwampHacks**.

## Project structure

```
client/                Browser side (what the player sees)
  src/game/            Game code: scenes, robot teacher, dialogue, question UI
  src/api/             Functions that call our server
  src/auth/            Auth0 login (browser)
  public/assets/       Sprites, tilesets, sounds
server/                Backend (holds the secret keys)
  src/routes/          API endpoints, e.g. POST /api/notes
  src/gemini/          Gemini API: notes → questions
  src/auth/            Auth0 token checks
deploy/                Hosting (Vultr + .study domain), later
```

Each folder has a short README describing what belongs there.

## How the pieces connect

```
game (client/src/game) → client/src/api → server/src/routes → server/src/gemini → Gemini API
                         client/src/auth ──(login token)──→ server/src/auth
```

The browser never calls Gemini directly. The API key stays on the server.

## Secrets

Copy `.env.example` to `.env` and fill in keys. **Never commit `.env`** (it's in `.gitignore`).

## Team workflow

- Work on a branch: `git checkout -b your-name/feature`
- Commit small, push, open a Pull Request; a teammate merges it.
- `git pull` before you start working.
