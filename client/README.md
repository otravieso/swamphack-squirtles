# client/

The browser side: everything the player sees (React + Vite).

| Path | What it is |
|---|---|
| `src/App.jsx` | Screen manager: login → home (upload notes + saved sets) → game |
| `src/components/UploadNotes.jsx` | Paste notes or pick a PDF/.txt/.md → Gemini → saved set → play |
| `src/components/SavedSets.jsx` | The player's saved sets: play again or delete |
| `src/GameApp.jsx` + `src/components/{Robot,DialogueBox,ChoiceBox,GameOver}.jsx` | The game |
| `src/game/` | Story script, stats, question provider, and `questionSetAdapter.js` (saved questions → game format) |
| `src/api/` | `api.js`: calls to our server (`/api/...`); `files.js`: PDF/file helpers. Never calls Gemini directly |
| `src/auth/` | Auth0 login / logout in the browser |
| `test/` | Client tests (`npm test -w client`) |
| `public/assets/` | Pixel-art sprites, tilesets, fonts, sounds |
