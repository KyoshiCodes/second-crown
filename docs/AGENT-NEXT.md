# Next dual-agent bakeoff (ready when you are)

Live: https://129.153.17.72.sslip.io/
Repo main is the source of truth.

## Do not touch
packages/sim combat math, tick engine, server Discord env, Caddyfile.

## Claude track (architecture)
Split remaining god-files if any. Add a WarRoom component: odds, levy, fight, last battle phases, decree status. Keep hooks in useGameEngine.

## Gemini track (presentation)
Paint chapel and walls on the map. Richer BattleVisual (banners, phase cards). Optional second music bed switcher UI only.

## Shared gate
npm test && npm run build -w @second-crown/app
git diff main -- packages/sim should stay empty on Gemini's branch if they only do art.
