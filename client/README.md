# client/

The browser side: everything the player sees.

| Folder | What goes here |
|---|---|
| `src/game/` | Game code: scenes, the robot teacher, dialogue boxes, question UI |
| `src/api/` | Functions that call our server (`/api/...`). The game calls these and never calls Gemini directly |
| `src/auth/` | Auth0 login / logout in the browser |
| `public/assets/` | Pixel-art sprites, tilesets, fonts, sounds |
