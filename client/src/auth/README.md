# client/src/auth/

`auth.js`: Auth0 login in the browser. Login and sign-up use Auth0's hosted
username + password page.

```js
import { initAuth, login, signup, logout } from './auth.js';
const { user } = await initAuth(); // once at startup; user is null if logged out
```

Setup steps: `server/src/auth/README.md`.
