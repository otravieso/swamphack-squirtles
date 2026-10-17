# Deploying: Vultr + GoDaddy Registry (.study domain)

The game and API run as **one Node server** on a Vultr instance, behind nginx with HTTPS.

## 1. Vultr server
1. Sign up through the MLH Vultr link and claim the free credits.
2. **Deploy → Cloud Compute → Shared CPU**, Ubuntu 24.04, smallest plan is fine.
3. Copy the server's **IP address**.

## 2. Domain (GoDaddy Registry challenge)
1. Register a **.study** domain through the MLH link (tech.study).
2. In the domain's DNS settings add:
   | Type | Name | Value |
   |------|------|-------|
   | A | `@` | your Vultr IP |
   | A | `www` | your Vultr IP |
3. Wait a few minutes for DNS to update (`nslookup yourdomain.study`).

## 3. Install
SSH in (`ssh root@YOUR_IP`) and run:
```bash
curl -fsSL https://raw.githubusercontent.com/otravieso/swamphack-squirtles/main/deploy/vultr-setup.sh | bash -s -- yourdomain.study
nano /opt/swamphack-squirtles/.env   # paste real keys; set CLIENT_ORIGIN=https://yourdomain.study
cd /opt/swamphack-squirtles && npm run build && pm2 restart squirtles
```
> `VITE_*` values are baked in at build time, so **re-run `npm run build`** after changing them.

## 4. Auth0 production URLs
In the Auth0 application settings, add `https://yourdomain.study` to **Allowed Callback URLs**,
**Allowed Logout URLs** and **Allowed Web Origins**.

## Updating after new commits
```bash
cd /opt/swamphack-squirtles && git pull && npm install && npm run build && pm2 restart squirtles
```
