# server/src/auth/: Auth0 setup (username + password login)

Auth0 stores usernames and passwords (hashed, with breach detection etc.).
Our database only stores the Auth0 user id and username, plus their questions.
Email is turned off: players sign up with just a username and password.

`requireAuth.js` checks the login token on every protected request and creates the
user's row in our database the first time they show up.

## One-time setup (≈10 minutes, free, no credit card)

### 1. Create a tenant
Sign up at **auth0.com** (use the MLH link for the challenge). Note your domain, e.g. `dev-abc123.us.auth0.com`.

### 2. Turn on usernames
**Authentication → Database → Username-Password-Authentication**
- Enable usernames. Older dashboards have a **"Requires Username"** toggle. Newer ones set it
  under the connection's **Attributes** tab (add *Username* as an identifier).
- On the same **Attributes** tab, configure **Email**: turn off "Use as Identifier" and set signup to **Off**.
- Optional: set the password policy strength on the same page.

### 3. Create the app (for the browser game)
**Applications → Create Application → Single Page Application**
- **Settings** tab:
  - Allowed Callback URLs: `http://localhost:5173`
  - Allowed Logout URLs: `http://localhost:5173`
  - Allowed Web Origins: `http://localhost:5173`
  - (Add your real domain here too once deployed.)
- **Connections** tab: make sure **Username-Password-Authentication** is on.
- Copy the **Domain** and **Client ID**.

### 4. Create the API (for our server)
**Applications → APIs → Create API**
- Name: `SwampHack Squirtles API`
- Identifier: `https://swamphack-squirtles/api` (just a name, doesn't need to be a real URL)
- Signing algorithm: RS256

### 5. Put the username into the login token
Access tokens don't include the username by default. Add it with an Action:

**Actions → Library → Create Action → Build from scratch**, trigger **Login / Post Login**:

```js
exports.onExecutePostLogin = async (event, api) => {
  const ns = 'https://swamphack-squirtles/';
  api.accessToken.setCustomClaim(ns + 'username', event.user.username || event.user.nickname);
};
```

Click **Deploy**, then go to **Actions → Triggers → post-login**, drag the action into the flow, and **Apply**.

### 6. Fill in `.env` (root folder)
```
AUTH0_DOMAIN=dev-abc123.us.auth0.com
AUTH0_AUDIENCE=https://swamphack-squirtles/api
VITE_AUTH0_DOMAIN=dev-abc123.us.auth0.com
VITE_AUTH0_CLIENT_ID=<client id from step 3>
VITE_AUTH0_AUDIENCE=https://swamphack-squirtles/api
```
Restart `npm run dev`. On http://localhost:5173 click **Sign up**, create an account, then
**Who am I?** should show your username from the database.

## Troubleshooting
- **"Please log in" (401):** not logged in, or `AUTH0_AUDIENCE` doesn't match the API identifier exactly.
- **Callback URL mismatch:** the URL in step 3 must match exactly (no trailing slash).
- **username is null:** step 5's Action isn't deployed *and* added to the post-login trigger. Log out and back in after fixing.
