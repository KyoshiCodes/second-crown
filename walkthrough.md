# Walkthrough — merged bakeoff (Claude + Gemini + Astra)

## Claude
War tab renders `WarRoom`. Fight, peace, levy, and decree/fortify status live there. `warSummary()` is read-only.

## Gemini
Seasons change weather particles, map ground, and music. Holidays can be forced from TesterBar → Holiday overlay. Spoils use rarity chips. Music toggle still mutes everything.

## Astra
World → Practice exchange and PvP ledger. Discord only. Practice gold/iron are **not** kingdom resources. Challenges lock a power snapshot; they do not fight or pay loot.

## Verify
npm test
npm run build -w @second-crown/app
node --test server/ledger.test.mjs server/ledger-http.test.mjs
