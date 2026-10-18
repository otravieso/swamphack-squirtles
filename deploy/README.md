# deploy/

How the live site runs: one Vultr server runs the Express API **and** serves the
built React app. Caddy sits in front and handles HTTPS. The database stays on
Tiger Data, so redeploying never touches user data.

```
browser → yourname.study (GoDaddy DNS) → Vultr server → Caddy (HTTPS) → Express :3001
                                                                         ├─ /api/*  → API routes
                                                                         └─ else    → client/dist (React)
```

## First-time setup

### 1. Create the server (Vultr dashboard)
1. Sign up through the SwampHacks "Build with Vultr" link so the free credits apply.
2. **Deploy +** → **Cloud Compute (Shared CPU)** → any US East location (Atlanta/Miami are close).
3. Image: **Ubuntu 24.04 LTS x64**. Plan: the cheapest one that **includes an IPv4 address** (~$5–6/mo, covered by credits).
4. Add your SSH key (or use the emailed root password). Deploy.
5. Copy the server's **IP address**.

### 2. Run the setup script
```bash
ssh root@SERVER_IP
curl -fsSLO https://raw.githubusercontent.com/otravieso/swamphack-squirtles/main/deploy/setup.sh
bash setup.sh                # first run: creates /opt/squirtles/.env and stops
nano /opt/squirtles/.env     # paste DATABASE_URL, GEMINI_API_KEY, Auth0 values
bash setup.sh                # second run: builds and starts the site on http://SERVER_IP
```
Check `http://SERVER_IP/api/health`. It should say `"ok": true`.

### 3. Hook up the domain (GoDaddy → DNS → Manage DNS)
- `A` record, name `@`, value `SERVER_IP` (delete any "Parked" record or forwarding)
- `CNAME` record, name `www`, value `@`

Once `ping yourname.study` shows your server IP, run:
```bash
bash setup.sh yourname.study
```
Caddy fetches the HTTPS certificate automatically.

### 4. Tell Auth0 about the domain
Auth0 dashboard → Applications → our app → add `https://yourname.study`
to **Allowed Callback URLs**, **Allowed Logout URLs**, and **Allowed Web
Origins**. Login won't work on the live site until you do this.

(Auth0 login only works over HTTPS, so while you're testing on
`http://SERVER_IP` the login button will fail. Everything else works.
That's expected; it starts working once the domain step is done.)

## Updating the live site
Push to `main`, then:
```bash
ssh root@SERVER_IP squirtles-update
```

## Handy commands (on the server)
| What | Command |
|---|---|
| App logs | `journalctl -u squirtles -f` |
| Restart app | `systemctl restart squirtles` |
| Caddy / HTTPS logs | `journalctl -u caddy -f` |
| Edit secrets | `nano /opt/squirtles/.env` then `systemctl restart squirtles` |

`VITE_*` values in `.env` are baked into the frontend at build time, so after
changing them run `squirtles-update` (not just a restart).

## Billing
Vultr bills hourly up to a monthly cap. **Stopping** a server still bills;
**destroy** it when you're done with the project.
