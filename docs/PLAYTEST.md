# Playtest — friends on Discord

## Fast path (guest codes, no Discord app yet)

1. You run the cloud server (`server/README.md`) on your PC or a free host.
2. Friends open the game (Pages or your `npm run dev`).
3. They paste the cloud URL into **Cloud playtest** if it is not localhost.
4. Click **Guest session** → play → **Push save** when they hit a bug.
5. You **Pull save** on your machine (same guest token only works on their browser). For sharing a broken save they still Export JSON into Discord.

Guest sessions live in that browser. Discord login is what lets them keep the same save on phone + PC.

## Discord login (when you are ready)

Create an application at https://discord.com/developers/applications
Redirect: `{cloud-server}/auth/discord/callback`
Env vars: see `server/README.md`
Then the **Log in with Discord** button enables itself (`/health` reports discord: true).

## Pages URL

`https://kyoshicodes.github.io/second-crown/`

## Bug report template

```
Tester:
Signed in: guest / discord
Tab:
What I did:
What I expected:
What happened:
Screenshot:
Save: pushed to cloud / attached json
```
