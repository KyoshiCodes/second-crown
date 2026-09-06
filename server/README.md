# Second Crown cloud (playtest)

Stores player saves. Does not run the game simulation.

## Run locally

```bash
cd server
node index.mjs
```

Default: http://localhost:8787

## Environment

| Name | Purpose |
|---|---|
| PORT | listen port (Render/Fly set this) |
| CORS_ORIGIN | your Pages URL, or * for playtest |
| DISCORD_CLIENT_ID | from Discord Developer Portal |
| DISCORD_CLIENT_SECRET | from Discord Developer Portal |
| DISCORD_REDIRECT | `{server}/auth/discord/callback` |
| PUBLIC_APP_URL | game URL (Pages or localhost:5173) |
| DATA_DIR | where JSON is written |

## Discord app (you create this once)

1. https://discord.com/developers/applications → New Application → Second Crown Playtest
2. OAuth2 → add redirect `{your-server}/auth/discord/callback`
3. Copy Client ID and Secret into the host env vars.
4. Scopes: `identify` only.

## Host (easiest free path)

Render / Fly / Railway: root command `node server/index.mjs`, start directory `server`.
Keep the disk or use a persistent volume so saves survive restarts.
