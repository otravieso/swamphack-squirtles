# Gameplay fixes for Edgar branch

No files in GitHub were changed by this package.

## Apply
1. Switch to the `Edgar` branch and pull latest changes.
2. Preserve existing `client/index.html` and `client/src/main.js` if teammates still need the test page; see notes below.
3. Copy these files into the matching repository paths.
4. Keep your existing `client/src/game/story.js` and `client/src/game/game.css` unchanged.
5. Delete or archive the old `client/src/game/game (1).js` after switching imports to `game.js`.
6. In repository root run `npm install -w client react react-dom` (or `cd client && npm install react react-dom`).
7. Run `npm run dev` from repository root if that script starts the client; otherwise `cd client && npm run dev`.
8. Open Vite's displayed localhost URL and test questions, choices, death, restart, and completion.

## Important integration note
The existing `client/index.html` and `client/src/main.js` are the auth/database test page. Replacing them will hide that page. To preserve it, copy the original HTML to `client/dev-tools.html`, change its script to `/src/dev-tools.js`, and copy original `client/src/main.js` to `client/src/dev-tools.js` BEFORE replacing the two files. The existing auth/database tools will then be accessible at `/dev-tools.html` during development.

## Limits
This is a source-level patch. Full browser testing, deployment, Gemini, and Auth0 were not validated. The current story has only four question nodes; a 20-question experience requires extending `story.js` and supplying more questions. React is mounted without JSX so no additional Vite React plugin is required for this patch.
