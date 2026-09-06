# Discord login (Oracle playtest)

Game + API: `http://129.153.17.72:8787`

## Discord Developer Portal

1. Open your app → **OAuth2**
2. **Redirects** — add exactly:
   `http://129.153.17.72:8787/auth/discord/callback`
3. Copy **Client ID** and **Client Secret**
4. OAuth2 scopes needed: `identify` only

## On the Oracle VM

```bash
cd ~/second-crown/server
pm2 delete sc-cloud
DISCORD_CLIENT_ID=PASTE_ID \
DISCORD_CLIENT_SECRET=PASTE_SECRET \
DISCORD_REDIRECT=http://129.153.17.72:8787/auth/discord/callback \
PUBLIC_APP_URL=http://129.153.17.72:8787 \
CORS_ORIGIN=* \
PORT=8787 \
pm2 start index.mjs --name sc-cloud
pm2 save
curl -s http://127.0.0.1:8787/health
```

Health should show `"discord":true`.

Do not commit the secret. It lives only in pm2 env on the VM.
