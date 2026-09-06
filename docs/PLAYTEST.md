# Playtest — friends on Discord

## What they can do today

There is **no login server** yet. GitHub Pages is a static site. Each friend plays in their own browser with their own autosave.

They can still help find bugs:

1. Open the live game (GitHub Pages URL for this repo, or your `npm run dev` tunnel).
2. Type their **Discord name** in the playtester box.
3. Play. Use **Export** if something breaks and send you the `.json` plus a screenshot.
4. Use **New Game** to roll a fresh seeded world.

Suggested Pages URL once Actions has published:

`https://kyoshicodes.github.io/second-crown/`

If that 404s: repo Settings → Pages → Source = GitHub Actions. Then re-run the **Deploy to GitHub Pages** workflow.

## What they cannot do yet

- One shared world
- Accounts / passwords
- Seeing each other on the map
- Guilds with real people in them

Those need a backend (accounts + a room). Prep for that is in `docs/ACCOUNTS-PREP.md`.

## Bug report template (paste in Discord)

```
Tester:
Tab:
What I did:
What I expected:
What happened:
Screenshot:
Save attached: yes/no
```
