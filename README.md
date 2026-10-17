# React gameplay conversion — Edgar branch

This archive contains **new or replacement files only**. No GitHub changes were made.

## Copy files

Copy `client/src/GameApp.jsx` into the same path in your repository, replacing the old component.
Copy all four `.jsx` files from `client/src/components/` into a new `client/src/components/` folder.

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

## Test

1. Advance dialogue, including skipping the typing animation.
2. Answer a question correctly and incorrectly on separate playthroughs.
3. Make a water choice, descend to the stairwell, and select cafeteria food.
4. Reach the chapter completion screen, then restart.
5. Try bad choices and wrong answers to verify death/restart.
6. Test with `?debug` to verify hunger/thirst decay every two questions.

The story has four question nodes. The sample question provider has five unique questions; expanding the story beyond five question nodes requires additional questions or Gemini integration.

## Integration

`GameApp` accepts optional `script` and `hooks` props. `hooks` supports `onAnswer`, `onChoice`, `onDeath`, and `onEnd`.
The question provider still uses `getQuestion({difficulty, seen})` and `setQuestionProvider(...)`.

## Important

Vite stays in the project as the development/build tool. React now renders and manages the entire gameplay UI. The code has not been browser-tested against your machine, so check the browser console if an error appears.
