# HTTPS on the Oracle playtest box

Last updated: 2026-09-06

Let's Encrypt will not issue a certificate for a bare IP. We use a free hostname that already points at your VM:

`https://129.153.17.72.sslip.io`

That name is not something you register. It always resolves to `129.153.17.72`.

## 1. Oracle Cloud security list

Add ingress if missing:

- TCP **80** from `0.0.0.0/0` (Let's Encrypt check)
- TCP **443** from `0.0.0.0/0` (HTTPS)

Keep 22 and 8787 as they are.

## 2. On the VM (SSH)

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

sudo apt-get update
sudo apt-get install -y caddy

sudo tee /etc/caddy/Caddyfile >/dev/null <<'EOF'
129.153.17.72.sslip.io {
  reverse_proxy 127.0.0.1:8787
}
EOF

sudo systemctl enable --now caddy
sudo systemctl reload caddy
curl -sI https://129.153.17.72.sslip.io/health | head
```

You want `HTTP/2 200` (or HTTP/1.1 200) from that last curl.

## 3. Point Discord + the game at HTTPS

In the Discord Developer Portal → your app → OAuth2 → Redirects, add:

`https://129.153.17.72.sslip.io/auth/discord/callback`

Keep the old HTTP redirect until you confirm login works, then you can delete it.

On the VM, restart cloud with the new public URL (paste as one block):

```bash
cd ~/second-crown
git pull
npm test
npm run build -w @second-crown/app
pm2 delete sc-cloud
PORT=8787 CORS_ORIGIN=* \
PUBLIC_APP_URL=https://129.153.17.72.sslip.io \
DISCORD_REDIRECT=https://129.153.17.72.sslip.io/auth/discord/callback \
DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID" \
DISCORD_CLIENT_SECRET="$DISCORD_CLIENT_SECRET" \
pm2 start server/index.mjs --name sc-cloud
pm2 save
```

If `echo $DISCORD_CLIENT_ID` is empty, open `~/.pm2/dump.pm2` or set the two Discord values you used originally before that start command.

## 4. Play on HTTPS

Open `https://129.153.17.72.sslip.io/` — not the raw IP.

Old `http://129.153.17.72:8787/` still works on port 8787 until you close that port. Prefer the https hostname so Discord stops warning.
